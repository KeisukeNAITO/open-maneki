import type { AssetCard } from '$lib/model/rootView';
import _ from 'lodash';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	const stockInfoList = data.stocks.filter((n) => n.share > 0);
	const tickerList: string[] = stockInfoList.map((stockInfo) => stockInfo.code);
	const dividendList = buildDividendInfoList(tickerList, data.dividends);
	const assetInfoList = buildAssetInfoList(stockInfoList, dividendList);

	return {
		assetList: assetInfoList
	};
};

/**
 * 直近の配当権利落ち日の配当情報を抜き出し、1つ前の配当落ち日情報も付与する。
 * @param tickerList
 * @param dividendList
 * @returns
 */
const buildDividendInfoList = (tickerList: string[], dividendList: any) => {
	let dividendInfoList = [];
	for (const ticker of tickerList) {
		const dividendInfo = selectByTicker(dividendList, ticker);
		const sortedDividendInfo = sortByTradeAt(dividendInfo);
		const nextDividendInfo = extractNextDividendSchedule(sortedDividendInfo);
		const previousDividendInfo = extractPreviousDividendSchedule(sortedDividendInfo);
		const previousRecordDate = previousDividendInfo.recordDate || undefined;
		dividendInfoList.push({ ...nextDividendInfo, previousRecordDate });
	}
	return dividendInfoList;
};

const selectByTicker = (data: any[], ticker: string) => {
	return data.filter((n) => n.code === ticker);
};

const sortByTradeAt = (data: any[]) => {
	return _.sortBy(data, 'recordDate');
};

const extractNextDividendSchedule = (dividendInfo: any) => {
	return (
		dividendInfo
			.filter(
				(n: { recordDate: string | number | Date }) =>
					new Date(n.recordDate).setHours(0, 0, 0, 0) >= new Date(Date.now()).setHours(0, 0, 0, 0)
			)
			.at(0) || {}
	);
};

const extractPreviousDividendSchedule = (dividendInfo: any) => {
	return (
		dividendInfo
			.filter(
				(n: { recordDate: string | number | Date }) =>
					new Date(n.recordDate).setHours(0, 0, 0, 0) < new Date(Date.now()).setHours(0, 0, 0, 0)
			)
			.at(-1) || {}
	);
};

const buildAssetInfoList = (stocks: any, dividends: any) => {
	const assetList: AssetCard[] = [];
	for (const stock of stocks) {
		let isMerged: boolean = false;
		for (const dividend of dividends) {
			if (stock.code === dividend.code) {
				if (_.isDate(dividend.recordDate)) {
					dividend.recordDate = new Date(dividend.recordDate).toLocaleDateString();
				}
				if (_.isDate(dividend.previousRecordDate)) {
					dividend.previousRecordDate = new Date(dividend.previousRecordDate).toLocaleDateString();
				}
				const asset: AssetCard = { ...stock, ...dividend };
				assetList.push(asset);
				isMerged = true;
				break;
			}
		}
		if (!isMerged) {
			assetList.push({ ...stock });
		}
	}
	return assetList;
};

// const getStocks = async () => {
// 	const promiseStocks = await fetch('http://localhost:5173/api/v1/stock')
//     return promiseStocks.json()
// }

// const getDividends = async () => {
// 	const promiseStocks = await fetch('http://localhost:5173/api/v1/dividend')
//     return promiseStocks.json()
// }
