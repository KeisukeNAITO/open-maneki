import { isAssetType, isCurrency, type AssetType, type Currency } from './types';

// 資産登録フォームの検証ロジック。accounts.ts と同じ構成で、
// DB 非依存の純粋関数とし、取得・書き込みは +page.server.ts 側で行う。

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type AssetFormInput = {
	name: string | null;
	type: string | null;
	symbol: string | null;
	currency: string | null;
	shareholderBenefit: string | null;
};

// 重複判定に必要な列だけを持つ構造的部分型（Prisma の行をそのまま渡せる）。
export type ExistingAsset = {
	name: string;
};

export type AssetFormErrors = {
	name?: string;
	type?: string;
	symbol?: string;
	currency?: string;
	shareholderBenefit?: string;
};

// 検証済みの値。そのまま prisma.asset.create の data に渡せる形。
export type ValidatedAsset = {
	name: string;
	type: AssetType;
	symbol: string | null;
	currency: Currency;
	shareholderBenefit: string | null;
};

export type AssetValidation =
	{ ok: true; value: ValidatedAsset } | { ok: false; errors: AssetFormErrors };

/**
 * 資産登録フォームの入力を検証する。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 重複判定のため既存資産の一覧を受け取る（DB 取得は呼び出し側の責務）。
 * 重複は名前だけで判定する — 口座と違い、同じ銘柄を種別違いで
 * 持ち直す正当なケースがない（口座をまたぐ保有は Transaction 側の世界）。
 *
 * 種別と他項目の整合ルール:
 * - 通貨は上場市場から決まる種別では強制（STOCK_JP → JPY / STOCK_US → USD）。
 *   取引フォームが「通貨は資産から採用」する前提を、資産の入口で守る
 * - symbol は CASH に拒否（schema の「現金は null」を検証で保証）、他は任意
 * - shareholderBenefit（株主優待メモ）は STOCK_JP のみ。他種別への入力は
 *   黙って捨てずに明示的に拒否する（取引フォームの quantity と同じ原則）
 */
export function validateAssetForm(
	input: AssetFormInput,
	existingAssets: readonly ExistingAsset[]
): AssetValidation {
	const errors: AssetFormErrors = {};

	let type: AssetType | null = null;
	if (!input.type || !isAssetType(input.type)) {
		errors.type = '資産種別を選択してください';
	} else {
		type = input.type;
	}

	const name = (input.name ?? '').trim();
	if (name === '') {
		errors.name = '資産名を入力してください';
	} else if (existingAssets.some((a) => a.name === name)) {
		errors.name = '同じ名前の資産が既に登録されています';
	}

	let currency: Currency | null = null;
	if (!input.currency || !isCurrency(input.currency)) {
		errors.currency = '通貨を選択してください';
	} else if (type === 'STOCK_JP' && input.currency !== 'JPY') {
		errors.currency = '日本株の通貨は JPY にしてください';
	} else if (type === 'STOCK_US' && input.currency !== 'USD') {
		errors.currency = '米国株の通貨は USD にしてください';
	} else {
		currency = input.currency;
	}

	const trimmedSymbol = (input.symbol ?? '').trim();
	if (type === 'CASH' && trimmedSymbol !== '') {
		errors.symbol = '現金に証券コードは登録できません';
	}
	const symbol = trimmedSymbol === '' ? null : trimmedSymbol;

	const trimmedBenefit = (input.shareholderBenefit ?? '').trim();
	if (type !== null && type !== 'STOCK_JP' && trimmedBenefit !== '') {
		// 種別が不明な間は判定しない（type 側のエラーで足りる）
		errors.shareholderBenefit = '株主優待メモは日本株のみ登録できます';
	}
	const shareholderBenefit = trimmedBenefit === '' ? null : trimmedBenefit;

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}
	// エラーなしなら必須の値は確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (type === null || currency === null) {
		throw new Error('validateAssetForm: passed validation but values are missing (bug)');
	}
	return { ok: true, value: { name, type, symbol, currency, shareholderBenefit } };
}
