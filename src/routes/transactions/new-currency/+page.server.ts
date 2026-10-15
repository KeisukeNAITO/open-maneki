import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import {
	validateNewCurrencyDeposit,
	type NewCurrencyFormErrors,
	type NewCurrencyFormInput
} from '$lib/server/newCurrency';
import { checkLedgerInvariants } from '$lib/server/transactions';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: 取得・書き込みと検証関数の呼び出しのみ。
// 検証ルール（作成/再利用の解決を含む）は lib/server/newCurrency.ts に置く。
export const load: PageServerLoad = async () => {
	// 口座は融合しない（既存から選ぶ）。通貨は select、現金資産はここで解決する。
	const accounts = await prisma.account.findMany({
		select: { id: true, name: true, type: true },
		orderBy: { id: 'asc' }
	});
	return { accounts };
};

// "123" のような正の整数文字列だけを ID として解釈する。
function parseId(value: string | null): number | null {
	return value && /^\d+$/.test(value) ? Number(value) : null;
}

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: NewCurrencyFormInput = {
			accountId: formString(form, 'accountId'),
			currency: formString(form, 'currency'),
			occurredAt: formString(form, 'occurredAt'),
			amount: formString(form, 'amount'),
			note: formString(form, 'note')
		};

		const accountId = parseId(input.accountId);
		const account =
			accountId === null
				? null
				: await prisma.account.findUnique({ where: { id: accountId }, select: { id: true } });

		// 再利用先の解決に CASH 資産、自動名の衝突ガードに全資産名を渡す
		// （シングルユーザーの資産数なら全件でも軽い）。
		const assets = await prisma.asset.findMany({
			select: { id: true, name: true, type: true, currency: true }
		});
		const cashAssets = assets.filter((a) => a.type === 'CASH');
		const assetNames = assets.map((a) => a.name);

		// 「今日」はサーバのローカル暦日を UTC 深夜 0 時に写して渡す（parseDateOnly 参照）
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		const result = validateNewCurrencyDeposit(input, account, cashAssets, assetNames, today);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		if (result.create) {
			// 既存取引はゼロ件（新規資産）。DEPOSIT は残高を増やすだけだが #3 と一貫させ検証する。
			const ledgerError = checkLedgerInvariants('CASH', [], result.transaction);
			if (ledgerError !== null) {
				const errors: NewCurrencyFormErrors = { ledger: ledgerError };
				return fail(400, { errors, values: input });
			}
			// 資産と初回入金を原子的に作成する（片方失敗なら両方ロールバック）。
			await prisma.$transaction(async (tx) => {
				const asset = await tx.asset.create({ data: result.asset });
				await tx.transaction.create({ data: { ...result.transaction, assetId: asset.id } });
			});
			return { success: true };
		}

		// 再利用: 既存の CASH 資産へ DEPOSIT。当該口座 × 資産の既存取引を加味して検証する。
		const existingGroup = await prisma.transaction.findMany({
			where: { accountId: result.transaction.accountId, assetId: result.transaction.assetId },
			select: { type: true, occurredAt: true, quantity: true, amount: true }
		});
		const ledgerError = checkLedgerInvariants('CASH', existingGroup, result.transaction);
		if (ledgerError !== null) {
			const errors: NewCurrencyFormErrors = { ledger: ledgerError };
			return fail(400, { errors, values: input });
		}
		await prisma.transaction.create({ data: result.transaction });
		return { success: true };
	}
};
