import {
	validateAssetForm,
	type AssetFormErrors,
	type AssetFormInput,
	type ExistingAsset,
	type ValidatedAsset
} from './assets';
import {
	validateTransactionForm,
	type TransactionFormErrors,
	type TransactionFormInput,
	type TransactionTargetAccount,
	type ValidatedTransaction
} from './transactions';

// 「新しい資産を作りながら最初の取引を登録する」融合フォームの検証ロジック。
// 既存の validateAssetForm と validateTransactionForm を無改修で合成するだけの
// 純粋関数とし、取得・書き込み・$transaction は +page.server.ts 側で行う。

export type NewAssetTransactionValidation =
	| { ok: true; asset: ValidatedAsset; transaction: ValidatedTransaction }
	| { ok: false; assetErrors: AssetFormErrors; transactionErrors: TransactionFormErrors };

/**
 * 資産登録と取引登録の入力をまとめて検証する。
 * 資産側・取引側のエラーは両方集めて一括で返す（既存フォームの一括エラー原則）。
 *
 * 肝は 2 つの検証関数の橋渡し:
 * - validateTransactionForm は資産の type / currency を必要とするが、新規資産には
 *   まだ id がない。資産検証が通ったときだけ、その type / currency を持つ
 *   **仮 asset（id = 0）** を渡して取引側を形式検証する。id の数値は検証の判定には
 *   使われず（戻り値の assetId に入るだけ）、呼び出し側が作成後の実 id で上書きする。
 * - 新規フローに資産を選ぶ select はない（資産はこのフォームで作る）。そのため
 *   asset = null 由来の「資産を選択してください」は資産側エラーで表現済みとみなし、
 *   取引側エラーからは assetId を落とす。
 *
 * @param today 「今日」の UTC 深夜 0 時。未来日判定に使う（parseDateOnly 参照）
 */
export function validateNewAssetTransaction(
	assetInput: AssetFormInput,
	txInput: TransactionFormInput,
	account: TransactionTargetAccount | null,
	existingAssets: readonly ExistingAsset[],
	today: Date
): NewAssetTransactionValidation {
	const assetResult = validateAssetForm(assetInput, existingAssets);

	// 資産検証が通ったときだけ本物の type / currency で取引側を検証する。
	// 失敗時は asset = null で回し、種別・日付など通貨に依存しないエラーは拾う
	// （金額は通貨が決まらないと形式判定できないため、この往復では検証されない）。
	const asset = assetResult.ok
		? { id: 0, type: assetResult.value.type, currency: assetResult.value.currency }
		: null;

	const txResult = validateTransactionForm(txInput, account, asset, today);

	const transactionErrors: TransactionFormErrors = txResult.ok ? {} : { ...txResult.errors };
	// assetId フィールドは新規フローに存在しない。資産側エラーで表現済みなので捨てる。
	delete transactionErrors.assetId;

	if (assetResult.ok && txResult.ok) {
		return { ok: true, asset: assetResult.value, transaction: txResult.value };
	}
	return {
		ok: false,
		assetErrors: assetResult.ok ? {} : assetResult.errors,
		transactionErrors
	};
}
