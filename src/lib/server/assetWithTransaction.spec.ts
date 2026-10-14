import { describe, expect, it } from 'vitest';
import { validateNewAssetTransaction } from './assetWithTransaction';
import type { AssetFormInput } from './assets';
import type { TransactionFormInput } from './transactions';

// テストヘルパー: 各テストで検証したい項目だけを overrides で上書きし、
// それ以外はデフォルト値で埋める。デフォルトは「新しい日本株を 100 株
// 買い付ける」正常系の最初の取引。
const existing = [{ name: 'トヨタ自動車' }];
const account = { id: 1 };
const today = new Date(Date.UTC(2026, 9, 14)); // 2026-10-14

function assetInput(overrides: Partial<AssetFormInput> = {}): AssetFormInput {
	return {
		name: '任天堂',
		type: 'STOCK_JP',
		symbol: '7974',
		currency: 'JPY',
		shareholderBenefit: null,
		...overrides
	};
}

function txInput(overrides: Partial<TransactionFormInput> = {}): TransactionFormInput {
	return {
		accountId: '1',
		assetId: null, // 新規フローでは使わない（資産はこのフォームで作る）
		type: 'BUY',
		occurredAt: '2026-10-01',
		quantity: '100',
		amount: '285000',
		note: null,
		...overrides
	};
}

describe('validateNewAssetTransaction', () => {
	it('正常系: 資産と取引の両方が検証済みの値になる（取引の assetId は仮値 0）', () => {
		const result = validateNewAssetTransaction(assetInput(), txInput(), account, existing, today);
		expect(result).toEqual({
			ok: true,
			asset: {
				name: '任天堂',
				type: 'STOCK_JP',
				symbol: '7974',
				currency: 'JPY',
				shareholderBenefit: null
			},
			transaction: {
				accountId: 1,
				assetId: 0,
				type: 'BUY',
				occurredAt: new Date(Date.UTC(2026, 9, 1)),
				quantity: 100,
				amount: 285000,
				currency: 'JPY',
				note: null
			}
		});
	});

	it('通貨は資産の種別から採用される（米国株は USD、金額はドル小数をセント化）', () => {
		const result = validateNewAssetTransaction(
			assetInput({ name: 'Apple Inc.', type: 'STOCK_US', symbol: 'AAPL', currency: 'USD' }),
			txInput({ quantity: '10', amount: '1899.00' }),
			account,
			existing,
			today
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.transaction.currency).toBe('USD');
			expect(result.transaction.amount).toBe(189900);
		}
	});

	it('資産側・取引側のエラーを一括で返す', () => {
		const result = validateNewAssetTransaction(
			assetInput({ name: '' }),
			txInput({ type: '', amount: '' }),
			account,
			existing,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.assetErrors.name).toBeDefined();
			expect(result.transactionErrors.type).toBeDefined();
		}
	});

	it('資産名の重複は資産側エラーになる', () => {
		const result = validateNewAssetTransaction(
			assetInput({ name: 'トヨタ自動車' }),
			txInput(),
			account,
			existing,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.assetErrors.name).toBeDefined();
		}
	});

	it('種別と通貨の不整合（日本株に USD）は資産側エラーになる', () => {
		const result = validateNewAssetTransaction(
			assetInput({ currency: 'USD' }),
			txInput(),
			account,
			existing,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.assetErrors.currency).toBeDefined();
		}
	});

	it('口座が未解決なら取引側の accountId エラーになる', () => {
		const result = validateNewAssetTransaction(assetInput(), txInput(), null, existing, today);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.transactionErrors.accountId).toBeDefined();
		}
	});

	it('資産検証が失敗しても assetId エラーは取引側に出さない（資産側で表現済み）', () => {
		const result = validateNewAssetTransaction(
			assetInput({ type: '' }), // 資産種別未選択 → asset = null で取引検証
			txInput(),
			account,
			existing,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.assetErrors.type).toBeDefined();
			expect(result.transactionErrors.assetId).toBeUndefined();
		}
	});
});
