import { describe, expect, it } from 'vitest';
import { buildWatchlist, type WatchlistAsset, type WatchlistJournalEntry } from './watchlist';
import type { PriceInput } from './overview';

// テストヘルパー: 最小限のデータで呼び出せるように空配列をデフォルトに
function run({
	assets = [] as WatchlistAsset[],
	transactedIds = [] as number[],
	prices = [] as PriceInput[],
	entries = [] as WatchlistJournalEntry[]
} = {}) {
	return buildWatchlist(assets, transactedIds, prices, entries);
}

const d = (iso: string) => new Date(iso);

describe('buildWatchlist', () => {
	const asset = (id: number, type = 'STOCK_JP'): WatchlistAsset => ({
		id,
		name: `資産${id}`,
		type,
		symbol: type === 'CASH' ? null : `SYM${id}`,
		currency: 'JPY'
	});

	it('取引がない CASH 以外の資産はウォッチリストに出る', () => {
		const rows = run({ assets: [asset(1)] });
		expect(rows).toHaveLength(1);
		expect(rows[0]?.assetId).toBe(1);
	});

	it('CASH 資産は除外される', () => {
		const rows = run({ assets: [asset(1, 'CASH')] });
		expect(rows).toHaveLength(0);
	});

	it('取引がある資産は除外される', () => {
		const rows = run({ assets: [asset(1)], transactedIds: [1] });
		expect(rows).toHaveLength(0);
	});

	it('取引ありと取引なしが混在する場合、取引なしだけ出る', () => {
		const rows = run({ assets: [asset(1), asset(2)], transactedIds: [1] });
		expect(rows.map((r) => r.assetId)).toEqual([2]);
	});

	it('価格が登録されている場合は最新の価格と基準日を返す', () => {
		const prices: PriceInput[] = [
			{ assetId: 1, date: d('2026-07-01T00:00:00Z'), price: 1000 },
			{ assetId: 1, date: d('2026-07-10T00:00:00Z'), price: 1200 }
		];
		const rows = run({ assets: [asset(1)], prices });
		expect(rows[0]).toMatchObject({ price: 1200, priceDate: d('2026-07-10T00:00:00Z') });
	});

	it('価格が未登録の場合は price と priceDate が null', () => {
		const rows = run({ assets: [asset(1)] });
		expect(rows[0]).toMatchObject({ price: null, priceDate: null });
	});

	it('ジャーナルがある場合は最新エントリの抜粋を返す', () => {
		const entries: WatchlistJournalEntry[] = [
			{ id: 1, assetId: 1, entryDate: d('2026-07-01T00:00:00Z'), body: '古いメモ' },
			{ id: 2, assetId: 1, entryDate: d('2026-07-10T00:00:00Z'), body: '新しいメモ' }
		];
		const rows = run({ assets: [asset(1)], entries });
		expect(rows[0]?.latestEntry?.body).toBe('新しいメモ');
	});

	it('同日のジャーナルは id が大きい方（後に登録）を最新とする', () => {
		const entries: WatchlistJournalEntry[] = [
			{ id: 1, assetId: 1, entryDate: d('2026-07-10T00:00:00Z'), body: '先に書いた' },
			{ id: 3, assetId: 1, entryDate: d('2026-07-10T00:00:00Z'), body: '後に書いた' }
		];
		const rows = run({ assets: [asset(1)], entries });
		expect(rows[0]?.latestEntry?.body).toBe('後に書いた');
	});

	it('assetId が null の全般メモはウォッチリストのジャーナルに使わない', () => {
		const entries: WatchlistJournalEntry[] = [
			{ id: 1, assetId: null, entryDate: d('2026-07-10T00:00:00Z'), body: '相場観メモ' }
		];
		const rows = run({ assets: [asset(1)], entries });
		expect(rows[0]?.latestEntry).toBeNull();
	});

	it('ジャーナルがない場合は latestEntry が null', () => {
		const rows = run({ assets: [asset(1)] });
		expect(rows[0]?.latestEntry).toBeNull();
	});

	it('表示順は資産の登録順（id 昇順）', () => {
		const rows = run({ assets: [asset(3), asset(1), asset(2)] });
		expect(rows.map((r) => r.assetId)).toEqual([1, 2, 3]);
	});
});
