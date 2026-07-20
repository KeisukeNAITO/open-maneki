import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import { validateJournalEntryForm, type JournalEntryFormInput } from '$lib/server/journal';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証関数の呼び出しのみを行い、検証ルールは lib/server/journal.ts に置く。
export const load: PageServerLoad = async () => {
	const [assets, recentEntries] = await Promise.all([
		// 現金にもエントリは書ける（例: 生活防衛資金の方針メモ）ため除外しない
		prisma.asset.findMany({
			select: { id: true, name: true, symbol: true },
			orderBy: { id: 'asc' }
		}),
		// 登録直後の確認用に直近分だけ見せる（記録日の新しい順、同日は登録の新しい順）
		prisma.journalEntry.findMany({
			select: {
				id: true,
				entryDate: true,
				body: true,
				asset: { select: { name: true } }
			},
			orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
			take: 20
		})
	]);
	return { assets, recentEntries };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: JournalEntryFormInput = {
			assetId: formString(form, 'assetId'),
			entryDate: formString(form, 'entryDate'),
			body: formString(form, 'body')
		};

		// 空文字は「銘柄に紐づけない」の正常系。数値でない値は資産なし扱いで
		// 検証側の「選択ありなのに見つからない」エラーに落ちる
		const assetId = input.assetId && /^\d+$/.test(input.assetId) ? Number(input.assetId) : null;
		const asset =
			assetId === null
				? null
				: await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });

		// 「今日」はサーバのローカル暦日を UTC 深夜 0 時に写して渡す
		// （entryDate の保存規約と同じ表現に揃えて比較するため）
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		const result = validateJournalEntryForm(input, asset, today);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		await prisma.journalEntry.create({ data: result.value });
		return { success: true };
	}
};
