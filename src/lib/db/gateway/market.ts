import db from '$lib/db/prisma';

export const selectAllMarkets = async () => {
	return db.market.findMany();
};

export const selectMarketByName = async (marketName: string) => {
	return db.market.findMany({
		where: {
			marketName: marketName
		}
	});
};

export const upsertMarket = async (param: MarketParam) => {
	const existRecord = await db.market.findMany({
		where: {
			marketName: param.marketName
		}
	});

	if (existRecord.length === 0) {
		return db.market.create({
			data: param
		});
	} else if (existRecord.length === 1) {
		return db.market.update({
			where: {
				marketName: existRecord[0].marketName
			},
			data: param
		});
	} else {
		return {};
	}
};

export interface MarketParam {
	marketName: string;
	officialName: string;
	currency: string;
}
