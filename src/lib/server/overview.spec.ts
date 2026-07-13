import { describe, expect, it } from 'vitest';
import { buildOverview, type OverviewTransaction, type PriceInput } from './overview';

// テスト用のフィクスチャ。口座 1 = 課税口座、口座 2 = NISA を想定。
const taxable = { name: '課税口座' };
const nisa = { name: 'NISA口座' };

const cashJpy = { name: 'JPY 現金', type: 'CASH', symbol: null, currency: 'JPY' };
const cashUsd = { name: 'USD 現金', type: 'CASH', symbol: null, currency: 'USD' };
const stockJp = { name: '日本株A', type: 'STOCK_JP', symbol: '1234', currency: 'JPY' };
const stockUs = { name: '米国株B', type: 'STOCK_US', symbol: 'BBB', currency: 'USD' };
const fund = { name: '投信C', type: 'FUND', symbol: null, currency: 'JPY' };

function tx(
	partial: Pick<OverviewTransaction, 'accountId' | 'assetId' | 'type' | 'account' | 'asset'> &
		Partial<OverviewTransaction>
): OverviewTransaction {
	return {
		occurredAt: new Date('2026-01-01'),
		quantity: null,
		amount: 0,
		...partial
	};
}

describe('buildOverview', () => {
	it('空の入力から空の一覧を返す', () => {
		expect(buildOverview([], [])).toEqual({ holdings: [], cash: [], totals: [] });
	});

	it('CASH 資産は現金残高、証券は保有として振り分ける', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 1,
					type: 'DEPOSIT',
					account: taxable,
					asset: cashJpy,
					amount: 100_000
				}),
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				})
			],
			[]
		);

		expect(result.cash).toEqual([
			{
				accountId: 1,
				accountName: '課税口座',
				assetId: 1,
				assetName: 'JPY 現金',
				currency: 'JPY',
				balance: 100_000
			}
		]);
		expect(result.holdings).toHaveLength(1);
		expect(result.holdings[0]).toMatchObject({
			accountName: '課税口座',
			assetName: '日本株A',
			quantity: 100,
			costBasis: 50_000
		});
	});

	it('同じ資産でも口座が違えば別の保有として集計する', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				}),
				tx({
					accountId: 2,
					assetId: 3,
					type: 'BUY',
					account: nisa,
					asset: stockJp,
					quantity: 200,
					amount: 98_000
				})
			],
			[]
		);

		expect(result.holdings).toHaveLength(2);
		expect(result.holdings.map((h) => [h.accountName, h.quantity])).toEqual([
			['課税口座', 100],
			['NISA口座', 200]
		]);
	});

	it('最新の基準日の価格で評価額を計算する', () => {
		const prices: PriceInput[] = [
			{ assetId: 3, date: new Date('2026-07-10'), price: 600 },
			{ assetId: 3, date: new Date('2026-07-09'), price: 500 }
		];
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				})
			],
			prices
		);

		expect(result.holdings[0]).toMatchObject({
			marketValue: 60_000,
			priceDate: new Date('2026-07-10')
		});
	});

	it('価格未登録の保有は評価額 null・基準日 null になる', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				})
			],
			[]
		);

		expect(result.holdings[0]).toMatchObject({ marketValue: null, priceDate: null });
		expect(result.totals[0]).toMatchObject({ marketValue: 0, hasMissingPrice: true });
	});

	it('全量売却済みの銘柄は保有に含めない', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000,
					occurredAt: new Date('2026-01-01')
				}),
				tx({
					accountId: 1,
					assetId: 3,
					type: 'SELL',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 55_000,
					occurredAt: new Date('2026-02-01')
				})
			],
			[]
		);

		expect(result.holdings).toEqual([]);
		expect(result.totals).toEqual([]);
	});

	it('通貨別合計は現金と評価額を通貨ごとに独立して集計する', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 1,
					assetId: 1,
					type: 'DEPOSIT',
					account: taxable,
					asset: cashJpy,
					amount: 100_000
				}),
				tx({
					accountId: 1,
					assetId: 2,
					type: 'DEPOSIT',
					account: taxable,
					asset: cashUsd,
					amount: 50_000
				}),
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				}),
				tx({
					accountId: 1,
					assetId: 4,
					type: 'BUY',
					account: taxable,
					asset: stockUs,
					quantity: 10,
					amount: 20_000
				})
			],
			[
				{ assetId: 3, date: new Date('2026-07-10'), price: 600 },
				{ assetId: 4, date: new Date('2026-07-10'), price: 2_500 }
			]
		);

		// JPY が先、USD が後（CURRENCIES の定義順）
		expect(result.totals).toEqual([
			{ currency: 'JPY', cashBalance: 100_000, marketValue: 60_000, hasMissingPrice: false },
			{ currency: 'USD', cashBalance: 50_000, marketValue: 25_000, hasMissingPrice: false }
		]);
	});

	it('投資信託は 1 万口あたりの基準価額で評価する', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 2,
					assetId: 5,
					type: 'BUY',
					account: nisa,
					asset: fund,
					quantity: 37_770,
					amount: 100_000
				})
			],
			[{ assetId: 5, date: new Date('2026-07-10'), price: 27_412 }]
		);

		// 37,770 口 × 27,412 円 ÷ 10,000 口 = 103,535.1... → 四捨五入
		expect(result.holdings[0]?.marketValue).toBe(103_535);
	});

	it('保有・現金は口座 → 資産の登録順に並ぶ', () => {
		const result = buildOverview(
			[
				tx({
					accountId: 2,
					assetId: 5,
					type: 'BUY',
					account: nisa,
					asset: fund,
					quantity: 10_000,
					amount: 10_000
				}),
				tx({
					accountId: 1,
					assetId: 4,
					type: 'BUY',
					account: taxable,
					asset: stockUs,
					quantity: 10,
					amount: 20_000
				}),
				tx({
					accountId: 1,
					assetId: 3,
					type: 'BUY',
					account: taxable,
					asset: stockJp,
					quantity: 100,
					amount: 50_000
				})
			],
			[]
		);

		expect(result.holdings.map((h) => [h.accountId, h.assetId])).toEqual([
			[1, 3],
			[1, 4],
			[2, 5]
		]);
	});
});
