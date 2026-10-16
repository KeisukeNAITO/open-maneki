import { fail } from '@sveltejs/kit';
import type { AssetFormErrors, AssetFormInput } from '$lib/server/assets';
import { validateNewAssetTransaction } from '$lib/server/assetWithTransaction';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import {
	checkLedgerInvariants,
	type TransactionFormErrors,
	type TransactionFormInput
} from '$lib/server/transactions';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: 取得・書き込みと検証関数の呼び出しのみ。
// 検証ルールは lib/server/assetWithTransaction.ts（＝既存 2 関数の合成）に置く。
export const load: PageServerLoad = async () => {
	// 口座は融合しない（既存から選ぶ）。資産はこのフォームで新規作成する。
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
		// 資産と取引で name="type" が衝突するため、フォーム側は assetType / transactionType
		// に分けて送る。ここで各検証関数が期待するキーに詰め直す。
		const assetInput: AssetFormInput = {
			name: formString(form, 'name'),
			type: formString(form, 'assetType'),
			symbol: formString(form, 'symbol'),
			currency: formString(form, 'currency')
		};
		const txInput: TransactionFormInput = {
			accountId: formString(form, 'accountId'),
			assetId: null, // 新規フローでは使わない（資産はこのフォームで作る）
			type: formString(form, 'transactionType'),
			occurredAt: formString(form, 'occurredAt'),
			quantity: formString(form, 'quantity'),
			amount: formString(form, 'amount'),
			note: formString(form, 'note')
		};

		const accountId = parseId(txInput.accountId);
		const account =
			accountId === null
				? null
				: await prisma.account.findUnique({ where: { id: accountId }, select: { id: true } });

		// 重複判定用に既存資産を全件渡す（シングルユーザーの銘柄数なら全件でも軽い）
		const existingAssets = await prisma.asset.findMany({ select: { name: true } });

		// 「今日」はサーバのローカル暦日を UTC 深夜 0 時に写して渡す（parseDateOnly 参照）
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		const result = validateNewAssetTransaction(assetInput, txInput, account, existingAssets, today);
		if (!result.ok) {
			return fail(400, {
				assetErrors: result.assetErrors,
				transactionErrors: result.transactionErrors,
				values: { asset: assetInput, transaction: txInput }
			});
		}

		// 台帳のシミュレーション検証。新規資産なので既存取引はゼロ件。最初の取引が
		// SELL（売り越し）や保有ゼロの DIVIDEND なら、導出関数がそのまま弾く。
		const ledgerError = checkLedgerInvariants(result.asset.type, [], result.transaction);
		if (ledgerError !== null) {
			// 形式検証側の fail と型を揃える（ActionData がユニオンに割れるのを防ぐ）
			const assetErrors: AssetFormErrors = {};
			const transactionErrors: TransactionFormErrors = { ledger: ledgerError };
			return fail(400, {
				assetErrors,
				transactionErrors,
				values: { asset: assetInput, transaction: txInput }
			});
		}

		// 資産と取引を原子的に作成する。取引側のみ失敗したときに資産を残さないため
		// $transaction で囲む（片方失敗なら両方ロールバック）。
		await prisma.$transaction(async (tx) => {
			const asset = await tx.asset.create({ data: result.asset });
			await tx.transaction.create({ data: { ...result.transaction, assetId: asset.id } });
		});

		return { success: true };
	}
};
