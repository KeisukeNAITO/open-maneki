import { selectAllMarkets } from '$lib/db/gateway/market';
import type { DividendParam } from '$lib/db/gateway/dividend.js';
import { selectStockByTicker } from '$lib/db/gateway/stock.js';
import _ from 'lodash';
import { env } from 'process';
import { DEFAULT_DIVIDEND_API as DEFAULT } from '$lib/const/defaultEnv.js';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	const code = url.searchParams.get('code');
	return {
		markets: await selectAllMarkets(),
		stockInfo: await selectStockByTicker(code),
		serviceInfo: {
			DIVIDEND_API_DOMAIN: env.DIVIDEND_API_DOMAIN
		}
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data: FormData = await request.formData();
		if (!putValidator(data)) {
			return fail(400, { error: '入力値が不正です' });
		}

		const body: DividendParam = {
			dividendId: undefined,
			market: data.get('market')!.toString(),
			code: data.get('code')!.toString(),
			name: data.get('name')!.toString(),
			amount: Number(data.get('amount')!.toString()),
			recordDate: new Date(data.get('date')!.toString())
		};

		try {
			const API_DOMAIN = env.DIVIDEND_API_DOMAIN || DEFAULT.DOMAIN;
			const response = await fetch(`${API_DOMAIN}/${DEFAULT.GET_DIVIDEND_PATH}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				return fail(response.status, { error: '配当の登録に失敗しました' });
			}

			return { success: true };
		} catch (error) {
			console.error('配当登録エラー:', error);
			return fail(500, { error: '配当の登録中にエラーが発生しました' });
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
