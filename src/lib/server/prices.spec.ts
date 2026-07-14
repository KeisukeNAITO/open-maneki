import { describe, expect, it } from 'vitest';
import { validateMarketPriceForm, type MarketPriceFormInput } from './prices';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const stockJp = { id: 1, type: 'STOCK_JP', currency: 'JPY' };
const stockUs = { id: 2, type: 'STOCK_US', currency: 'USD' };
const cashJpy = { id: 3, type: 'CASH', currency: 'JPY' };
const today = new Date('2026-07-14T00:00:00Z');

function input(overrides: Partial<MarketPriceFormInput> = {}): MarketPriceFormInput {
	return { assetId: '1', date: '2026-07-13', price: '2500', ...overrides };
}

describe('validateMarketPriceForm', () => {
	it('JPY の正常系: 円の整数がそのまま最小通貨単位になる', () => {
		const result = validateMarketPriceForm(input(), stockJp, today);
		expect(result).toEqual({
			ok: true,
			value: { assetId: 1, date: new Date('2026-07-13T00:00:00Z'), price: 2500 }
		});
	});

	it('USD の正常系: ドル小数 2 桁がセントになる', () => {
		const result = validateMarketPriceForm(
			input({ assetId: '2', price: '189.99' }),
			stockUs,
			today
		);
		expect(result).toEqual({
			ok: true,
			value: { assetId: 2, date: new Date('2026-07-13T00:00:00Z'), price: 18999 }
		});
	});

	it('今日の日付は登録できる（未来日判定の境界）', () => {
		const result = validateMarketPriceForm(input({ date: '2026-07-14' }), stockJp, today);
		expect(result.ok).toBe(true);
	});

	it('資産が見つからない（null）と assetId エラーになる', () => {
		const result = validateMarketPriceForm(input(), null, today);
		expect(result).toMatchObject({ ok: false, errors: { assetId: '資産を選択してください' } });
	});

	it('CASH 資産は登録できない', () => {
		const result = validateMarketPriceForm(input({ assetId: '3' }), cashJpy, today);
		expect(result).toMatchObject({
			ok: false,
			errors: { assetId: '現金資産に価格は登録できません' }
		});
	});

	it('基準日が空・形式不正はエラーになる', () => {
		for (const date of [null, '', '2026/07/13', '13-07-2026']) {
			const result = validateMarketPriceForm(input({ date }), stockJp, today);
			expect(result).toMatchObject({
				ok: false,
				errors: { date: '基準日を YYYY-MM-DD 形式で入力してください' }
			});
		}
	});

	it('存在しない日付（2026-02-31）はエラーになる', () => {
		const result = validateMarketPriceForm(input({ date: '2026-02-31' }), stockJp, today);
		expect(result).toMatchObject({ ok: false, errors: { date: '存在しない日付です' } });
	});

	it('未来の日付はエラーになる', () => {
		const result = validateMarketPriceForm(input({ date: '2026-07-15' }), stockJp, today);
		expect(result).toMatchObject({ ok: false, errors: { date: '未来の日付は登録できません' } });
	});

	it('価格が空はエラーになる', () => {
		for (const price of [null, '', '   ']) {
			const result = validateMarketPriceForm(input({ price }), stockJp, today);
			expect(result).toMatchObject({ ok: false, errors: { price: '価格を入力してください' } });
		}
	});

	it('JPY に小数を入れると通貨別のメッセージでエラーになる', () => {
		const result = validateMarketPriceForm(input({ price: '12.5' }), stockJp, today);
		expect(result).toMatchObject({
			ok: false,
			errors: { price: '価格は円の整数で入力してください' }
		});
	});

	it('USD に小数 3 桁を入れると通貨別のメッセージでエラーになる', () => {
		const result = validateMarketPriceForm(
			input({ assetId: '2', price: '12.345' }),
			stockUs,
			today
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { price: '価格はドルで小数 2 桁までの数値で入力してください' }
		});
	});

	it('価格 0 はエラーになる', () => {
		const result = validateMarketPriceForm(input({ price: '0' }), stockJp, today);
		expect(result).toMatchObject({
			ok: false,
			errors: { price: '価格は 0 より大きい値を入力してください' }
		});
	});

	it('Prisma の Int（32bit）を超える価格はエラーになる', () => {
		const result = validateMarketPriceForm(input({ price: '2147483648' }), stockJp, today);
		expect(result).toMatchObject({ ok: false, errors: { price: '価格が大きすぎます' } });
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateMarketPriceForm(
			{ assetId: null, date: '2026/07/13', price: '' },
			null,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual(['assetId', 'date', 'price']);
		}
	});

	it('資産が不明な間は価格の形式検証をしない（通貨が決まらないため）', () => {
		const result = validateMarketPriceForm(input({ price: 'abc' }), null, today);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.assetId).toBeDefined();
			expect(result.errors.price).toBeUndefined();
		}
	});
});
