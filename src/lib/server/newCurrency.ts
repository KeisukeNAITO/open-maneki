import type { ValidatedAsset } from './assets';
import {
	validateTransactionForm,
	type CashAssetOption,
	type TransactionFormInput,
	type TransactionTargetAccount,
	type ValidatedTransaction
} from './transactions';
import { isCurrency, type Currency } from './types';

// 「新しい通貨の現金を持ち始める」導線の検証ロジック。資産一覧の現金テーブルから
// 開き、口座 × 通貨 × 金額で初回入金（DEPOSIT）を登録する。
//
// CASH 資産は通貨ごとにグローバル 1 つ（名前で重複判定）という現状モデルを踏まえ、
// 選択通貨の CASH 資産が
//   - 既にあれば **再利用**して DEPOSIT のみ作成（create: false）
//   - 無ければ **自動命名で作成**（`${currency} 現金`）＋ DEPOSIT（create: true）
// とする。資産作成の有無は検証段階で解決し、取得・書き込み・$transaction は
// +page.server.ts 側で行う（コード構成方針 2）。
//
// 既存の validateTransactionForm を CASH 資産（実体 or 仮）に対して呼び、
// 種別は DEPOSIT 固定・数量なしで合成する。資産を選ぶ select は無いので、
// 通貨は currency フィールドで検証し、取引側の assetId エラーは捨てる。

// フォームから来る生の値。種別は DEPOSIT 固定なのでフィールドを持たない。
export type NewCurrencyFormInput = {
	accountId: string | null;
	currency: string | null;
	occurredAt: string | null;
	amount: string | null;
	note: string | null;
};

export type NewCurrencyFormErrors = {
	accountId?: string;
	currency?: string;
	occurredAt?: string;
	amount?: string;
	// 台帳のシミュレーション検証エラー（取引全体の矛盾）
	ledger?: string;
	// 特定の項目に紐づかないエラー（自動名が別資産と衝突した等）
	general?: string;
};

export type NewCurrencyValidation =
	| { ok: true; create: false; transaction: ValidatedTransaction }
	| { ok: true; create: true; asset: ValidatedAsset; transaction: ValidatedTransaction }
	| { ok: false; errors: NewCurrencyFormErrors };

// 作成時の CASH 資産名（シード規約に合わせる: `JPY 現金` / `USD 現金`）。
export function cashAssetName(currency: Currency): string {
	return `${currency} 現金`;
}

/**
 * 新規通貨入金フォームの入力を検証する（形式検証＋作成/再利用の解決）。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * @param account          accountId で引いた口座行（無ければ null）。存在確認は呼び出し側
 * @param existingCashAssets 既存の CASH 資産（通貨で再利用先を解決する）
 * @param existingAssetNames 全資産の名前（作成時の自動名衝突ガードに使う）
 * @param today            「今日」の UTC 深夜 0 時。未来日判定に使う（parseDateOnly 参照）
 */
export function validateNewCurrencyDeposit(
	input: NewCurrencyFormInput,
	account: TransactionTargetAccount | null,
	existingCashAssets: readonly CashAssetOption[],
	existingAssetNames: readonly string[],
	today: Date
): NewCurrencyValidation {
	const errors: NewCurrencyFormErrors = {};

	let currency: Currency | null = null;
	if (!input.currency || !isCurrency(input.currency)) {
		errors.currency = '通貨を選択してください';
	} else {
		currency = input.currency;
	}

	// 通貨が決まったら、その通貨の CASH 資産があるか調べる（＝再利用先）。
	const existing =
		currency === null ? null : (existingCashAssets.find((a) => a.currency === currency) ?? null);

	// 取引検証に渡す資産。再利用なら実 id、作成なら仮 asset（id = 0）。
	// id の数値は形式検証の判定に使われず、戻り値の assetId に入るだけ。作成時は
	// 呼び出し側が作成後の実 id で上書きする（assetWithTransaction と同じ橋渡し）。
	const asset =
		currency === null ? null : { id: existing?.id ?? 0, type: 'CASH' as const, currency };

	// 作成パスでのみ、自動名が別資産と衝突しないか先に確認する（名前の DB unique
	// 制約は無いため〈PR #14 見送り〉、アプリ層で重複作成を防ぐ）。
	if (currency !== null && existing === null) {
		const autoName = cashAssetName(currency);
		if (existingAssetNames.includes(autoName)) {
			errors.general = `「${autoName}」は既に別の資産で使われているため作成できません`;
		}
	}

	const txInput: TransactionFormInput = {
		accountId: input.accountId,
		assetId: null, // 資産は通貨から解決するため使わない
		type: 'DEPOSIT',
		occurredAt: input.occurredAt,
		quantity: null,
		amount: input.amount,
		note: input.note
	};
	const txResult = validateTransactionForm(txInput, account, asset, today);
	if (!txResult.ok) {
		// 資産を選ぶ select は無い。通貨エラーで表現済みなので assetId は捨てる。
		// 種別・数量は固定値なのでエラーは出ない。
		if (txResult.errors.accountId) errors.accountId = txResult.errors.accountId;
		if (txResult.errors.occurredAt) errors.occurredAt = txResult.errors.occurredAt;
		if (txResult.errors.amount) errors.amount = txResult.errors.amount;
	}

	if (Object.keys(errors).length > 0 || !txResult.ok) {
		return { ok: false, errors };
	}

	// ここまで来れば currency は確定している（崩れていたら検証のバグ）
	if (currency === null) {
		throw new Error('validateNewCurrencyDeposit: passed validation but currency is missing (bug)');
	}

	if (existing !== null) {
		return { ok: true, create: false, transaction: txResult.value };
	}
	return {
		ok: true,
		create: true,
		asset: {
			name: cashAssetName(currency),
			type: 'CASH',
			symbol: null,
			currency,
			shareholderBenefit: null
		},
		transaction: txResult.value
	};
}
