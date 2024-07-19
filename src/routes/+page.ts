import type { AssetCard } from '$lib/model/rootView';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	const assetList = buildAssetList(data.stocks, data.dividends);
	return {
		assetList: assetList
	};
};

const buildAssetList = (stocks: any, dividends: any) => {
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
