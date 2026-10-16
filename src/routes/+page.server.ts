import { prisma } from '$lib/server/db';
import { buildOverview } from '$lib/server/overview';
import { buildWatchlist } from '$lib/server/watchlist';
import type { PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得と buildOverview /
// buildWatchlist への受け渡しのみを行い、集計ロジックは lib/server 側に置く。
export const load: PageServerLoad = async () => {
	const [transactions, prices, assets, entries] = await Promise.all([
		prisma.transaction.findMany({ include: { account: true, asset: true } }),
		prisma.marketPrice.findMany(),
		prisma.asset.findMany({
			select: { id: true, name: true, type: true, symbol: true, currency: true },
			orderBy: { id: 'asc' }
		}),
		prisma.journalEntry.findMany({
			select: { id: true, assetId: true, entryDate: true, body: true }
		})
	]);
	// ウォッチ銘柄は「取引 0 件の非 CASH 資産」。取引済み id は取得済みの
	// transactions から導けるため、distinct の追加クエリは張らない。
	const transactedAssetIds = [...new Set(transactions.map((t) => t.assetId))];
	return {
		...buildOverview(transactions, prices),
		watch: buildWatchlist(assets, transactedAssetIds, prices, entries)
	};
};
