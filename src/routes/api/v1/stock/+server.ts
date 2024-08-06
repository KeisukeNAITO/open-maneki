import {
	selectStockByTicker,
	selectAllStocks,
	upsertStock,
	type StockParam
} from '$lib/db/gateway/stock';
import { json } from '@sveltejs/kit';
import _ from 'lodash';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	const body = await request.json();
	if (!putValidator(body)) {
		console.log('[PUT] /stock invalid parameter: ' + JSON.stringify(body));
		return json({});
	} else {
		console.log('[PUT] /stock validate: OK');
	}

	const param: StockParam = {
		code: body.code,
		name: body.name,
		share: body.share,
		price: body.price
	};
	return json(await putStock(param));
}

const putValidator = (body: any) => {
	if (!_.isString(body.code)) {
		return false;
	} else if (!_.isString(body.name)) {
		return false;
	} else if (!_.isNumber(body.share)) {
		return false;
	} else if (!_.isNumber(body.price)) {
		return false;
	} else {
		return true;
	}
};

const putStock = async (param: StockParam) => {
	return await upsertStock(param);
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const code: string | null = url.searchParams.get('code');
	return json(await getStocks(code));
}

const getStocks = async (code: string | null) => {
	if (code) {
		return selectStockByTicker(code);
	} else {
		return selectAllStocks();
	}
};
