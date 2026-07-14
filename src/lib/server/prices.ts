import { parseMoney } from '../format';
import { INT32_MAX, parseDateOnly } from './forms';

// 価格登録フォームの検証ロジック。routes を薄く保つ方針（コード構成方針 2）に従い、
// 検証ルールはここに置く。buildOverview と同様に DB 非依存の純粋関数とし、
// Asset の取得と MarketPrice の書き込みは +page.server.ts 側で行う。

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type MarketPriceFormInput = {
	assetId: string | null;
	date: string | null;
	price: string | null;
};

// 検証に必要な列だけを持つ Asset の構造的部分型（Prisma の行をそのまま渡せる）。
export type PriceTargetAsset = {
	id: number;
	type: string;
	currency: string;
};

export type MarketPriceErrors = {
	assetId?: string;
	date?: string;
	price?: string;
};

export type ValidatedMarketPrice = {
	assetId: number;
	date: Date;
	price: number;
};

export type MarketPriceValidation =
	{ ok: true; value: ValidatedMarketPrice } | { ok: false; errors: MarketPriceErrors };

/**
 * 価格登録フォームの入力を検証する。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 資産の存在確認は呼び出し側の責務: input.assetId で引いた Asset を渡し、
 * 見つからなければ null を渡す（この関数は input.assetId 自体を解釈しない）。
 *
 * @param asset 選択された資産。存在しない ID なら null
 * @param today 「今日」の UTC 深夜 0 時。未来日判定に使う。呼び出し側でローカルの
 *   暦日から組み立てて渡す（関数を純粋に保ち、日付境界のテストを可能にするため）
 */
export function validateMarketPriceForm(
	input: MarketPriceFormInput,
	asset: PriceTargetAsset | null,
	today: Date
): MarketPriceValidation {
	const errors: MarketPriceErrors = {};

	if (asset === null) {
		errors.assetId = '資産を選択してください';
	} else if (asset.type === 'CASH') {
		// 現金に市場価格はない（deriveMarketValue が CASH をエラーにする仕様と整合）
		errors.assetId = '現金資産に価格は登録できません';
	}

	let date: Date | null = null;
	const parsedDate = parseDateOnly(input.date, today);
	if (parsedDate.ok) {
		date = parsedDate.date;
	} else {
		errors.date = {
			FORMAT: '基準日を YYYY-MM-DD 形式で入力してください',
			NONEXISTENT: '存在しない日付です',
			FUTURE: '未来の日付は登録できません'
		}[parsedDate.error];
	}

	let price: number | null = null;
	if (!input.price || input.price.trim() === '') {
		errors.price = '価格を入力してください';
	} else if (asset !== null && asset.type !== 'CASH') {
		// 資産が不明な間は通貨が決まらず形式検証できない（assetId 側のエラーで足りる）
		const parsed = parseMoney(input.price, asset.currency);
		if (parsed === null) {
			errors.price =
				asset.currency === 'JPY'
					? '価格は円の整数で入力してください'
					: '価格はドルで小数 2 桁までの数値で入力してください';
		} else if (parsed === 0) {
			errors.price = '価格は 0 より大きい値を入力してください';
		} else if (parsed > INT32_MAX) {
			errors.price = '価格が大きすぎます';
		} else {
			price = parsed;
		}
	}

	if (errors.assetId || errors.date || errors.price) {
		return { ok: false, errors };
	}
	// エラーなしなら 3 つとも確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (asset === null || date === null || price === null) {
		throw new Error('validateMarketPriceForm: passed validation but values are missing (bug)');
	}
	return { ok: true, value: { assetId: asset.id, date, price } };
}
