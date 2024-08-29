import {
	selectDividendByTicker,
	selectAllDividends,
	upsertDividend,
	type DividendParam
} from '$lib/db/gateway/dividend';
import { json } from '@sveltejs/kit';
import _ from 'lodash';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	const body = await request.json();
	if (!putValidator(body)) {
		console.log('[PUT] /dividend invalid parameter: ' + JSON.stringify(body));
		return json({});
	} else {
		console.log('[PUT] /dividend validate: OK');
	}

	const param: DividendParam = {
		dividendId: body.dividendId,
		market: body.market,
		code: body.code,
		name: body.name,
		amount: body.amount,
		recordDate: body.recordDate
	};
	return json(await putDividend(param));
}

const putValidator = (body: any) => {
	if (!_.isString(body.code)) {
		return false;
	} else if (!_.isString(body.name)) {
		return false;
	} else if (!_.isNumber(body.amount)) {
		return false;
	} else {
		return true;
	}
};

const putDividend = async (param: DividendParam) => {
	return await upsertDividend(param);
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const code: string | null = url.searchParams.get('code');
	return json(await getDividends(code));
}

const getDividends = async (code: string | null) => {
	if (code) {
		return selectDividendByTicker(code);
	} else {
		return selectAllDividends();
	}
};
