import { selectAllMarkets } from '$lib/db/gateway/market';
import {
	insertDividend,
	selectDividendByTicker,
	type DividendParam
} from '$lib/db/gateway/dividend.js';
import { selectStockByTicker } from '$lib/db/gateway/stock.js';
import _ from 'lodash';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	const code = url.searchParams.get('code');
	return {
		markets: await selectAllMarkets(),
		stockInfo: await selectStockByTicker(code),
		dividendLogs: await selectDividendByTicker(code)
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data: FormData = await request.formData();
		if (!putValidator(data)) {
			return {};
		} else {
			const body: DividendParam = {
				dividendId: undefined,
				market: data.get('market')!.toString(),
				code: data.get('code')!.toString(),
				name: data.get('name')!.toString(),
				amount: Number(data.get('amount')!.toString()),
				exDividendDate: new Date(data.get('date')!.toString())
			};
			await insertDividend(body);
			return {};
		}
	}
};

const putValidator = (data: FormData) => {
	if (_.isEmpty(data.get('market')) || !_.isString(data.get('market'))) {
		return false;
	} else if (_.isEmpty(data.get('code')) || !_.isString(data.get('code'))) {
		return false;
	} else if (_.isEmpty(data.get('name')) || !_.isString(data.get('name'))) {
		return false;
	} else if (_.isEmpty(data.get('amount')) || !_.isNumber(Number(data.get('amount')))) {
		return false;
	} else if (_.isEmpty(data.get('date')) || !_.isDate(new Date(data.get('date')!.toString()))) {
		return false;
	} else {
		return true;
	}
};
