import db from '$lib/db/prisma';
import _ from 'lodash';

export const selectAllStocks = async () => {
	return db.stock.findMany();
};

export const selectStockByTicker = async (code: string | null) => {
	if (_.isEmpty(code)) {
		return [{}];
	}

	return db.stock.findMany({
		where: {
			code: code!
		}
	});
};

export const upsertStock = async (param: StockParam) => {
	const existRecord = await db.stock.findMany({
		where: {
			market: param.market,
			code: param.code
		}
	});

	if (existRecord.length === 0) {
		return db.stock.create({
			data: param
		});
	} else if (existRecord.length === 1) {
		return db.stock.update({
			where: {
				stockId: existRecord[0].stockId
			},
			data: param
		});
	} else {
		return {};
	}
};

export interface StockParam {
	stockId: number | undefined;
	market: string;
	code: string;
	name: string;
	share: number;
	price: number;
}
