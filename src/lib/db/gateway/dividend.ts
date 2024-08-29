import db from '$lib/db/prisma';
import _ from 'lodash';

export const selectAllDividends = async () => {
	return db.dividend.findMany();
};

export const selectDividendByTicker = async (code: string | null) => {
	if (_.isEmpty(code)) {
		return [{}];
	}

	return db.dividend.findMany({
		where: {
			code: code!
		}
	});
};

export const insertDividend = async (param: DividendParam) => {
	return db.dividend.create({
		data: param
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
	dividendId: number | undefined;
	market: string;
	code: string;
	name: string;
	amount: number;
	recordDate: Date;
}
