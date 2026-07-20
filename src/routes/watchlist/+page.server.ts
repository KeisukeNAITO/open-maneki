import { prisma } from '$lib/server/db';
import { buildWatchlist } from '$lib/server/watchlist';
import type { PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得と buildWatchlist への
// 受け渡しのみを行い、集計ロジックは lib/server/watchlist.ts に置く。
export const load: PageServerLoad = async () => {
	const [assets, transactedAssetIds, prices, entries] = await Promise.all([
		prisma.asset.findMany({
			select: { id: true, name: true, type: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		// 取引のある資産の id だけを取る（distinct で最小限の取得）
		prisma.transaction
			.findMany({ select: { assetId: true }, distinct: ['assetId'] })
			.then((rows) => rows.map((r) => r.assetId)),
		prisma.marketPrice.findMany({
			select: { assetId: true, date: true, price: true }
		}),
		prisma.journalEntry.findMany({
			select: { id: true, assetId: true, entryDate: true, body: true }
		})
	]);
	return { rows: buildWatchlist(assets, transactedAssetIds, prices, entries) };
};
