import { deriveCashBalance, derivePosition } from './holdings';
import { deriveMarketValue } from './valuation';
import { CURRENCIES } from './types';

// 資産一覧画面のための集約ロジック。routes を薄く保つ方針（コード構成方針 2）に
// 従い、口座 × 資産のグループ化と導出関数の適用はここで行う。
// DB には依存しない純粋関数で、+page.server.ts が Prisma で取得した行をそのまま渡す。

// 集約に必要な列だけを持つ入力型。Prisma の include 付き Transaction 行を
// そのまま渡せる構造的部分型。
export type OverviewTransaction = {
	accountId: number;
	assetId: number;
	type: string;
	occurredAt: Date;
	quantity: number | null;
	amount: number;
	account: { name: string };
	asset: { name: string; type: string; symbol: string | null; currency: string };
};

// MarketPrice 行の必要列。price は最小通貨単位、投資信託は 1 万口あたり（valuation.ts 参照）。
export type PriceInput = {
	assetId: number;
	date: Date;
	price: number;
};

// 証券（STOCK_JP / STOCK_US / FUND）の保有 1 行。金額は最小通貨単位の Int。
export type HoldingRow = {
	accountId: number;
	accountName: string;
	assetId: number;
	assetName: string;
	assetType: string;
	symbol: string | null;
	currency: string;
	quantity: number;
	costBasis: number;
	marketValue: number | null; // 価格未登録なら null
	priceDate: Date | null; // 評価に使った価格の基準日
};

// 現金（CASH 資産）の残高 1 行。
export type CashRow = {
	accountId: number;
	accountName: string;
	assetId: number;
	assetName: string;
	currency: string;
	balance: number;
};

// 通貨別の合計。円換算はしない方針のため通貨ごとに独立して集計する。
export type CurrencyTotal = {
	currency: string;
	cashBalance: number;
	marketValue: number; // 価格が判明している保有分のみの合計
	hasMissingPrice: boolean; // 価格未登録で合計に含められなかった保有があるか
};

export type Overview = {
	holdings: HoldingRow[];
	cash: CashRow[];
	totals: CurrencyTotal[];
};

/**
 * 全取引と価格履歴から資産一覧画面のデータを組み立てる。
 *
 * - 集計単位は口座 × 資産（同じ銘柄でも課税口座と NISA は別の行になる）
 * - 評価には資産ごとに基準日が最新の価格を使う
 * - 保有口数がゼロになった銘柄（全量売却済み）は表示しない
 * - 通貨別合計で価格未登録の保有は評価額に加算せず hasMissingPrice で知らせる
 */
export function buildOverview(
	transactions: readonly OverviewTransaction[],
	prices: readonly PriceInput[]
): Overview {
	// 資産ごとの最新価格（基準日が最大の行）を選ぶ
	const latestPrices = new Map<number, PriceInput>();
	for (const price of prices) {
		const current = latestPrices.get(price.assetId);
		if (!current || price.date.getTime() > current.date.getTime()) {
			latestPrices.set(price.assetId, price);
		}
	}

	// 口座 × 資産でグループ化（derivePosition / deriveCashBalance の単位）
	const groups = new Map<string, OverviewTransaction[]>();
	for (const tx of transactions) {
		const key = `${tx.accountId}:${tx.assetId}`;
		const group = groups.get(key);
		if (group) {
			group.push(tx);
		} else {
			groups.set(key, [tx]);
		}
	}

	const holdings: HoldingRow[] = [];
	const cash: CashRow[] = [];

	for (const group of groups.values()) {
		// groups のエントリは取引を 1 件 push する時にしか作られないため、
		// group は必ず空でない。このガードは、その前提が将来の変更で崩れた
		// 場合に undefined アクセスで黙って壊れないための実行時の防御。
		const first = group[0];
		if (!first) continue;
		const { accountId, assetId, account, asset } = first;

		if (asset.type === 'CASH') {
			cash.push({
				accountId,
				accountName: account.name,
				assetId,
				assetName: asset.name,
				currency: asset.currency,
				balance: deriveCashBalance(group)
			});
			continue;
		}

		const position = derivePosition(group);
		if (position.quantity === 0) continue;

		const latest = latestPrices.get(assetId) ?? null;
		holdings.push({
			accountId,
			accountName: account.name,
			assetId,
			assetName: asset.name,
			assetType: asset.type,
			symbol: asset.symbol,
			currency: asset.currency,
			quantity: position.quantity,
			costBasis: position.costBasis,
			marketValue: deriveMarketValue(asset.type, position.quantity, latest?.price ?? null),
			priceDate: latest?.date ?? null
		});
	}

	// 表示順は口座 → 資産の登録順
	holdings.sort((a, b) => a.accountId - b.accountId || a.assetId - b.assetId);
	cash.sort((a, b) => a.accountId - b.accountId || a.assetId - b.assetId);

	const totalsByCurrency = new Map<string, CurrencyTotal>();
	const totalFor = (currency: string): CurrencyTotal => {
		let total = totalsByCurrency.get(currency);
		if (!total) {
			total = { currency, cashBalance: 0, marketValue: 0, hasMissingPrice: false };
			totalsByCurrency.set(currency, total);
		}
		return total;
	};
	for (const row of cash) {
		totalFor(row.currency).cashBalance += row.balance;
	}
	for (const row of holdings) {
		const total = totalFor(row.currency);
		if (row.marketValue === null) {
			total.hasMissingPrice = true;
		} else {
			total.marketValue += row.marketValue;
		}
	}

	const currencyOrder = (currency: string): number => {
		const index = (CURRENCIES as readonly string[]).indexOf(currency);
		return index === -1 ? CURRENCIES.length : index;
	};
	const totals = [...totalsByCurrency.values()].sort(
		(a, b) => currencyOrder(a.currency) - currencyOrder(b.currency)
	);

	return { holdings, cash, totals };
}
