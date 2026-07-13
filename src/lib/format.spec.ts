import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

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
