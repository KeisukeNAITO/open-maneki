import type { AssetCard } from '$lib/model/rootView';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	const stockList = data.stocks.filter((n) => n.share > 0);
	const dividendList = nextDividend(data.dividends);
	const assetList = buildAssetList(stockList, dividendList);

	return {
		assetList: assetList
	};
};

const nextDividend = (dividends: any) => {
	dividends = dividends.filter(
		(n) => new Date(n.recordDate).setHours(0, 0, 0, 0) >= new Date(Date.now()).setHours(0, 0, 0, 0)
	);
	return dividends;
};

const buildAssetList = (stocks: any, dividends: any) => {
	const assetList: AssetCard[] = [];
	for (const stock of stocks) {
		let isMerged: boolean = false;
		for (const dividend of dividends) {
			if (stock.code === dividend.code) {
				dividend.recordDate = new Date(dividend.recordDate).toLocaleDateString();
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
