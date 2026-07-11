import { describe, it, expect } from 'vitest';
import { deriveMarketValue } from './valuation';

describe('deriveMarketValue', () => {
	it('国内株は株数 × 終値をそのまま返す', () => {
		// 100 株 × 3,120 円
		expect(deriveMarketValue('STOCK_JP', 100, 3_120)).toBe(312_000);
	});

	it('米国株はセント単位のまま計算する', () => {
		// 10 株 × $218.34（= 21,834 セント）
		expect(deriveMarketValue('STOCK_US', 10, 21_834)).toBe(218_340);
	});

	it('投資信託は 1 万口あたりの基準価額で換算する', () => {
		// 100,000 口 × 27,412 円 / 1 万口 = 274,120 円
		expect(deriveMarketValue('FUND', 100_000, 27_412)).toBe(274_120);
	});

	it('投資信託の端数は四捨五入する', () => {
		// 12,345 口 × 21,530 円 / 1 万口 = 26,578.7... → 26,579 円
		expect(deriveMarketValue('FUND', 12_345, 21_530)).toBe(26_579);
		// 5,000 口 × 101 円 / 1 万口 = 50.5 → 51 円（.5 は切り上げ）
		expect(deriveMarketValue('FUND', 5_000, 101)).toBe(51);
	});

	it('価格が未登録なら null を返す', () => {
		expect(deriveMarketValue('STOCK_JP', 100, null)).toBeNull();
	});

	it('保有ゼロなら価格が未登録でも評価額ゼロ', () => {
		expect(deriveMarketValue('STOCK_JP', 0, null)).toBe(0);
		expect(deriveMarketValue('FUND', 0, 27_412)).toBe(0);
	});

	it('CASH は評価額の対象外としてエラーにする', () => {
		expect(() => deriveMarketValue('CASH', 0, null)).toThrow(/CASH has no market valuation/);
	});

	it('未知の資産種別はエラーにする', () => {
		expect(() => deriveMarketValue('CRYPTO', 1, 100)).toThrow(/Unknown asset type/);
	});

	it('負の口数・整数でない口数はエラーにする', () => {
		expect(() => deriveMarketValue('STOCK_JP', -1, 100)).toThrow(/non-negative integer/);
		expect(() => deriveMarketValue('STOCK_JP', 1.5, 100)).toThrow(/non-negative integer/);
	});

	it('ゼロ以下・整数でない価格はエラーにする', () => {
		expect(() => deriveMarketValue('STOCK_JP', 1, 0)).toThrow(/positive integer/);
		expect(() => deriveMarketValue('STOCK_JP', 1, 100.5)).toThrow(/positive integer/);
	});
});
