import { parseDateOnly } from './forms';

// ジャーナル登録フォームの検証ロジック。prices.ts と同じ構成で、
// DB 非依存の純粋関数とし、取得・書き込みは +page.server.ts 側で行う。

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type JournalEntryFormInput = {
	assetId: string | null;
	entryDate: string | null;
	body: string | null;
};

// 検証に必要な列だけを持つ構造的部分型（Prisma の行をそのまま渡せる）。
export type JournalTargetAsset = {
	id: number;
};

export type JournalEntryErrors = {
	assetId?: string;
	entryDate?: string;
	body?: string;
};

// 検証済みの値。そのまま prisma.journalEntry.create の data に渡せる形。
export type ValidatedJournalEntry = {
	assetId: number | null;
	entryDate: Date;
	body: string;
};

export type JournalEntryValidation =
	{ ok: true; value: ValidatedJournalEntry } | { ok: false; errors: JournalEntryErrors };

/**
 * ジャーナル登録フォームの入力を検証する。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 資産は任意: 選択なし（assetId が null または空文字）は正常系で、
 * 銘柄に紐づかない全般メモ（相場観など）として扱う。他フォームと違い、
 * ここだけは「資産なし」がエラーでない点に注意。
 *
 * 資産の存在確認は呼び出し側の責務: input.assetId で引いた Asset を渡し、
 * 見つからなければ null を渡す（この関数は input.assetId 自体を解釈しない）。
 *
 * @param asset 選択された資産。選択なし・存在しない ID のどちらも null
 * @param today 「今日」の UTC 深夜 0 時。未来日判定に使う（parseDateOnly 参照）
 */
export function validateJournalEntryForm(
	input: JournalEntryFormInput,
	asset: JournalTargetAsset | null,
	today: Date
): JournalEntryValidation {
	const errors: JournalEntryErrors = {};

	// 選択ありなのに資産が引けなかった場合だけエラー（選択なしと区別する）
	const wantsAsset = input.assetId !== null && input.assetId.trim() !== '';
	if (wantsAsset && asset === null) {
		errors.assetId = '選択された資産が見つかりません';
	}

	let entryDate: Date | null = null;
	const parsedDate = parseDateOnly(input.entryDate, today);
	if (parsedDate.ok) {
		entryDate = parsedDate.date;
	} else {
		errors.entryDate = {
			FORMAT: '記録日を YYYY-MM-DD 形式で入力してください',
			NONEXISTENT: '存在しない日付です',
			FUTURE: '未来の日付は登録できません'
		}[parsedDate.error];
	}

	const body = (input.body ?? '').trim();
	if (body === '') {
		errors.body = '本文を入力してください';
	}

	if (errors.assetId || errors.entryDate || errors.body) {
		return { ok: false, errors };
	}
	// エラーなしなら日付は確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (entryDate === null) {
		throw new Error('validateJournalEntryForm: passed validation but values are missing (bug)');
	}
	return { ok: true, value: { assetId: wantsAsset && asset ? asset.id : null, entryDate, body } };
}
