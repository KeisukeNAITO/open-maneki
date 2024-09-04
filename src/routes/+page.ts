import type { AssetCard } from '$lib/model/rootView';

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	const assetList = buildAssetList(data.stocks, data.dividends).filter((n) => n.share !== 0);

	return {
		assetList: assetList
	};
};

const buildAssetList = (stocks: any, dividends: any) => {
	const assetList: AssetCard[] = [];
	// FIXME: 直近配当落ち日が直近の日付になっていない
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
