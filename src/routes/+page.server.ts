import { prisma } from '$lib/server/db';
import { buildOverview } from '$lib/server/overview';
import type { PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得と buildOverview への
// 受け渡しのみを行い、集計ロジックは lib/server 側に置く。
export const load: PageServerLoad = async () => {
	const [transactions, prices] = await Promise.all([
		prisma.transaction.findMany({ include: { account: true, asset: true } }),
		prisma.marketPrice.findMany()
	]);
	return buildOverview(transactions, prices);
};
