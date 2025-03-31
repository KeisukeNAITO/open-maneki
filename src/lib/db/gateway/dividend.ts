import db from '$lib/db/prisma';
import type { Dividend } from '@prisma/client';
import _ from 'lodash';

export const selectAllDividends = async () => {
	return db.dividend.findMany();
};

export const selectDividendByTicker = async (code: string | null): Promise<Dividend[]> => {
	if (_.isEmpty(code)) {
		return [];
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
	// dividend IDの指定がない場合は新規登録
	if (_.isEmpty(param.dividendId)) {
		return db.dividend.create({
			data: param
		});
	}

	// dividend IDとcodeをキーに既にレコードがあれば更新する
	const existRecord = await db.dividend.findMany({
		where: {
			dividendId: param.dividendId,
			code: param.code
		}
	});
	if (existRecord.length === 1) {
		return db.dividend.update({
			where: {
				dividendId: existRecord[0].dividendId
			},
			data: param
		});
	} else {
		// 更新対象がない場合はエラーを投げる
		throw new Error(
			`更新対象の配当情報が見つかりません。ID: ${param.dividendId}, コード: ${param.code}`
		);
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
