import type { Dividend } from '$lib/model/types';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	for (const [index, history] of data.dividendHistory.entries()) {
		data.dividendHistory[index] = buildDividendHistoryViewList(history);
	}

	return data;
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
