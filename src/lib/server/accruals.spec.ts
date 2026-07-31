import { describe, it, expect } from 'vitest';
import { buildAccruedDividend, type AccrualTransaction, type ForecastInput } from './accruals';

// 日付のみ（UTC 深夜 0 時）の Date を作るヘルパ。schema の exDate/entryDate と同じ規約。
function d(iso: string): Date {
	return new Date(`${iso}T00:00:00.000Z`);
}

// BUY 取引を作る最小ヘルパ。口座 × 資産のグループ化と derivePosition に必要な列のみ。
function buy(
	accountId: number,
	assetId: number,
	quantity: number,
	amount: number,
	occurredAt: string,
	asset: { name: string; symbol: string | null; currency: string },
	accountName = `account-${accountId}`
): AccrualTransaction {
	return {
		accountId,
		assetId,
		type: 'BUY',
		occurredAt: d(occurredAt),
		quantity,
		amount,
		account: { name: accountName },
		asset
	};
}

const toyota = { name: 'トヨタ', symbol: '7203', currency: 'JPY' };
const apple = { name: 'Apple', symbol: 'AAPL', currency: 'USD' };

describe('buildAccruedDividend', () => {
	it('前回〜次回権利日の経過割合で按分する', () => {
		const txs = [buy(1, 10, 100, 200_000, '2026-01-01', toyota)];
		// 10 円/株 = レート 100000。前回 3/31、次回 9/30（期間 183 日）、today 6/30（経過 91 日）
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 },
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		const { rows, totals } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));

		expect(rows).toHaveLength(1);
		const row = rows[0]!;
		expect(row.nextExDate).toEqual(d('2026-09-30'));
		expect(row.prevExDate).toEqual(d('2026-03-31'));
		expect(row.elapsedDays).toBe(91);
		expect(row.periodDays).toBe(183);
		// 次回配当総額 = 10 円 × 100 株 = 1000 円
		expect(row.forecastTotal).toBe(1000);
		// 按分 = 1000 × 91 / 183 = 497.26… → 497
		expect(row.accrued).toBe(497);
		expect(totals).toEqual([{ currency: 'JPY', accrued: 497, hasUnstarted: false }]);
	});

	it('権利日当日は 100% 貯まっている（fraction = 1）', () => {
		const txs = [buy(1, 10, 50, 100_000, '2026-01-01', toyota)];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 },
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		// today が次回権利日と同日 → next は 9/30、経過 = 期間
		const { rows } = buildAccruedDividend(txs, forecasts, d('2026-09-30'));
		const row = rows[0]!;
		expect(row.elapsedDays).toBe(row.periodDays);
		expect(row.accrued).toBe(row.forecastTotal);
		expect(row.accrued).toBe(500); // 10 円 × 50 株
	});

	it('前回権利日が未登録なら按分せず予想総額のみ（accrued は null）', () => {
		const txs = [buy(1, 10, 100, 200_000, '2026-01-01', toyota)];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		const { rows, totals } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		const row = rows[0]!;
		expect(row.prevExDate).toBeNull();
		expect(row.elapsedDays).toBeNull();
		expect(row.accrued).toBeNull();
		expect(row.forecastTotal).toBe(1000);
		expect(totals).toEqual([{ currency: 'JPY', accrued: 0, hasUnstarted: true }]);
	});

	it('次回予想がない（すべて過去）資産は行にしない', () => {
		const txs = [buy(1, 10, 100, 200_000, '2026-01-01', toyota)];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 }
		];
		const { rows } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		expect(rows).toHaveLength(0);
	});

	it('配当予想のない資産は行にしない', () => {
		const txs = [buy(1, 10, 100, 200_000, '2026-01-01', toyota)];
		const { rows } = buildAccruedDividend(txs, [], d('2026-06-30'));
		expect(rows).toHaveLength(0);
	});

	it('全量売却済み（保有ゼロ）は行にしない', () => {
		const txs: AccrualTransaction[] = [
			buy(1, 10, 100, 200_000, '2026-01-01', toyota),
			{
				accountId: 1,
				assetId: 10,
				type: 'SELL',
				occurredAt: d('2026-02-01'),
				quantity: 100,
				amount: 210_000,
				account: { name: 'account-1' },
				asset: toyota
			}
		];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 },
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		const { rows } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		expect(rows).toHaveLength(0);
	});

	it('現金取引（DEPOSIT/WITHDRAW）は予想がないので導出に渡らず、例外にならない', () => {
		const cash = { name: 'JPY 現金', symbol: null, currency: 'JPY' };
		const txs: AccrualTransaction[] = [
			{
				accountId: 1,
				assetId: 99,
				type: 'DEPOSIT',
				occurredAt: d('2026-01-01'),
				quantity: null,
				amount: 1_000_000,
				account: { name: 'account-1' },
				asset: cash
			}
		];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		expect(() => buildAccruedDividend(txs, forecasts, d('2026-06-30'))).not.toThrow();
		const { rows } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		expect(rows).toHaveLength(0);
	});

	it('同じ銘柄を複数口座で保有すると口座ごとに行が分かれ、合計は合算される', () => {
		const txs = [
			buy(1, 10, 60, 120_000, '2026-01-01', toyota, '楽天（課税）'),
			buy(2, 10, 40, 80_000, '2026-01-01', toyota, '楽天（NISA）')
		];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 },
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 }
		];
		const { rows, totals } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		expect(rows).toHaveLength(2);
		// 経過 91/183: 60 株 → 600×91/183 = 298.36 → 298、40 株 → 400×91/183 = 198.9 → 199
		expect(rows.map((r) => r.accrued)).toEqual([298, 199]);
		expect(totals).toEqual([{ currency: 'JPY', accrued: 497, hasUnstarted: false }]);
	});

	it('通貨別に合計する（円換算しない）', () => {
		const txs = [
			buy(1, 10, 100, 200_000, '2026-01-01', toyota),
			buy(1, 20, 10, 150_000, '2026-01-01', apple)
		];
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-03-31'), amountPerShare: 100_000 },
			{ assetId: 10, exDate: d('2026-09-30'), amountPerShare: 100_000 },
			// $0.25/株 = 25 セント = レート 250000。前回 4/1、次回 7/1（91 日）、経過 today 6/1（61 日）
			{ assetId: 20, exDate: d('2026-04-01'), amountPerShare: 250_000 },
			{ assetId: 20, exDate: d('2026-07-01'), amountPerShare: 250_000 }
		];
		const { totals } = buildAccruedDividend(txs, forecasts, d('2026-06-01'));
		// JPY: 1000 × 62/183 = 338.8 → 339（3/31→6/1 は 62 日）
		// USD: 250 セント × 61/91 = 167.58 → 168 セント
		expect(totals).toEqual([
			{ currency: 'JPY', accrued: 339, hasUnstarted: false },
			{ currency: 'USD', accrued: 168, hasUnstarted: false }
		]);
	});

	it('按分は四捨五入（ちょうど 0.5 は切り上げ）', () => {
		const txs = [buy(1, 10, 1, 10_000, '2026-01-01', toyota)];
		// レート 10000 = 1 円/株、1 株、経過 1 / 期間 2 → 1 円 × 0.5 = 0.5 → 1
		const forecasts: ForecastInput[] = [
			{ assetId: 10, exDate: d('2026-06-29'), amountPerShare: 10_000 },
			{ assetId: 10, exDate: d('2026-07-01'), amountPerShare: 10_000 }
		];
		const { rows } = buildAccruedDividend(txs, forecasts, d('2026-06-30'));
		expect(rows[0]!.elapsedDays).toBe(1);
		expect(rows[0]!.periodDays).toBe(2);
		expect(rows[0]!.accrued).toBe(1);
	});
});
