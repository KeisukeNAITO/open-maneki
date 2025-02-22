import { CURRENCY_MST, TRADE_TYPE } from '$lib/const/const';
import { selectAllMarkets, selectMarketByName } from '$lib/db/gateway/market';
import { selectStockByTicker, upsertStock, type StockParam } from '$lib/db/gateway/stock';
import { insertTrade, selectTradeHistoryByTicker, type TradeParam } from '$lib/db/gateway/trade';
import { redirect } from '@sveltejs/kit';
import _ from 'lodash';
import { validateTradeRegisterParam } from './tradeLogic';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	const code = url.searchParams.get('code');
	const stockInfo = await selectStockByTicker(code);
	const tradeLogs = await selectTradeHistoryByTicker(code);

	// 情報がないティッカーは取引登録用のパスへリダイレクト
	if (_.isEmpty(stockInfo) && _.isEmpty(tradeLogs) && !_.isEmpty(code)) {
		throw redirect(301, '/trade');
	}

	return {
		markets: await selectAllMarkets(),
		stockInfo: stockInfo,
		tradeLogs: tradeLogs
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data: FormData = await request.formData();
		if (!validateTradeRegisterParam(data)) {
			return {};
		} else {
			const body: TradeParam = {
				tradeId: undefined,
				transaction: data.get('transaction')!.toString(),
				market: data.get('market')!.toString(),
				code: data.get('code')!.toString(),
				name: data.get('name')!.toString(),
				tradeAt: new Date(data.get('date')!.toString()),
				share: Number(data.get('share')!.toString()),
				price: Number(data.get('price')!.toString())
			};
			await insertTrade(body);

			const tradeHistory = (await selectTradeHistoryByTicker(body.code)) as TradeParam[];
			await upsertStock(await buildStockParam(tradeHistory));
			return {};
		}
	}
};

const buildStockParam = async (tradeParams: TradeParam[]) => {
	// TODO: 会計的に正確な計算方法に変更する
	const lastIndex = tradeParams.length - 1;
	let tempStock: StockParam = {
		stockId: undefined,
		market: tradeParams[0].market,
		code: tradeParams[0].code,
		name: tradeParams[0].name,
		share: 0,
		price: 0
	};

	for (let i = 0; i <= lastIndex; i++) {
		if (tradeParams[i].transaction === TRADE_TYPE.BUY) {
			tempStock.price =
				(tempStock.price * tempStock.share + tradeParams[i].price * tradeParams[i].share) /
				(tempStock.share + tradeParams[i].share);
			tempStock.share += tradeParams[i].share;
		} else if (tradeParams[i].transaction === TRADE_TYPE.SELL) {
			tempStock.share -= tradeParams[i].share;
		} else {
			console.log('Warning!'); // FIXME:
		}
	}

	const marketDetail = await selectMarketByName(tempStock.market);
	switch (marketDetail[0].currency) {
		case CURRENCY_MST.JPY:
			tempStock.price = Math.ceil(tempStock.price);
			break;
		case CURRENCY_MST.USD:
			tempStock.price = Math.ceil(tempStock.price * 100) / 100;
			break;
		default:
			break;
	}
	return tempStock;
};
