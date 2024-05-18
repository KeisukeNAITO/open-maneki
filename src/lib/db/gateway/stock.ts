import db from '$lib/db/prisma';

export const selectAllStocks = async () => {
	return db.stock.findMany();
};

export const selectSomeStocks = async (code: string) => {
	return db.stock.findMany({
		where: {
			code: code
		}
	});
};

export const upsertStock = async (param: StockParam) => {
	const existRecord = await db.stock.findMany({
		where: {
			code: param.code,
			accountType: param.accountType
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
	code: string;
	name: string;
	share: number;
	price: number;
	accountType: string;
}
