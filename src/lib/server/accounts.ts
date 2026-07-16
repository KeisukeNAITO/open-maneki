import { isAccountType, type AccountType } from './types';

// 口座登録フォームの検証ロジック。prices.ts と同じ構成で、
// DB 非依存の純粋関数とし、取得・書き込みは +page.server.ts 側で行う。

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type AccountFormInput = {
	name: string | null;
	type: string | null;
};

// 重複判定に必要な列だけを持つ構造的部分型（Prisma の行をそのまま渡せる）。
export type ExistingAccount = {
	name: string;
	type: string;
};

export type AccountFormErrors = {
	name?: string;
	type?: string;
};

// 検証済みの値。そのまま prisma.account.create の data に渡せる形。
export type ValidatedAccount = {
	name: string;
	type: AccountType;
};

export type AccountValidation =
	{ ok: true; value: ValidatedAccount } | { ok: false; errors: AccountFormErrors };

/**
 * 口座登録フォームの入力を検証する。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 重複判定のため既存口座の一覧を受け取る（DB 取得は呼び出し側の責務）。
 * 重複は「名前＋種別」の組で判定する — 同じ金融機関に課税口座と NISA 口座を
 * 持つのは正当なので、名前だけの一致は拒否しない。
 */
export function validateAccountForm(
	input: AccountFormInput,
	existingAccounts: readonly ExistingAccount[]
): AccountValidation {
	const errors: AccountFormErrors = {};

	let type: AccountType | null = null;
	if (!input.type || !isAccountType(input.type)) {
		errors.type = '口座種別を選択してください';
	} else {
		type = input.type;
	}

	const name = (input.name ?? '').trim();
	if (name === '') {
		errors.name = '口座名を入力してください';
	} else if (type !== null && existingAccounts.some((a) => a.name === name && a.type === type)) {
		// 種別が不明な間は重複判定できない（type 側のエラーで足りる）
		errors.name = '同じ名前・種別の口座が既に登録されています';
	}

	if (errors.name || errors.type) {
		return { ok: false, errors };
	}
	// エラーなしなら type は確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (type === null) {
		throw new Error('validateAccountForm: passed validation but values are missing (bug)');
	}
	return { ok: true, value: { name, type } };
}
