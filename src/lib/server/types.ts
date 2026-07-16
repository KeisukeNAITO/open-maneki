// schema.prisma の種別カラムは SQLite が enum 非対応のため String で持つ。
// 取りうる値はここで一元定義し、型レベル（ユニオン型）と
// 実行時（配列 + 型ガード）の両方で検証できるようにする。

export const ACCOUNT_TYPES = ['TAXABLE', 'NISA', 'DC'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ASSET_TYPES = ['CASH', 'STOCK_JP', 'STOCK_US', 'FUND'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const TRANSACTION_TYPES = ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAW'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CURRENCIES = ['JPY', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isAccountType(value: string): value is AccountType {
	return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export function isTransactionType(value: string): value is TransactionType {
	return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

export function isCurrency(value: string): value is Currency {
	return (CURRENCIES as readonly string[]).includes(value);
}

export function isAssetType(value: string): value is AssetType {
	return (ASSET_TYPES as readonly string[]).includes(value);
}
