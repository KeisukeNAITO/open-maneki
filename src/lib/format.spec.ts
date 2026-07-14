import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoney } from './format';

describe('parseMoney', () => {
	it('JPY は円の整数として読む', () => {
		expect(parseMoney('1234', 'JPY')).toBe(1234);
	});

	it('桁区切りのカンマと前後の空白は無視する', () => {
		expect(parseMoney(' 1,234,567 ', 'JPY')).toBe(1_234_567);
	});

	it('JPY の小数は不正入力として null になる', () => {
		expect(parseMoney('12.5', 'JPY')).toBeNull();
	});

	it('USD はドル小数 2 桁をセントに換算する', () => {
		expect(parseMoney('12.34', 'USD')).toBe(1234);
	});

	it('USD の小数 1 桁は右を 0 埋めする（12.3 ドル = 1230 セント）', () => {
		expect(parseMoney('12.3', 'USD')).toBe(1230);
	});

	it('USD の整数はセント 00 として読む', () => {
		expect(parseMoney('12', 'USD')).toBe(1200);
	});

	it('USD は 1 ドル未満も読める', () => {
		expect(parseMoney('0.05', 'USD')).toBe(5);
	});

	it('USD の小数 3 桁は null になる', () => {
		expect(parseMoney('12.345', 'USD')).toBeNull();
	});

	it('数値でない入力・負数・空文字は null になる', () => {
		expect(parseMoney('abc', 'JPY')).toBeNull();
		expect(parseMoney('-5', 'JPY')).toBeNull();
		expect(parseMoney('', 'JPY')).toBeNull();
	});

	it('未知の通貨はエラーになる', () => {
		expect(() => parseMoney('100', 'EUR')).toThrow('Unknown currency: EUR');
	});
});

describe('formatMoney', () => {
	it('JPY は円単位のまま桁区切りで表示する', () => {
		expect(formatMoney(1_234_567, 'JPY')).toBe('¥1,234,567');
	});

	it('JPY のゼロは ¥0 になる', () => {
		expect(formatMoney(0, 'JPY')).toBe('¥0');
	});

	it('USD はセントをドルに換算して小数 2 桁で表示する', () => {
		expect(formatMoney(189_900, 'USD')).toBe('$1,899.00');
	});

	it('USD は 1 ドル未満でも小数 2 桁を保つ', () => {
		expect(formatMoney(5, 'USD')).toBe('$0.05');
	});

	it('未知の通貨はエラーになる', () => {
		expect(() => formatMoney(100, 'EUR')).toThrow('Unknown currency: EUR');
	});
});
