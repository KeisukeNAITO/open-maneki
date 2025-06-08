import db from '$lib/db/prisma';
import _ from 'lodash';

export const selectTradeHistoryByTicker = async (code: string | null) => {
	if (_.isEmpty(code)) {
		return [{}];
	}

	return db.trade.findMany({
		where: {
			code: code!
		}
	});
};

export const insertTrade = async (param: TradeParam) => {
	return db.trade.create({
		data: param
	});
};

export interface TradeParam {
	/** 取引情報ID(ユニーク) */
	tradeId: number | undefined;
	/** 売買区分 */
	transaction: string;
	/** 市場区分 */
	market: string;
	/** 銘柄コード */
	code: string;
	/** 銘柄名 */
	name: string;
	/** 約定日 */
	tradeAt: Date;
	/** 保有株数 */
	share: number;
	/** 株価 */
	price: number;
}
