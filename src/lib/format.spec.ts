import { describe, expect, it } from 'vitest';
import {
	formatDividendRate,
	formatMoney,
	formatMoneyForInput,
	parseDividendRate,
	parseMoney
} from './format';

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

describe('formatMoneyForInput', () => {
	it('JPY は円の整数をそのまま返す（記号・桁区切りなし）', () => {
		expect(formatMoneyForInput(1_234_567, 'JPY')).toBe('1234567');
	});

	it('USD はセントをドル小数 2 桁にする（記号・桁区切りなし）', () => {
		expect(formatMoneyForInput(189_900, 'USD')).toBe('1899.00');
	});

	it('USD は 1 ドル未満でも小数 2 桁を保つ', () => {
		expect(formatMoneyForInput(5, 'USD')).toBe('0.05');
	});

	it('parseMoney で読み戻すと元の最小通貨単位に一致する（往復）', () => {
		expect(parseMoney(formatMoneyForInput(189_900, 'USD'), 'USD')).toBe(189_900);
		expect(parseMoney(formatMoneyForInput(1_234_567, 'JPY'), 'JPY')).toBe(1_234_567);
	});

	it('未知の通貨はエラーになる', () => {
		expect(() => formatMoneyForInput(100, 'EUR')).toThrow('Unknown currency: EUR');
	});
});

describe('parseDividendRate', () => {
	it('JPY の小数（1 株あたり）を最小通貨単位 × 10000 のレートにする', () => {
		expect(parseDividendRate('28.5', 'JPY')).toBe(285_000);
	});

	it('JPY の整数もレート化する', () => {
		expect(parseDividendRate('30', 'JPY')).toBe(300_000);
	});

	it('JPY は小数 4 桁まで表現できる', () => {
		expect(parseDividendRate('28.5555', 'JPY')).toBe(285_555);
	});

	it('JPY の小数 5 桁は精度超過で null になる', () => {
		expect(parseDividendRate('28.55555', 'JPY')).toBeNull();
	});

	it('USD のドル小数をセント × 10000 のレートにする（$0.245 = 245000）', () => {
		expect(parseDividendRate('0.245', 'USD')).toBe(245_000);
	});

	it('USD の整数はドル → セント換算してレート化する（$1 = 1000000）', () => {
		expect(parseDividendRate('1', 'USD')).toBe(1_000_000);
	});

	it('桁区切りのカンマと前後の空白は無視する', () => {
		expect(parseDividendRate(' 1,234.5 ', 'JPY')).toBe(12_345_000);
	});

	it('数値でない入力・負数・空文字は null になる', () => {
		expect(parseDividendRate('abc', 'JPY')).toBeNull();
		expect(parseDividendRate('-5', 'JPY')).toBeNull();
		expect(parseDividendRate('', 'JPY')).toBeNull();
	});

	it('未知の通貨はエラーになる', () => {
		expect(() => parseDividendRate('100', 'EUR')).toThrow('Unknown currency: EUR');
	});
});

describe('formatDividendRate', () => {
	it('JPY のレートを表示用の小数にする（末尾 0 は落とす）', () => {
		expect(formatDividendRate(285_000, 'JPY')).toBe('28.5');
	});

	it('JPY の整数レートは小数点を付けない', () => {
		expect(formatDividendRate(300_000, 'JPY')).toBe('30');
	});

	it('USD のレートをドル表示にする（245000 = 0.245）', () => {
		expect(formatDividendRate(245_000, 'USD')).toBe('0.245');
	});

	it('USD の整数ドルは小数点を付けない', () => {
		expect(formatDividendRate(1_000_000, 'USD')).toBe('1');
	});

	it('parseDividendRate で読み戻すと元のレートに一致する（往復）', () => {
		expect(parseDividendRate(formatDividendRate(285_000, 'JPY'), 'JPY')).toBe(285_000);
		expect(parseDividendRate(formatDividendRate(245_000, 'USD'), 'USD')).toBe(245_000);
	});

	it('未知の通貨はエラーになる', () => {
		expect(() => formatDividendRate(100, 'EUR')).toThrow('Unknown currency: EUR');
	});
});
