import { upsertStock, type StockParam } from '$lib/db/gateway/stock';
import { type Actions } from '@sveltejs/kit';
import _ from 'lodash';

export const actions = {
	default: async ({ request }) => {
		const data: FormData = await request.formData();

		if (!putValidator(data)) {
			console.log('stock update parameter: ' + JSON.stringify(data));
			return {};
		} else {
			const body: StockParam = {
				code: data.get('code')?.toString() || '',
				name: data.get('name')?.toString() || '',
				share: Number(data.get('share')?.toString()),
				price: Number(data.get('price')?.toString())
			};
			return upsertStock(body);
		}
	}
} satisfies Actions;

const putValidator = (data: FormData) => {
	if (!_.isString(data.get('code'))) {
		return false;
	} else if (!_.isString(data.get('name'))) {
		return false;
	} else if (!_.isNumber(Number(data.get('share')))) {
		return false;
	} else if (!_.isNumber(Number(data.get('price')))) {
		return false;
	} else {
		return true;
	}
};
