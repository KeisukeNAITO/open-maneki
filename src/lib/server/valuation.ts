import { isAssetType } from './types';

// 投資信託の基準価額は 1 万口あたりで公表される慣行に合わせる（PR #6）。
export const FUND_PRICE_UNIT = 10_000;

/**
 * 1 銘柄分の評価額を導出する。金額は最小通貨単位の Int（ADR 0003）。
 *
 * @param assetType 資産種別。CASH は評価額の概念がない（残高がそのまま価値）ためエラー
 * @param quantity 保有口数・株数（derivePosition の結果）
 * @param price 最新の終値・基準価額。投資信託は 1 万口あたり。未登録なら null
 * @returns 評価額。価格未登録で計算できない場合は null（保有ゼロなら価格不要で 0）
 */
export function deriveMarketValue(
	assetType: string,
	quantity: number,
	price: number | null
): number | null {
	if (!isAssetType(assetType)) {
		throw new Error(`Unknown asset type: ${assetType}`);
	}
	if (assetType === 'CASH') {
		throw new Error('CASH has no market valuation; use deriveCashBalance instead');
	}
	if (!Number.isInteger(quantity) || quantity < 0) {
		throw new Error(`quantity must be a non-negative integer, got: ${quantity}`);
	}
	if (price !== null && (!Number.isInteger(price) || price <= 0)) {
		throw new Error(`price must be a positive integer, got: ${price}`);
	}

	if (quantity === 0) {
		return 0;
	}
	if (price === null) {
		return null;
	}

	if (assetType === 'FUND') {
		// 口数 × 基準価額 ÷ 1 万口。丸めは四捨五入（移動平均の按分と同じ方針）。
		return Math.round((quantity * price) / FUND_PRICE_UNIT);
	}
	return quantity * price;
}
