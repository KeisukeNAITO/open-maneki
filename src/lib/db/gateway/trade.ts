import db from '$lib/db/prisma';

export const selectTradeHistoryByTicker = async (code: string) => {
	return db.trade.findMany({
		where: {
			code: code
		}
	});
};

export const insertTrade = async (param: TradeParam) => {
	return db.trade.create({
		data: param
	});
};

export interface TradeParam {
	tradeId: number | undefined;
	transaction: string;
	market: string;
	code: string;
	name: string;
	tradeAt: Date;
	share: number;
	price: number;
}
