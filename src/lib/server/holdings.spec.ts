import { describe, it, expect } from 'vitest';
import { deriveCashBalance, derivePosition, type TransactionInput } from './holdings';

function buy(quantity: number | null, amount: number, occurredAt = '2026-01-01'): TransactionInput {
	return { type: 'BUY', occurredAt: new Date(occurredAt), quantity, amount };
}

function sell(
	quantity: number | null,
	amount: number,
	occurredAt = '2026-06-01'
): TransactionInput {
	return { type: 'SELL', occurredAt: new Date(occurredAt), quantity, amount };
}

function cash(type: 'DEPOSIT' | 'WITHDRAW', amount: number, occurredAt = '2026-01-01') {
	return { type, occurredAt: new Date(occurredAt), quantity: null, amount };
}

describe('derivePosition', () => {
	it('取引がなければ保有ゼロを返す', () => {
		expect(derivePosition([])).toEqual({ quantity: 0, costBasis: 0 });
	});

	it('単一の BUY をそのまま口数と取得原価に反映する', () => {
		// 100 株を受渡金額 250,000 円（手数料込み）で購入
		expect(derivePosition([buy(100, 250_000)])).toEqual({
			quantity: 100,
			costBasis: 250_000
		});
	});

	it('複数の BUY を積み上げる', () => {
		const position = derivePosition([
			buy(100, 250_000, '2026-01-05'),
			buy(50, 130_000, '2026-02-10')
		]);
		expect(position).toEqual({ quantity: 150, costBasis: 380_000 });
	});

	it('一部売却で取得原価を口数比で取り崩す（移動平均法）', () => {
		// 平均取得単価 2,500 円 × 40 株 = 100,000 円分を取り崩す
		const position = derivePosition([
			buy(100, 250_000, '2026-01-05'),
			sell(40, 120_000, '2026-03-01')
		]);
		expect(position).toEqual({ quantity: 60, costBasis: 150_000 });
	});

	it('全量売却で口数も取得原価もちょうどゼロになる', () => {
		const position = derivePosition([
			buy(3, 100, '2026-01-05'),
			sell(1, 40, '2026-02-01'), // 100 * 1/3 = 33.33... → 33 を取り崩し
			sell(2, 80, '2026-03-01') // 残り 67 を全額取り崩し
		]);
		expect(position).toEqual({ quantity: 0, costBasis: 0 });
	});

	it('配列の並び順ではなく発生日時の順に処理する', () => {
		// 配列上は SELL が先頭だが、日付は BUY の後
		const position = derivePosition([
			sell(40, 120_000, '2026-03-01'),
			buy(100, 250_000, '2026-01-05')
		]);
		expect(position).toEqual({ quantity: 60, costBasis: 150_000 });
	});

	it('保有口数を超える売却はエラーにする', () => {
		expect(() =>
			derivePosition([buy(100, 250_000, '2026-01-05'), sell(101, 300_000, '2026-03-01')])
		).toThrowError(/exceeds current holding/);
	});

	it('quantity のない BUY はエラーにする', () => {
		expect(() => derivePosition([buy(null, 250_000)])).toThrowError(
			/BUY quantity must be a positive integer/
		);
	});

	it('未知の取引種別はエラーにする', () => {
		const tx = { type: 'AIRDROP', occurredAt: new Date('2026-01-01'), quantity: 1, amount: 0 };
		expect(() => derivePosition([tx])).toThrowError(/Unknown transaction type/);
	});

	it('DIVIDEND は口数・取得原価に影響しない', () => {
		const dividend: TransactionInput = {
			type: 'DIVIDEND',
			occurredAt: new Date('2026-04-01'),
			quantity: null,
			amount: 5_000
		};
		const position = derivePosition([buy(100, 250_000, '2026-01-05'), dividend]);
		expect(position).toEqual({ quantity: 100, costBasis: 250_000 });
	});

	it('現金取引（DEPOSIT）が紛れ込んだらエラーにする', () => {
		expect(() => derivePosition([cash('DEPOSIT', 100_000)])).toThrowError(
			/not applicable to a security position/
		);
	});
});

describe('deriveCashBalance', () => {
	it('取引がなければ残高ゼロを返す', () => {
		expect(deriveCashBalance([])).toBe(0);
	});

	it('入金と出金を積み上げて残高を出す', () => {
		const balance = deriveCashBalance([
			cash('DEPOSIT', 500_000, '2026-01-05'),
			cash('WITHDRAW', 120_000, '2026-02-01'),
			cash('DEPOSIT', 30_000, '2026-03-01')
		]);
		expect(balance).toBe(410_000);
	});

	it('配列の並び順ではなく発生日時の順に処理する', () => {
		// 配列上は WITHDRAW が先頭だが、日付は DEPOSIT の後
		const balance = deriveCashBalance([
			cash('WITHDRAW', 120_000, '2026-02-01'),
			cash('DEPOSIT', 500_000, '2026-01-05')
		]);
		expect(balance).toBe(380_000);
	});

	it('残高を超える出金はエラーにする', () => {
		expect(() =>
			deriveCashBalance([
				cash('DEPOSIT', 100_000, '2026-01-05'),
				cash('WITHDRAW', 100_001, '2026-02-01')
			])
		).toThrowError(/exceeds current balance/);
	});

	it('証券取引（BUY）が紛れ込んだらエラーにする', () => {
		expect(() => deriveCashBalance([buy(100, 250_000)])).toThrowError(/not applicable to cash/);
	});
});
