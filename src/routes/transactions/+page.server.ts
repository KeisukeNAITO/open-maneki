import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import {
	buildDepositSuggestion,
	checkLedgerInvariants,
	validateTransactionForm,
	type TransactionFormErrors,
	type TransactionFormInput
} from '$lib/server/transactions';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証関数の呼び出しのみを行い、検証ルールは lib/server/transactions.ts に置く。
export const load: PageServerLoad = async () => {
	const [accounts, assets, recentTransactions] = await Promise.all([
		prisma.account.findMany({
			select: { id: true, name: true, type: true },
			orderBy: { id: 'asc' }
		}),
		prisma.asset.findMany({
			select: { id: true, name: true, type: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		// 登録直後の確認用に直近分だけ見せる（発生日の新しい順、同日は登録の新しい順）
		prisma.transaction.findMany({
			select: {
				id: true,
				type: true,
				occurredAt: true,
				quantity: true,
				amount: true,
				currency: true,
				note: true,
				account: { select: { name: true } },
				asset: { select: { name: true } }
			},
			orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
			take: 20
		})
	]);
	return { accounts, assets, recentTransactions };
};

// "123" のような正の整数文字列だけを ID として解釈する。
function parseId(value: string | null): number | null {
	return value && /^\d+$/.test(value) ? Number(value) : null;
}

export const actions: Actions = {
	default: async ({ request }) => {
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

		// 検証 ok の時点で asset は必ず存在する。TS の絞り込みが呼び出し側まで
		// 届かないため、崩れていたらバグとして fail fast
		if (asset === null) {
			throw new Error('asset is null after successful validation (bug)');
		}

		// 2 段目: 台帳のシミュレーション検証（対象は同じ口座 × 資産の既存取引のみ）
		const { value } = result;
		const existing = await prisma.transaction.findMany({
			where: { accountId: value.accountId, assetId: value.assetId },
			select: { type: true, occurredAt: true, quantity: true, amount: true },
			orderBy: { id: 'asc' }
		});
		const ledgerError = checkLedgerInvariants(asset.type, existing, value);
		if (ledgerError !== null) {
			// 型を形式検証側の fail と揃える（ActionData がユニオンに割れるのを防ぐ）
			const errors: TransactionFormErrors = { ledger: ledgerError };
			return fail(400, { errors, values: input });
		}

		await prisma.transaction.create({ data: value });

		// 単式簿記（ADR 0006）では配当は現金に反映されないため、対応する入金の
		// 登録を提案する。入金先は同口座 × 同通貨の CASH 資産（画面で確認・修正）。
		if (value.type === 'DIVIDEND') {
			const cashAssets = await prisma.asset.findMany({
				where: { type: 'CASH', currency: value.currency },
				select: { id: true, name: true, currency: true },
				orderBy: { id: 'asc' }
			});
			return { success: true, suggestion: buildDepositSuggestion(value, cashAssets) };
		}

		return { success: true };
	}
};
