import { selectStockByTicker } from '$lib/db/gateway/stock.js';
import { selectTradeHistoryByTicker } from '$lib/db/gateway/trade.js';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {
	const promiseStocks = getSomeStock(params.tickerCode);
	const promiseTradeLogs = getSomeTradeLogs(params.tickerCode);

	return {
		stocks: await promiseStocks,
		tradeLogs: await promiseTradeLogs
	};
};

const getSomeStock = async (code: string) => {
	return selectStockByTicker(code);
};

const getSomeTradeLogs = async (code: string) => {
	return selectTradeHistoryByTicker(code);
}