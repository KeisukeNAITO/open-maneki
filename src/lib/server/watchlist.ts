import type { PriceInput } from './overview';

// ウォッチリスト画面のための集約ロジック。overview.ts と同じ構成で、
// DB には依存しない純粋関数。+page.server.ts が Prisma で取得した行をそのまま渡す。
//
// ウォッチリストは独自のテーブルを持たない: 「登録済みだが取引が 1 件もない
// CASH 以外の資産」をウォッチ銘柄と解釈して毎回導出する（保有一覧が
// Transaction 台帳からの導出であるのと同じ関係。真実の源泉を増やさない）。
// 取引が 1 件つけば自動的にこの一覧から消え、資産一覧に現れる。

// 集約に必要な列だけを持つ入力型（Prisma の行をそのまま渡せる構造的部分型）。
export type WatchlistAsset = {
	id: number;
	name: string;
	type: string;
	symbol: string | null;
	currency: string;
};

export type WatchlistJournalEntry = {
	id: number;
	assetId: number | null;
	entryDate: Date;
	body: string;
};

export type WatchlistRow = {
	assetId: number;
	assetName: string;
	symbol: string | null;
	currency: string;
	price: number | null; // 最新価格（未登録なら null）。投資信託は 1 万口あたり
	priceDate: Date | null; // 最新価格の基準日
	latestEntry: { entryDate: Date; body: string } | null; // その銘柄の最新ジャーナル
};

/**
 * ウォッチリスト（取引ゼロの資産一覧）を組み立てる。
 *
 * - CASH 資産は除外（現金はウォッチ対象でなく価格も持たない）
 * - 価格は資産ごとに基準日が最新の行を使う（buildOverview と同じ選び方）
 * - ジャーナルは記録日が最新のエントリを使う（同日なら後に登録した方）。
 *   assetId が null の全般メモは銘柄のメモではないため対象外
 */
export function buildWatchlist(
	assets: readonly WatchlistAsset[],
	transactedAssetIds: readonly number[],
	prices: readonly PriceInput[],
	entries: readonly WatchlistJournalEntry[]
): WatchlistRow[] {
	const transacted = new Set(transactedAssetIds);

	// 資産ごとの最新価格（基準日が最大の行）を選ぶ
	const latestPrices = new Map<number, PriceInput>();
	for (const price of prices) {
		const current = latestPrices.get(price.assetId);
		if (!current || price.date.getTime() > current.date.getTime()) {
			latestPrices.set(price.assetId, price);
		}
	}

	// 資産ごとの最新ジャーナル（記録日が最大、同日なら id が大きい = 後に登録した行）
	const latestEntries = new Map<number, WatchlistJournalEntry>();
	for (const entry of entries) {
		if (entry.assetId === null) continue;
		const current = latestEntries.get(entry.assetId);
		if (
			!current ||
			entry.entryDate.getTime() > current.entryDate.getTime() ||
			(entry.entryDate.getTime() === current.entryDate.getTime() && entry.id > current.id)
		) {
			latestEntries.set(entry.assetId, entry);
		}
	}

	const rows: WatchlistRow[] = [];
	for (const asset of assets) {
		if (asset.type === 'CASH' || transacted.has(asset.id)) continue;
		const latestPrice = latestPrices.get(asset.id) ?? null;
		const latestEntry = latestEntries.get(asset.id) ?? null;
		rows.push({
			assetId: asset.id,
			assetName: asset.name,
			symbol: asset.symbol,
			currency: asset.currency,
			price: latestPrice?.price ?? null,
			priceDate: latestPrice?.date ?? null,
			latestEntry: latestEntry ? { entryDate: latestEntry.entryDate, body: latestEntry.body } : null
		});
	}

	// 表示順は資産の登録順
	rows.sort((a, b) => a.assetId - b.assetId);
	return rows;
}
