import { selectAllDividends } from '$lib/db/gateway/dividend';
import { selectAllStocks } from '$lib/db/gateway/stock';

/** @type {import('./$types').PageServerLoad} */
export const load = async () => {
	const promiseStocks = getStocks();
	const promiseDividends = getDividends();

	return {
		stocks: await promiseStocks,
		dividends: await promiseDividends
	};
};

const getStocks = async () => {
	return selectAllStocks();
};

const getDividends = async () => {
	return selectAllDividends();
};
