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

	for (const [index, history] of dividendHistrory.entries()) {
		dividendHistrory[index] = buildDividendHistoryViewList(history);
	}

	return {
		...data,
		dividendHistory: dividendHistrory
	};
};

const buildDividendHistoryViewList = (history: Dividend) => {
	const daysLeft: number = toRemainDays(history.recordDate);
	return { ...history, daysLeft };
};

const toRemainDays = (date: Date) => {
	const today = new Date(Date.now()).setHours(0, 0, 0, 0);
	const recordDate = new Date(date).setHours(0, 0, 0, 0);
	return Math.floor((recordDate - today) / (1000 * 60 * 60 * 24));
};
