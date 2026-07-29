import { error, fail, redirect } from '@sveltejs/kit';
import { formatMoneyForInput } from '$lib/format';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import {
	buildEditedLedger,
	simulateLedger,
	validateTransactionForm,
	type LedgerRowWithId,
	type TransactionFormErrors,
	type TransactionFormInput
} from '$lib/server/transactions';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: 取得・書き込みと検証関数の呼び出しのみ。
// 登録（../+page.server.ts）と同じ形だが、編集は対象取引を load でプリフィルし、
// 台帳検証は「対象を差し替えた最終状態」を simulateLedger にかける点が異なる。

// "123" のような正の整数文字列だけを ID として解釈する。
function parseId(value: string | null): number | null {
	return value && /^\d+$/.test(value) ? Number(value) : null;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	if (id === null) {
		error(404, '取引が見つかりません');
	}

	const [accounts, assets, target] = await Promise.all([
		prisma.account.findMany({
			select: { id: true, name: true, type: true },
			orderBy: { id: 'asc' }
		}),
		prisma.asset.findMany({
			select: { id: true, name: true, type: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		prisma.transaction.findUnique({
			where: { id },
			select: {
				id: true,
				accountId: true,
				assetId: true,
				type: true,
				occurredAt: true,
				quantity: true,
				amount: true,
				currency: true,
				note: true
			}
		})
	]);

	if (target === null) {
		error(404, '取引が見つかりません');
	}

	// フォームのプリフィル値。すべて文字列にし、フォーム再表示（form?.values）と
	// 同じ形で扱えるようにする。金額は最小通貨単位 Int を入力用文字列へ戻す。
	const prefill: TransactionFormInput = {
		accountId: String(target.accountId),
		assetId: String(target.assetId),
		type: target.type,
		occurredAt: target.occurredAt.toISOString().slice(0, 10),
		quantity: target.quantity === null ? '' : String(target.quantity),
		amount: formatMoneyForInput(target.amount, target.currency),
		note: target.note ?? ''
	};

	return { id, accounts, assets, prefill };
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const id = parseId(params.id);
		if (id === null) {
			error(404, '取引が見つかりません');
		}

		const form = await request.formData();
		const input: TransactionFormInput = {
			accountId: formString(form, 'accountId'),
			assetId: formString(form, 'assetId'),
			type: formString(form, 'type'),
			occurredAt: formString(form, 'occurredAt'),
			quantity: formString(form, 'quantity'),
			amount: formString(form, 'amount'),
			note: formString(form, 'note')
		};

		// 編集対象の現在の所属（旧グループ）を押さえる。移動した場合の旧グループ検証に使う。
		const target = await prisma.transaction.findUnique({
			where: { id },
			select: { accountId: true, assetId: true, asset: { select: { type: true } } }
		});
		if (target === null) {
			error(404, '取引が見つかりません');
		}

		const accountId = parseId(input.accountId);
		const assetId = parseId(input.assetId);
		const [account, asset] = await Promise.all([
			accountId === null
				? null
				: prisma.account.findUnique({ where: { id: accountId }, select: { id: true } }),
			assetId === null
				? null
				: prisma.asset.findUnique({
						where: { id: assetId },
						select: { id: true, type: true, currency: true }
					})
		]);

		// 「今日」はサーバのローカル暦日を UTC 深夜 0 時に写して渡す（parseDateOnly 参照）
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		const result = validateTransactionForm(input, account, asset, today);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		// 検証 ok の時点で asset は必ず存在する。崩れていたらバグとして fail fast
		if (asset === null) {
			throw new Error('asset is null after successful validation (bug)');
		}

		// 2 段目: 台帳のシミュレーション検証。対象を候補に差し替えた最終状態を検証する。
		// 口座・資産が変わらなければ 1 グループの差し替え、変わったら旧グループ（対象を
		// 除く）と新グループ（候補を追加）の両方を検証する。
		const { value } = result;
		const candidate: LedgerRowWithId = {
			id,
			type: value.type,
			occurredAt: value.occurredAt,
			quantity: value.quantity,
			amount: value.amount
		};
		const sameGroup = target.accountId === value.accountId && target.assetId === value.assetId;

		let violation: string | null;
		if (sameGroup) {
			const groupRows = await prisma.transaction.findMany({
				where: { accountId: value.accountId, assetId: value.assetId },
				select: { id: true, type: true, occurredAt: true, quantity: true, amount: true },
				orderBy: { id: 'asc' }
			});
			violation = simulateLedger(asset.type, buildEditedLedger(groupRows, id, candidate));
		} else {
			const [oldRows, newRows] = await Promise.all([
				prisma.transaction.findMany({
					where: { accountId: target.accountId, assetId: target.assetId },
					select: { id: true, type: true, occurredAt: true, quantity: true, amount: true },
					orderBy: { id: 'asc' }
				}),
				prisma.transaction.findMany({
					where: { accountId: value.accountId, assetId: value.assetId },
					select: { id: true, type: true, occurredAt: true, quantity: true, amount: true },
					orderBy: { id: 'asc' }
				})
			]);
			// 旧グループ: 対象が抜けた残りが健全か（BUY を移すと後続 SELL が売り越し等）
			violation = simulateLedger(target.asset.type, buildEditedLedger(oldRows, id, null));
			// 新グループ: 候補を加えた集合が健全か
			if (violation === null) {
				violation = simulateLedger(asset.type, buildEditedLedger(newRows, id, candidate));
			}
		}
		if (violation !== null) {
			const errors: TransactionFormErrors = {
				ledger: `台帳の整合性が崩れるため更新できません（${violation}）`
			};
			return fail(400, { errors, values: input });
		}

		await prisma.transaction.update({ where: { id }, data: value });

		// 更新後の行は一覧で確認できるため、取引一覧へ戻す
		redirect(303, '/transactions');
	}
};
