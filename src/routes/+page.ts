import type { AssetCard } from '$lib/model/rootView';
import type { Dividend, Stock, DividendInfo } from '$lib/model/types';
import _ from 'lodash';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	const stockInfoList: Stock[] = data.stocks.filter((n) => n.share > 0);
	const tickerList: string[] = stockInfoList.map((stockInfo) => stockInfo.code);
	const dividendList: DividendInfo[] = buildDividendInfoList(tickerList, data.dividends);
	const assetInfoList: AssetCard[] = buildAssetInfoList(stockInfoList, dividendList);

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
const buildDividendInfoList = (tickerList: string[], dividendList: Dividend[]): DividendInfo[] => {
	const dividendInfoList: DividendInfo[] = [];
	for (const ticker of tickerList) {
		const dividendInfo: Dividend[] = selectByTicker(dividendList, ticker);
		const sortedDividendInfo: Dividend[] = sortByTradeAt(dividendInfo);
		const nextDividendInfo = extractNextDividendSchedule(sortedDividendInfo) as Dividend;
		const nextRecordDate = !_.isEmpty(nextDividendInfo)
			? nextDividendInfo.recordDate.toLocaleDateString()
			: '';
		const previousDividendInfo = extractPreviousDividendSchedule(sortedDividendInfo) as Dividend;
		const previousRecordDate = !_.isEmpty(previousDividendInfo)
			? previousDividendInfo.recordDate.toLocaleDateString()
			: '';
		dividendInfoList.push({ ...nextDividendInfo, previousRecordDate, nextRecordDate });
	}
	return dividendInfoList;
};

const selectByTicker = (data: Dividend[], ticker: string): Dividend[] => {
	return data.filter((n) => n.code === ticker);
};

const sortByTradeAt = (data: Dividend[]): Dividend[] => {
	return _.sortBy(data, 'recordDate');
};

const extractNextDividendSchedule = (dividendInfo: Dividend[]): Dividend | {} => {
	return (
		dividendInfo
			.filter(
				(n: { recordDate: string | number | Date }) =>
					new Date(n.recordDate).setHours(0, 0, 0, 0) >= new Date(Date.now()).setHours(0, 0, 0, 0)
			)
			.at(0) || {}
	);
};

const extractPreviousDividendSchedule = (dividendInfo: Dividend[]): Dividend | {} => {
	return (
		dividendInfo
			.filter(
				(n: { recordDate: string | number | Date }) =>
					new Date(n.recordDate).setHours(0, 0, 0, 0) < new Date(Date.now()).setHours(0, 0, 0, 0)
			)
			.at(-1) || {}
	);
};

const buildAssetInfoList = (stocks: Stock[], dividends: DividendInfo[]): AssetCard[] => {
	const assetList: AssetCard[] = [];
	for (const stock of stocks) {
		let isMerged: boolean = false;
		for (const dividend of dividends) {
			if (stock.code === dividend.code) {
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
