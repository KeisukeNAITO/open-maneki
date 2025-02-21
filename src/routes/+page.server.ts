import type { PageServerLoad } from './$types';
import { selectAllDividends } from '$lib/db/gateway/dividend';
import { selectAllStocks } from '$lib/db/gateway/stock';
import type { Stock, Dividend } from '$lib/model/types';

/** @type {import('./$types').PageServerLoad} */
export const load: PageServerLoad = async () => {
	const promiseStocks = getStocks();
	const promiseDividends = getDividends();

	return {
		stocks: await promiseStocks,
		dividends: await promiseDividends
	};
};

const getStocks = async (): Promise<Stock[]> => {
	return selectAllStocks();
};

const getDividends = async (): Promise<Dividend[]> => {
	return selectAllDividends();
};
