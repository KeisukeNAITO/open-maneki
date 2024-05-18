import db from '$lib/db/prisma';

export const selectAllDividends = async () => {
	return db.dividend.findMany();
};

export const selectDividend = async (code: string) => {
	return db.dividend.findMany({
		where: {
			code: code
		}
	});
};

export const upsertDividend = async (param: DividendParam) => {
	const existRecord = await db.dividend.findMany({
		where: {
			code: param.code
		}
	});

	if (existRecord.length === 0) {
		return db.dividend.create({
			data: param
		});
	} else if (existRecord.length === 1) {
		return db.dividend.update({
			where: {
				dividendId: existRecord[0].dividendId
			},
			data: param
		});
	} else {
		return {};
	}
};

export interface DividendParam {
	code: string;
	name: string;
	amount: number;
}
