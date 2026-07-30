import { parseDividendRate } from '../format';
import { INT32_MAX, parseDateOnly } from './forms';

// 配当予想フォームの検証ロジック。routes を薄く保つ方針（コード構成方針 2）に従い、
// 検証ルールはここに置く。validateMarketPriceForm と同様に DB 非依存の純粋関数とし、
// Asset の取得と DividendForecast の書き込みは +page.server.ts 側で行う。

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type DividendForecastFormInput = {
	assetId: string | null;
	exDate: string | null;
	amountPerShare: string | null;
};

// 検証に必要な列だけを持つ Asset の構造的部分型（Prisma の行をそのまま渡せる）。
export type ForecastTargetAsset = {
	id: number;
	type: string;
	currency: string;
};

export type DividendForecastErrors = {
	assetId?: string;
	exDate?: string;
	amountPerShare?: string;
};

export type ValidatedDividendForecast = {
	assetId: number;
	exDate: Date;
	amountPerShare: number; // 最小通貨単位 × 10000 のスケールレート
};

export type DividendForecastValidation =
	{ ok: true; value: ValidatedDividendForecast } | { ok: false; errors: DividendForecastErrors };

// 配当予想を登録できる資産種別。当面は株式のみ（投資信託の分配金は 1 万口あたりの
// 別基準のためスライス 1 では見送り。CASH は配当なし）。
const DIVIDEND_ASSET_TYPES = ['STOCK_JP', 'STOCK_US'];

/**
 * 配当予想フォームの入力を検証する。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 資産の存在確認は呼び出し側の責務: input.assetId で引いた Asset を渡し、
 * 見つからなければ null を渡す（この関数は input.assetId 自体を解釈しない）。
 * 権利確定日は未来日が正常なため上限を設けない（parseDateOnly に today を渡さない）。
 *
 * @param asset 選択された資産。存在しない ID なら null
 */
export function validateDividendForecastForm(
	input: DividendForecastFormInput,
	asset: ForecastTargetAsset | null
): DividendForecastValidation {
	const errors: DividendForecastErrors = {};

	if (asset === null) {
		errors.assetId = '資産を選択してください';
	} else if (!DIVIDEND_ASSET_TYPES.includes(asset.type)) {
		// 現金・投資信託には（当面）配当予想を登録できない
		errors.assetId = '配当予想を登録できるのは株式のみです';
	}

	let exDate: Date | null = null;
	const parsedDate = parseDateOnly(input.exDate);
	if (parsedDate.ok) {
		exDate = parsedDate.date;
	} else {
		errors.exDate = {
			FORMAT: '権利確定日を YYYY-MM-DD 形式で入力してください',
			NONEXISTENT: '存在しない日付です',
			// 上限を設けないため FUTURE は返らないが、型を満たすために文言を用意する
			FUTURE: '未来の日付は登録できません'
		}[parsedDate.error];
	}

	let amountPerShare: number | null = null;
	if (!input.amountPerShare || input.amountPerShare.trim() === '') {
		errors.amountPerShare = '1 株あたり配当を入力してください';
	} else if (asset !== null && DIVIDEND_ASSET_TYPES.includes(asset.type)) {
		// 資産が不明・対象外の間は通貨が決まらず形式検証できない（assetId 側のエラーで足りる）
		const parsed = parseDividendRate(input.amountPerShare, asset.currency);
		if (parsed === null) {
			errors.amountPerShare =
				asset.currency === 'JPY'
					? '1 株あたり配当は円で入力してください（小数可）'
					: '1 株あたり配当はドルで入力してください（小数可）';
		} else if (parsed === 0) {
			errors.amountPerShare = '1 株あたり配当は 0 より大きい値を入力してください';
		} else if (parsed > INT32_MAX) {
			errors.amountPerShare = '1 株あたり配当が大きすぎます';
		} else {
			amountPerShare = parsed;
		}
	}

	if (errors.assetId || errors.exDate || errors.amountPerShare) {
		return { ok: false, errors };
	}
	// エラーなしなら 3 つとも確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (asset === null || exDate === null || amountPerShare === null) {
		throw new Error('validateDividendForecastForm: passed validation but values are missing (bug)');
	}
	return { ok: true, value: { assetId: asset.id, exDate, amountPerShare } };
}
