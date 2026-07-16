import { describe, expect, it } from 'vitest';
import { validateAccountForm, type AccountFormInput } from './accounts';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const existing = [
	{ name: '楽天証券', type: 'TAXABLE' },
	{ name: '楽天証券', type: 'NISA' }
];

function input(overrides: Partial<AccountFormInput> = {}): AccountFormInput {
	return { name: '○○銀行', type: 'TAXABLE', ...overrides };
}

describe('validateAccountForm', () => {
	it('正常系: 名前と種別がそのまま検証済みの値になる', () => {
		expect(validateAccountForm(input(), existing)).toEqual({
			ok: true,
			value: { name: '○○銀行', type: 'TAXABLE' }
		});
	});

	it('名前の前後の空白は取り除いて登録する', () => {
		const result = validateAccountForm(input({ name: '  ○○銀行  ' }), existing);
		expect(result).toMatchObject({ ok: true, value: { name: '○○銀行' } });
	});

	it('既存口座が 0 件でも登録できる（最初の 1 件）', () => {
		expect(validateAccountForm(input(), []).ok).toBe(true);
	});

	it('名前が空・空白のみはエラーになる', () => {
		for (const name of [null, '', '   ']) {
			expect(validateAccountForm(input({ name }), existing)).toMatchObject({
				ok: false,
				errors: { name: '口座名を入力してください' }
			});
		}
	});

	it('種別が空・未知の値はエラーになる', () => {
		for (const type of [null, '', 'SPECIAL']) {
			expect(validateAccountForm(input({ type }), existing)).toMatchObject({
				ok: false,
				errors: { type: '口座種別を選択してください' }
			});
		}
	});

	it('同じ名前・同じ種別の口座は重複エラーになる', () => {
		const result = validateAccountForm(input({ name: '楽天証券', type: 'TAXABLE' }), existing);
		expect(result).toMatchObject({
			ok: false,
			errors: { name: '同じ名前・種別の口座が既に登録されています' }
		});
	});

	it('空白を取り除いた結果が既存と同じ名前なら重複エラーになる', () => {
		const result = validateAccountForm(input({ name: ' 楽天証券 ', type: 'TAXABLE' }), existing);
		expect(result).toMatchObject({
			ok: false,
			errors: { name: '同じ名前・種別の口座が既に登録されています' }
		});
	});

	it('同じ名前でも種別が違えば登録できる（同じ金融機関の複数口座）', () => {
		const result = validateAccountForm(input({ name: '楽天証券', type: 'DC' }), existing);
		expect(result).toEqual({ ok: true, value: { name: '楽天証券', type: 'DC' } });
	});

	it('種別が不明な間は重複判定をしない（type 側のエラーで足りる）', () => {
		const result = validateAccountForm(input({ name: '楽天証券', type: null }), existing);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.type).toBeDefined();
			expect(result.errors.name).toBeUndefined();
		}
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateAccountForm({ name: '', type: '' }, existing);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual(['name', 'type']);
		}
	});
});
