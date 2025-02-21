export interface Dividend {
	dividendId: number;
	code: string;
	name: string;
	market: string;
	recordDate: Date;
	amount: number;
	createAt: Date;
	updateAt: Date;
}

export interface Stock {
	stockId: number;
	code: string;
	name: string;
	market: string;
	share: number;
	price: number;
}
