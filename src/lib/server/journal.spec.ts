import { describe, expect, it } from 'vitest';
import { validateJournalEntryForm, type JournalEntryFormInput } from './journal';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const asset = { id: 7 };
const today = new Date('2026-07-20T00:00:00Z');

function input(overrides: Partial<JournalEntryFormInput> = {}): JournalEntryFormInput {
	return {
		assetId: '7',
		entryDate: '2026-07-20',
		body: '決算が良かったので気になっている',
		...overrides
	};
}

describe('validateJournalEntryForm', () => {
	it('正常系: 資産に紐づくエントリが検証済みの値になる', () => {
		expect(validateJournalEntryForm(input(), asset, today)).toEqual({
			ok: true,
			value: {
				assetId: 7,
				entryDate: new Date('2026-07-20T00:00:00Z'),
				body: '決算が良かったので気になっている'
			}
		});
	});

	it('資産の選択なし（null・空文字）は assetId null の全般メモとして通る', () => {
		for (const assetId of [null, '', '  ']) {
			expect(validateJournalEntryForm(input({ assetId }), null, today)).toMatchObject({
				ok: true,
				value: { assetId: null }
			});
		}
	});

	it('本文の前後の空白は取り除いて登録する', () => {
		const result = validateJournalEntryForm(input({ body: '  相場が荒れている  ' }), asset, today);
		expect(result).toMatchObject({ ok: true, value: { body: '相場が荒れている' } });
	});

	it('選択ありなのに資産が見つからない場合はエラーになる', () => {
		expect(validateJournalEntryForm(input({ assetId: '999' }), null, today)).toMatchObject({
			ok: false,
			errors: { assetId: '選択された資産が見つかりません' }
		});
	});

	it('本文が空・空白のみはエラーになる', () => {
		for (const body of [null, '', '   ']) {
			expect(validateJournalEntryForm(input({ body }), asset, today)).toMatchObject({
				ok: false,
				errors: { body: '本文を入力してください' }
			});
		}
	});

	it('記録日の形式が不正・空はエラーになる', () => {
		for (const entryDate of [null, '', '2026/07/20', '20-07-2026']) {
			expect(validateJournalEntryForm(input({ entryDate }), asset, today)).toMatchObject({
				ok: false,
				errors: { entryDate: '記録日を YYYY-MM-DD 形式で入力してください' }
			});
		}
	});

	it('存在しない日付はエラーになる', () => {
		expect(
			validateJournalEntryForm(input({ entryDate: '2026-02-31' }), asset, today)
		).toMatchObject({ ok: false, errors: { entryDate: '存在しない日付です' } });
	});

	it('未来の日付はエラーになる', () => {
		expect(
			validateJournalEntryForm(input({ entryDate: '2026-07-21' }), asset, today)
		).toMatchObject({ ok: false, errors: { entryDate: '未来の日付は登録できません' } });
	});

	it('今日の日付は登録できる（境界）', () => {
		expect(validateJournalEntryForm(input({ entryDate: '2026-07-20' }), asset, today).ok).toBe(
			true
		);
	});

	it('過去の日付は登録できる（買う前の検討メモの後追い記録）', () => {
		expect(validateJournalEntryForm(input({ entryDate: '2020-01-01' }), asset, today).ok).toBe(
			true
		);
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateJournalEntryForm(
			{ assetId: '999', entryDate: '', body: '' },
			null,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual(['assetId', 'body', 'entryDate']);
		}
	});
});
