import { describe, expect, it } from 'vitest';
import {
	cashAssetName,
	validateNewCurrencyDeposit,
	type NewCurrencyFormInput
} from './newCurrency';
import type { CashAssetOption } from './transactions';

// テストヘルパー: 各テストで検証したい項目だけを overrides で上書きする。
// デフォルトは「口座 1 に USD 現金を 100.00 ドル入金する」正常系。
const account = { id: 1 };
const today = new Date(Date.UTC(2026, 9, 14)); // 2026-10-14

// 既存の CASH 資産は JPY のみ（USD は未作成＝作成パスの既定）。
const cashAssets: CashAssetOption[] = [{ id: 10, name: 'JPY 現金', currency: 'JPY' }];
const assetNames = ['JPY 現金', 'トヨタ自動車'];

function input(overrides: Partial<NewCurrencyFormInput> = {}): NewCurrencyFormInput {
	return {
		accountId: '1',
		currency: 'USD',
		occurredAt: '2026-10-01',
		amount: '100.00',
		note: null,
		...overrides
	};
}

describe('validateNewCurrencyDeposit', () => {
	it('作成パス: 未登録通貨なら自動命名の CASH 資産＋DEPOSIT（取引の assetId は仮値 0）', () => {
		const result = validateNewCurrencyDeposit(input(), account, cashAssets, assetNames, today);
		expect(result).toEqual({
			ok: true,
			create: true,
			asset: {
				name: 'USD 現金',
				type: 'CASH',
				symbol: null,
				currency: 'USD'
			},
			transaction: {
				accountId: 1,
				assetId: 0,
				type: 'DEPOSIT',
				occurredAt: new Date(Date.UTC(2026, 9, 1)),
				quantity: null,
				amount: 10000, // USD はセント化
				currency: 'USD',
				note: null
			}
		});
	});

	it('再利用パス: 既存通貨なら資産を作らず既存 id へ DEPOSIT（create: false）', () => {
		const result = validateNewCurrencyDeposit(
			input({ currency: 'JPY', amount: '5000' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result).toEqual({
			ok: true,
			create: false,
			transaction: {
				accountId: 1,
				assetId: 10, // 既存 JPY 現金の id
				type: 'DEPOSIT',
				occurredAt: new Date(Date.UTC(2026, 9, 1)),
				quantity: null,
				amount: 5000,
				currency: 'JPY',
				note: null
			}
		});
	});

	it('通貨未選択はエラー', () => {
		const result = validateNewCurrencyDeposit(
			input({ currency: '' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result).toEqual({ ok: false, errors: { currency: '通貨を選択してください' } });
	});

	it('未知の通貨はエラー', () => {
		const result = validateNewCurrencyDeposit(
			input({ currency: 'EUR' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result).toEqual({ ok: false, errors: { currency: '通貨を選択してください' } });
	});

	it('口座が見つからない（null）はエラー', () => {
		const result = validateNewCurrencyDeposit(input(), null, cashAssets, assetNames, today);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.accountId).toBe('口座を選択してください');
	});

	it('金額未入力はエラー', () => {
		const result = validateNewCurrencyDeposit(
			input({ amount: '' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.amount).toBe('金額を入力してください');
	});

	it('USD にセント未満の精度はエラー（amount の形式検証が効いている）', () => {
		const result = validateNewCurrencyDeposit(
			input({ amount: '100.005' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok)
			expect(result.errors.amount).toBe('金額はドルで小数 2 桁までの数値で入力してください');
	});

	it('未来日はエラー', () => {
		const result = validateNewCurrencyDeposit(
			input({ occurredAt: '2026-10-15' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.occurredAt).toBe('未来の日付は登録できません');
	});

	it('自動名が別資産と衝突する場合は作成を拒否（general エラー）', () => {
		// USD の CASH 資産は無いが、別種別で「USD 現金」という名前が既に使われている
		const result = validateNewCurrencyDeposit(
			input(),
			account,
			cashAssets,
			[...assetNames, 'USD 現金'],
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok)
			expect(result.errors.general).toBe(
				'「USD 現金」は既に別の資産で使われているため作成できません'
			);
	});

	it('複数のエラーを一括で返す（通貨・金額）', () => {
		const result = validateNewCurrencyDeposit(
			input({ currency: '', amount: '' }),
			account,
			cashAssets,
			assetNames,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.currency).toBe('通貨を選択してください');
			expect(result.errors.amount).toBe('金額を入力してください');
		}
	});

	it('cashAssetName は通貨名＋現金', () => {
		expect(cashAssetName('JPY')).toBe('JPY 現金');
		expect(cashAssetName('USD')).toBe('USD 現金');
	});
});
