import { describe, expect, it } from 'vitest';
import { validateAssetForm, type AssetFormInput } from './assets';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const existing = [{ name: 'トヨタ自動車' }, { name: 'JPY 現金' }];

function input(overrides: Partial<AssetFormInput> = {}): AssetFormInput {
	return {
		name: '任天堂',
		type: 'STOCK_JP',
		symbol: '7974',
		currency: 'JPY',
		shareholderBenefit: null,
		...overrides
	};
}

describe('validateAssetForm', () => {
	it('正常系: 日本株の全項目がそのまま検証済みの値になる', () => {
		const result = validateAssetForm(input({ shareholderBenefit: '自社ゲーム割引' }), existing);
		expect(result).toEqual({
			ok: true,
			value: {
				name: '任天堂',
				type: 'STOCK_JP',
				symbol: '7974',
				currency: 'JPY',
				shareholderBenefit: '自社ゲーム割引'
			}
		});
	});

	it('正常系: 現金は symbol・優待メモなしで登録でき、空文字は null になる', () => {
		const result = validateAssetForm(
			input({
				name: 'USD 現金',
				type: 'CASH',
				symbol: '',
				currency: 'USD',
				shareholderBenefit: ''
			}),
			existing
		);
		expect(result).toEqual({
			ok: true,
			value: {
				name: 'USD 現金',
				type: 'CASH',
				symbol: null,
				currency: 'USD',
				shareholderBenefit: null
			}
		});
	});

	it('名前・symbol・優待メモの前後の空白は取り除いて登録する', () => {
		const result = validateAssetForm(
			input({ name: '  任天堂  ', symbol: ' 7974 ', shareholderBenefit: ' メモ ' }),
			existing
		);
		expect(result).toMatchObject({
			ok: true,
			value: { name: '任天堂', symbol: '7974', shareholderBenefit: 'メモ' }
		});
	});

	it('既存資産が 0 件でも登録できる（最初の 1 件）', () => {
		expect(validateAssetForm(input(), []).ok).toBe(true);
	});

	it('名前が空・空白のみはエラーになる', () => {
		for (const name of [null, '', '   ']) {
			expect(validateAssetForm(input({ name }), existing)).toMatchObject({
				ok: false,
				errors: { name: '資産名を入力してください' }
			});
		}
	});

	it('同じ名前の資産は重複エラーになる（trim 後の一致も含む）', () => {
		for (const name of ['トヨタ自動車', ' トヨタ自動車 ']) {
			expect(validateAssetForm(input({ name }), existing)).toMatchObject({
				ok: false,
				errors: { name: '同じ名前の資産が既に登録されています' }
			});
		}
	});

	it('種別が空・未知の値はエラーになる', () => {
		for (const type of [null, '', 'CRYPTO']) {
			expect(validateAssetForm(input({ type }), existing)).toMatchObject({
				ok: false,
				errors: { type: '資産種別を選択してください' }
			});
		}
	});

	it('通貨が空・未知の値はエラーになる', () => {
		for (const currency of [null, '', 'EUR']) {
			expect(validateAssetForm(input({ currency }), existing)).toMatchObject({
				ok: false,
				errors: { currency: '通貨を選択してください' }
			});
		}
	});

	it('日本株に USD はエラーになる（通貨は種別から強制）', () => {
		expect(validateAssetForm(input({ currency: 'USD' }), existing)).toMatchObject({
			ok: false,
			errors: { currency: '日本株の通貨は JPY にしてください' }
		});
	});

	it('米国株に JPY はエラーになる（通貨は種別から強制）', () => {
		const result = validateAssetForm(
			input({ name: 'Apple', type: 'STOCK_US', symbol: 'AAPL', currency: 'JPY' }),
			existing
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { currency: '米国株の通貨は USD にしてください' }
		});
	});

	it('投資信託と現金は JPY / USD のどちらも選べる', () => {
		for (const currency of ['JPY', 'USD'] as const) {
			const fund = validateAssetForm(
				input({ name: `ファンド ${currency}`, type: 'FUND', symbol: null, currency }),
				existing
			);
			expect(fund).toMatchObject({ ok: true, value: { currency } });
		}
	});

	it('現金に symbol を入力するとエラーになる', () => {
		const result = validateAssetForm(
			input({ name: 'EUR 現金', type: 'CASH', symbol: 'CASH-1' }),
			existing
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { symbol: '現金に証券コードは登録できません' }
		});
	});

	it('symbol は任意（空・空白のみは null として登録される）', () => {
		const result = validateAssetForm(input({ symbol: '   ' }), existing);
		expect(result).toMatchObject({ ok: true, value: { symbol: null } });
	});

	it('日本株以外に優待メモを入力するとエラーになる', () => {
		for (const type of ['STOCK_US', 'FUND', 'CASH'] as const) {
			const result = validateAssetForm(
				input({
					name: `資産 ${type}`,
					type,
					symbol: null,
					currency: type === 'STOCK_US' ? 'USD' : 'JPY',
					shareholderBenefit: 'メモ'
				}),
				existing
			);
			expect(result).toMatchObject({
				ok: false,
				errors: { shareholderBenefit: '株主優待メモは日本株のみ登録できます' }
			});
		}
	});

	it('種別が不明な間は優待メモの判定をしない（type 側のエラーで足りる）', () => {
		const result = validateAssetForm(input({ type: null, shareholderBenefit: 'メモ' }), existing);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.type).toBeDefined();
			expect(result.errors.shareholderBenefit).toBeUndefined();
		}
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateAssetForm(
			{ name: '', type: '', symbol: null, currency: '', shareholderBenefit: null },
			existing
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual(['currency', 'name', 'type']);
		}
	});
});
