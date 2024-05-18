import { selectSomeStocks } from '$lib/db/gateway/stock.js';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {
	const promiseStocks = getSomeStock(params.tickerCode);

	return {
		stocks: await promiseStocks
	};
};

const getSomeStock = async (code: string) => {
	return selectSomeStocks(code);
};
