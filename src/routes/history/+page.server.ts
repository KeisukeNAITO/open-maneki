import { selectTradeHistoryByTicker } from '$lib/db/gateway/trade.js';
import { removeSystemKey } from '$lib/util/timeUtil.js';
import { env } from 'process';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	const code = url.searchParams.get('code');
	return {
		tradeHistory: removeSystemKey(await selectTradeHistoryByTicker(code)),
		serviceInfo: {
			DIVIDEND_API_DOMAIN: env.DIVIDEND_API_DOMAIN
		}
	};
};
