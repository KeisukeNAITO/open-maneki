// フォーム入力の検証で複数のフォームが共有する部品。
// エラーは文言でなくコードで返し、項目名を含む文言は各フォーム側で組み立てる。

// Prisma の Int は 32bit 符号付き。超える値は保存時に落ちるため境界で弾く。
export const INT32_MAX = 2_147_483_647;

// FormData.get() は string | File | null。ファイルは想定外なので null に落とす。
export function formString(form: FormData, name: string): string | null {
	const value = form.get(name);
	return typeof value === 'string' ? value : null;
}

export type DateOnlyParse =
	{ ok: true; date: Date } | { ok: false; error: 'FORMAT' | 'NONEXISTENT' | 'FUTURE' };

/**
 * 日付のみの入力（input[type=date] の YYYY-MM-DD）を UTC 深夜 0 時の Date にする。
 * MarketPrice.date / Transaction.occurredAt の保存規約と同じ表現。
 *
 * @param today 「今日」の UTC 深夜 0 時。未来日判定に使う。呼び出し側でローカルの
 *   暦日から組み立てて渡す（関数を純粋に保ち、日付境界のテストを可能にするため）
 */
export function parseDateOnly(value: string | null, today: Date): DateOnlyParse {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return { ok: false, error: 'FORMAT' };
	}
	const candidate = new Date(`${value}T00:00:00Z`);
	// 2026-02-31 のような存在しない日付は Date が翌月に繰り上げてしまうため、
	// ISO 文字列に戻して入力と一致することを確認する
	if (Number.isNaN(candidate.getTime()) || candidate.toISOString().slice(0, 10) !== value) {
		return { ok: false, error: 'NONEXISTENT' };
	}
	if (candidate.getTime() > today.getTime()) {
		return { ok: false, error: 'FUTURE' };
	}
	return { ok: true, date: candidate };
}
