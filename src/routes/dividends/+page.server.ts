import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import {
	validateDividendForecastForm,
	type DividendForecastFormInput
} from '$lib/server/dividends';
import { buildAccruedDividend } from '$lib/server/accruals';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証・集約関数の呼び出しのみを行い、ロジックは lib/server/ に置く。
export const load: PageServerLoad = async () => {
	const [assets, recentForecasts, transactions, forecasts] = await Promise.all([
		// 配当予想を登録できるのは株式のみ（投資信託・現金は当面対象外）
		prisma.asset.findMany({
			where: { type: { in: ['STOCK_JP', 'STOCK_US'] } },
			select: { id: true, name: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		// 登録直後の確認用に直近分だけ見せる（権利確定日の新しい順、同日は登録の新しい順）
		prisma.dividendForecast.findMany({
			select: {
				id: true,
				exDate: true,
				amountPerShare: true,
				asset: { select: { name: true, currency: true } }
			},
			orderBy: [{ exDate: 'desc' }, { id: 'desc' }],
			take: 20
		}),
		// 按分は口座 × 資産の保有導出が要るため全取引を渡す（buildOverview と同じ方針）。
		// 予想のない資産は buildAccruedDividend 側で除外されるので現金取引も安全に含められる。
		prisma.transaction.findMany({
			select: {
				accountId: true,
				assetId: true,
				type: true,
				occurredAt: true,
				quantity: true,
				amount: true,
				account: { select: { name: true } },
				asset: { select: { name: true, symbol: true, currency: true } }
			}
		}),
		prisma.dividendForecast.findMany({
			select: { assetId: true, exDate: true, amountPerShare: true }
		})
	]);

	// 基準日は「今日」の暦日を UTC 深夜 0 時に合わせる（exDate と同じ日付のみ規約）。
	const now = new Date();
	const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
	const accrual = buildAccruedDividend(transactions, forecasts, today);

	return { assets, recentForecasts, accrual };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: DividendForecastFormInput = {
			assetId: formString(form, 'assetId'),
			exDate: formString(form, 'exDate'),
			amountPerShare: formString(form, 'amountPerShare')
		};

		const assetId = input.assetId && /^\d+$/.test(input.assetId) ? Number(input.assetId) : null;
		const asset =
			assetId === null
				? null
				: await prisma.asset.findUnique({
						where: { id: assetId },
						select: { id: true, type: true, currency: true }
					});

		const result = validateDividendForecastForm(input, asset);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		// 同一資産×同一権利確定日は上書き（登録＝「その権利日の予想はこれ」という宣言。
		// 打ち間違いの訂正が再入力だけで済む。@@unique([assetId, exDate]) が前提。
		// MarketPrice の upsert と同じ扱い）
		const { value } = result;
		const where = { assetId_exDate: { assetId: value.assetId, exDate: value.exDate } };
		const existing = await prisma.dividendForecast.findUnique({ where, select: { id: true } });
		await prisma.dividendForecast.upsert({
			where,
			create: value,
			update: { amountPerShare: value.amountPerShare }
		});
		return { success: true, updated: existing !== null };
	}
};
