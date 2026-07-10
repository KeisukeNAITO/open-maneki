import { describe, it, expect } from 'vitest';
import { derivePosition, type TransactionInput } from './holdings';

function buy(quantity: number | null, amount: number, occurredAt = '2026-01-01'): TransactionInput {
	return { type: 'BUY', occurredAt: new Date(occurredAt), quantity, amount };
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

	it('quantity のない BUY はエラーにする', () => {
		expect(() => derivePosition([buy(null, 250_000)])).toThrowError(/positive integer quantity/);
	});

	it('未知の取引種別はエラーにする', () => {
		const tx = { type: 'AIRDROP', occurredAt: new Date('2026-01-01'), quantity: 1, amount: 0 };
		expect(() => derivePosition([tx])).toThrowError(/Unknown transaction type/);
	});
});
