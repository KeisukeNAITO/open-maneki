export type AssetCard = {
	stockId: number;
	code: string;
	name: string;
	share: number;
	price: number;
	dividendId?: number;
	amount?: number;
	recordDate?: Date;
	nextRecordDate?: string;
	previousRecordDate?: string;
};
