import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import { validateMarketPriceForm, type MarketPriceFormInput } from '$lib/server/prices';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証関数の呼び出しのみを行い、検証ルールは lib/server/prices.ts に置く。
export const load: PageServerLoad = async () => {
	const [assets, recentPrices] = await Promise.all([
		// 現金に市場価格はないため選択肢から除外する
		prisma.asset.findMany({
			where: { type: { not: 'CASH' } },
			select: { id: true, name: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		// 登録直後の確認用に直近分だけ見せる（基準日の新しい順、同日は登録の新しい順）
		prisma.marketPrice.findMany({
			select: {
				id: true,
				date: true,
				price: true,
				asset: { select: { name: true, currency: true } }
			},
			orderBy: [{ date: 'desc' }, { id: 'desc' }],
			take: 20
		})
	]);
	return { assets, recentPrices };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: MarketPriceFormInput = {
			assetId: formString(form, 'assetId'),
			date: formString(form, 'date'),
			price: formString(form, 'price')
		};

		const assetId = input.assetId && /^\d+$/.test(input.assetId) ? Number(input.assetId) : null;
		const asset =
			assetId === null
				? null
				: await prisma.asset.findUnique({
						where: { id: assetId },
						select: { id: true, type: true, currency: true }
					});

		// 「今日」はサーバのローカル暦日を UTC 深夜 0 時に写して渡す
		// （MarketPrice.date の保存規約と同じ表現に揃えて比較するため）
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

		const result = validateMarketPriceForm(input, asset, today);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		// 同一資産×同一日は上書き（登録＝「その日の価格はこれ」という宣言。
		// 打ち間違いの訂正が再入力だけで済む。@@unique([assetId, date]) が前提）
		const { value } = result;
		const where = { assetId_date: { assetId: value.assetId, date: value.date } };
		const existing = await prisma.marketPrice.findUnique({ where, select: { id: true } });
		await prisma.marketPrice.upsert({
			where,
			create: value,
			update: { price: value.price }
		});
		return { success: true, updated: existing !== null };
	}
};
