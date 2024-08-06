import { TRADE_TYPE, CURRENCY_MST } from '$lib/const/const';
import { selectMarketByName, selectAllMarkets } from '$lib/db/gateway/market';
import { upsertStock, type StockParam } from '$lib/db/gateway/stock';
import { insertTrade, selectTradeHistoryByTicker, type TradeParam } from '$lib/db/gateway/trade';
import _ from 'lodash';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({}) => {
	return {
		markets: await selectAllMarkets()
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data: FormData = await request.formData();
		if (!putValidator(data)) {
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

			const tradeHistory: TradeParam[] = sortAscTradeAt(
				await selectTradeHistoryByTicker(body.code)
			);
			await upsertStock(await buildStockParam(tradeHistory));
			return {};
		}
	}
};

const putValidator = (data: FormData) => {
	if (_.isEmpty(data.get('transaction')) || !_.isString(data.get('transaction'))) {
		return false;
	} else if (_.isEmpty(data.get('market')) || !_.isString(data.get('market'))) {
		return false;
	} else if (_.isEmpty(data.get('code')) || !_.isString(data.get('code'))) {
		return false;
	} else if (_.isEmpty(data.get('name')) || !_.isString(data.get('name'))) {
		return false;
	} else if (_.isEmpty(data.get('share')) || !_.isNumber(Number(data.get('share')))) {
		return false;
	} else if (_.isEmpty(data.get('price')) || !_.isNumber(Number(data.get('price')))) {
		return false;
	} else if (_.isEmpty(data.get('date')) || !_.isDate(new Date(data.get('date')!.toString()))) {
		return false;
	} else {
		return true;
	}
};

const sortAscTradeAt = (tradeParams: TradeParam[]) => {
	return tradeParams.sort((a, b) => {
		if (a.tradeAt > b.tradeAt) {
			return 1;
		} else {
			return -1;
		}
	});
};

const buildStockParam = async (tradeParams: TradeParam[]) => {
	// TODO: 会計的に正確な計算方法に変更する
	const lastIndex = tradeParams.length - 1;
	let tempStock: StockParam = {
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
