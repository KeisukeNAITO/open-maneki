import type { Dividend } from '$lib/model/types';
import { DEFAULT_DIVIDEND_API as DEFAULT } from '$lib/const/defaultEnv.js';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data, url }) => {
	await parent();

	const API_DOMAIN = data.serviceInfo.DIVIDEND_API_DOMAIN || DEFAULT.DOMAIN;
	const requestQuery = url.searchParams.get('code') || '';
	const dividendHistrory: Dividend[] = await (
		await fetch(`${API_DOMAIN}/${DEFAULT.GET_DIVIDEND_PATH}?code=${requestQuery}`, {
			method: 'GET'
		})
	).json();

	return {
		...data,
		transactionHistory: buildTransactionHistory([...dividendHistrory, ...data.tradeHistory])
	};
};

const buildTransactionHistory = (data: any[]) => {
	for (const [index, record] of data.entries()) {
		if (record.recordDate) {
			data[index] = { ...record, eventDate: new Date(record.recordDate) }
		} else if (record.tradeAt) {
			data[index] = { ...record, eventDate: new Date(record.tradeAt) }
		} else {
			data[index] = record
		}
	}

	data.sort((a, b) => a.eventDate - b.eventDate)
	return data;
};