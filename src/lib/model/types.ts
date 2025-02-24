/**
 * 配当情報
 */
export interface Dividend {
	/** 配当情報ID(ユニーク) */
	dividendId: number;
	/** 銘柄コード */
	code: string;
	/** 銘柄名 */
	name: string;
	/** 市場区分 */
	market: string;
	/** 配当基準日 */
	recordDate: Date;
	/** 配当金額 */
	amount: number;
	/** 作成日時 */
	createAt: Date;
	/** 更新日時 */
	updateAt: Date;
}

/**
 * 画面向け配当情報
 */
export interface DividendInfo extends Dividend {
	/** 次回配当基準日 */
	nextRecordDate?: Date;
	/** 前回配当基準日 */
	previousRecordDate?: Date;
}

/**
 * 株式情報
 */
export interface Stock {
	/** 証券情報ID(ユニーク) */
	stockId: number;
	/** 銘柄コード */
	code: string;
	/** 銘柄名 */
	name: string;
	/** 市場区分 */
	market: string;
	/** 保有株数 */
	share: number;
	/** 株価 */
	price: number;
	/** 作成日時 */
	createAt: Date;
	/** 更新日時 */
	updateAt: Date;
}

/**
 * 株式情報関連リクエストボディ
 */
export interface StockRequestBody {
	/** 証券情報ID(ユニーク) */
	stockId?: number;
	/** 銘柄コード */
	code: string;
	/** 銘柄名 */
	name: string;
	/** 市場区分 */
	market: string;
	/** 保有株数 */
	share: number;
	/** 株価 */
	price: number;
}
