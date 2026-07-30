import { describe, expect, it } from 'vitest';
import { validateDividendForecastForm, type DividendForecastFormInput } from './dividends';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const stockJp = { id: 1, type: 'STOCK_JP', currency: 'JPY' };
const stockUs = { id: 2, type: 'STOCK_US', currency: 'USD' };
const cashJpy = { id: 3, type: 'CASH', currency: 'JPY' };
const fundJpy = { id: 4, type: 'FUND', currency: 'JPY' };

function input(overrides: Partial<DividendForecastFormInput> = {}): DividendForecastFormInput {
	return { assetId: '1', exDate: '2026-09-30', amountPerShare: '30', ...overrides };
}

describe('validateDividendForecastForm', () => {
	it('JPY の正常系: 1 株あたり配当が最小通貨単位 × 10000 のレートになる', () => {
		const result = validateDividendForecastForm(input({ amountPerShare: '28.5' }), stockJp);
		expect(result).toEqual({
			ok: true,
			value: { assetId: 1, exDate: new Date('2026-09-30T00:00:00Z'), amountPerShare: 285_000 }
		});
	});

	it('USD の正常系: ドル/株がセント × 10000 のレートになる', () => {
		const result = validateDividendForecastForm(
			input({ assetId: '2', amountPerShare: '0.245' }),
			stockUs
		);
		expect(result).toEqual({
			ok: true,
			value: { assetId: 2, exDate: new Date('2026-09-30T00:00:00Z'), amountPerShare: 245_000 }
		});
	});

	it('未来の権利確定日を登録できる（配当予想は未来日が正常）', () => {
		const result = validateDividendForecastForm(input({ exDate: '2030-03-31' }), stockJp);
		expect(result.ok).toBe(true);
	});

	it('過去の権利確定日も登録できる（按分の期間境界として使う）', () => {
		const result = validateDividendForecastForm(input({ exDate: '2020-03-31' }), stockJp);
		expect(result.ok).toBe(true);
	});

	it('資産が見つからない（null）と assetId エラーになる', () => {
		const result = validateDividendForecastForm(input(), null);
		expect(result).toMatchObject({ ok: false, errors: { assetId: '資産を選択してください' } });
	});

	it('CASH 資産には配当予想を登録できない', () => {
		const result = validateDividendForecastForm(input({ assetId: '3' }), cashJpy);
		expect(result).toMatchObject({
			ok: false,
			errors: { assetId: '配当予想を登録できるのは株式のみです' }
		});
	});

	it('FUND（投資信託）は当面対象外として拒否する', () => {
		const result = validateDividendForecastForm(input({ assetId: '4' }), fundJpy);
		expect(result).toMatchObject({
			ok: false,
			errors: { assetId: '配当予想を登録できるのは株式のみです' }
		});
	});

	it('権利確定日が空・形式不正はエラーになる', () => {
		for (const exDate of [null, '', '2026/09/30', '30-09-2026']) {
			const result = validateDividendForecastForm(input({ exDate }), stockJp);
			expect(result).toMatchObject({
				ok: false,
				errors: { exDate: '権利確定日を YYYY-MM-DD 形式で入力してください' }
			});
		}
	});

	it('存在しない日付（2026-02-31）はエラーになる', () => {
		const result = validateDividendForecastForm(input({ exDate: '2026-02-31' }), stockJp);
		expect(result).toMatchObject({ ok: false, errors: { exDate: '存在しない日付です' } });
	});

	it('1 株あたり配当が空はエラーになる', () => {
		for (const amountPerShare of [null, '', '   ']) {
			const result = validateDividendForecastForm(input({ amountPerShare }), stockJp);
			expect(result).toMatchObject({
				ok: false,
				errors: { amountPerShare: '1 株あたり配当を入力してください' }
			});
		}
	});

	it('JPY に不正な値を入れると通貨別のメッセージでエラーになる', () => {
		const result = validateDividendForecastForm(input({ amountPerShare: 'abc' }), stockJp);
		expect(result).toMatchObject({
			ok: false,
			errors: { amountPerShare: '1 株あたり配当は円で入力してください（小数可）' }
		});
	});

	it('1 株あたり配当 0 はエラーになる', () => {
		const result = validateDividendForecastForm(input({ amountPerShare: '0' }), stockJp);
		expect(result).toMatchObject({
			ok: false,
			errors: { amountPerShare: '1 株あたり配当は 0 より大きい値を入力してください' }
		});
	});

	it('Prisma の Int（32bit）を超えるレートはエラーになる', () => {
		// 214749 円/株 × 10000 = 2147490000 > INT32_MAX
		const result = validateDividendForecastForm(input({ amountPerShare: '214749' }), stockJp);
		expect(result).toMatchObject({
			ok: false,
			errors: { amountPerShare: '1 株あたり配当が大きすぎます' }
		});
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateDividendForecastForm(
			{ assetId: null, exDate: '2026/09/30', amountPerShare: '' },
			null
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual(['amountPerShare', 'assetId', 'exDate']);
		}
	});

	it('資産が不明な間は 1 株あたり配当の形式検証をしない（通貨が決まらないため）', () => {
		const result = validateDividendForecastForm(input({ amountPerShare: 'abc' }), null);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.assetId).toBeDefined();
			expect(result.errors.amountPerShare).toBeUndefined();
		}
	});
});
