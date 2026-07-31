import { derivePosition } from './holdings';
import { DIVIDEND_RATE_SCALE } from '../format';
import { CURRENCIES } from './types';

// 「論理的に貯まっている配当」の按分ロジック。routes を薄く保つ方針（コード構成方針 2）に
// 従い、口座 × 資産のグループ化・保有導出・按分計算はここで行う。buildOverview と同じく
// DB 非依存の純粋関数で、+page.server.ts が Prisma で取得した行をそのまま渡す。
//
// 考え方: 株式の配当は権利確定日ごとに発生する。前回権利日から次回権利日までの経過割合で
// 次回配当が「論理的に貯まっている」とみなし、その割合ぶんを表示する。前回権利日が未登録なら
// 起点が定まらないため按分せず、次回予想額だけを見せる（過去日の登録を許容したのはこのため）。

const MS_PER_DAY = 86_400_000;

// 集約に必要な列だけを持つ入力型。Prisma の include 付き Transaction 行を
// そのまま渡せる構造的部分型（buildOverview の OverviewTransaction と同じ形）。
export type AccrualTransaction = {
	accountId: number;
	assetId: number;
	type: string;
	occurredAt: Date;
	quantity: number | null;
	amount: number;
	account: { name: string };
	asset: { name: string; symbol: string | null; currency: string };
};

// 配当予想行の必要列。amountPerShare は最小通貨単位 × DIVIDEND_RATE_SCALE のスケールレート。
export type ForecastInput = {
	assetId: number;
	exDate: Date;
	amountPerShare: number;
};

// 口座 × 資産の按分 1 行。金額は最小通貨単位の Int。
export type AccrualRow = {
	accountId: number;
	accountName: string;
	assetId: number;
	assetName: string;
	symbol: string | null;
	currency: string;
	quantity: number;
	amountPerShare: number; // 次回配当の 1 株あたりスケールレート
	nextExDate: Date;
	forecastTotal: number; // 次回配当の見込み総額（rate × quantity を最小通貨単位に丸め）
	// 以下は前回権利日が登録されている場合のみ（起点未登録なら null）
	prevExDate: Date | null;
	elapsedDays: number | null;
	periodDays: number | null;
	accrued: number | null; // 貯まっている見込み額（最小通貨単位・按分後に 1 回丸め）
};

// 通貨別の按分合計。円換算はしない方針のため通貨ごとに独立して集計する。
export type AccrualCurrencyTotal = {
	currency: string;
	accrued: number; // 起点が登録済みの行のみの合計
	hasUnstarted: boolean; // 起点未登録で合計に含められなかった行があるか
};

export type AccrualView = {
	rows: AccrualRow[];
	totals: AccrualCurrencyTotal[];
};

// スケールレート × 数量を最小通貨単位に丸める（四捨五入・1 回だけ）。
// rate は最大 INT32 まで許容されるため、数量・日数を掛けると 2^53 を超えうる。
// 浮動小数点の精度落ちを避けるため BigInt で計算し、最後に Number に戻す。
function roundScaledDivision(numerator: bigint, denominator: bigint): number {
	// 正の値のみ。round half up = floor((2n + d) / 2d)
	return Number((2n * numerator + denominator) / (2n * denominator));
}

/**
 * 全取引と配当予想から、口座 × 資産ごとの「貯まっている配当」を組み立てる。
 *
 * - 集計単位は口座 × 資産（同じ銘柄でも課税口座と NISA は別の行になる）
 * - 配当予想のない資産・保有ゼロ（全量売却済み）・次回予想のない資産は行にしない
 * - next = today 以降で最も早い権利日、prev = その直前の権利日（today より前）
 * - 按分額 = amountPerShare × quantity × (経過日数 / 期間日数)、丸めは 1 回だけ
 * - prev が無ければ按分せず forecastTotal のみ（accrued は null）
 *
 * @param today 基準日（日付のみ・UTC 深夜 0 時。呼び出し側が注入してテスト可能に保つ）
 */
export function buildAccruedDividend(
	transactions: readonly AccrualTransaction[],
	forecasts: readonly ForecastInput[],
	today: Date
): AccrualView {
	// 資産ごとに予想を権利日の昇順で並べる
	const byAsset = new Map<number, ForecastInput[]>();
	for (const forecast of forecasts) {
		const list = byAsset.get(forecast.assetId);
		if (list) {
			list.push(forecast);
		} else {
			byAsset.set(forecast.assetId, [forecast]);
		}
	}
	for (const list of byAsset.values()) {
		list.sort((a, b) => a.exDate.getTime() - b.exDate.getTime());
	}

	// 口座 × 資産でグループ化（derivePosition の単位。buildOverview と同じ）
	const groups = new Map<string, AccrualTransaction[]>();
	for (const tx of transactions) {
		const key = `${tx.accountId}:${tx.assetId}`;
		const group = groups.get(key);
		if (group) {
			group.push(tx);
		} else {
			groups.set(key, [tx]);
		}
	}

	const t = today.getTime();
	const rows: AccrualRow[] = [];

	for (const group of groups.values()) {
		const first = group[0];
		if (!first) continue;
		const { accountId, assetId, account, asset } = first;

		// 配当予想のない資産（現金・投資信託を含む）は対象外。derivePosition より先に
		// 判定することで、CASH グループ（DEPOSIT/WITHDRAW）を導出に渡さない。
		const list = byAsset.get(assetId);
		if (!list || list.length === 0) continue;

		const position = derivePosition(group);
		if (position.quantity === 0) continue; // 全量売却済みは対象外

		// next = today 以降で最も早い権利日。無ければ貯まりつつある配当がないので対象外。
		const nextIdx = list.findIndex((forecast) => forecast.exDate.getTime() >= t);
		if (nextIdx === -1) continue;
		const next = list[nextIdx];
		if (!next) continue; // findIndex が見つけたので存在するが、型を絞るためのガード
		// prev = next の直前の権利日（= today より前で最も遅い権利日）。無ければ起点未登録。
		const prev = nextIdx > 0 ? list[nextIdx - 1] : undefined;

		const quantity = position.quantity;
		const forecastTotal = roundScaledDivision(
			BigInt(next.amountPerShare) * BigInt(quantity),
			BigInt(DIVIDEND_RATE_SCALE)
		);

		let prevExDate: Date | null = null;
		let elapsedDays: number | null = null;
		let periodDays: number | null = null;
		let accrued: number | null = null;
		if (prev) {
			prevExDate = prev.exDate;
			elapsedDays = (t - prev.exDate.getTime()) / MS_PER_DAY;
			periodDays = (next.exDate.getTime() - prev.exDate.getTime()) / MS_PER_DAY;
			accrued = roundScaledDivision(
				BigInt(next.amountPerShare) * BigInt(quantity) * BigInt(elapsedDays),
				BigInt(DIVIDEND_RATE_SCALE) * BigInt(periodDays)
			);
		}

		rows.push({
			accountId,
			accountName: account.name,
			assetId,
			assetName: asset.name,
			symbol: asset.symbol,
			currency: asset.currency,
			quantity,
			amountPerShare: next.amountPerShare,
			nextExDate: next.exDate,
			forecastTotal,
			prevExDate,
			elapsedDays,
			periodDays,
			accrued
		});
	}

	// 表示順は口座 → 資産の登録順（buildOverview と同じ）
	rows.sort((a, b) => a.accountId - b.accountId || a.assetId - b.assetId);

	const totalsByCurrency = new Map<string, AccrualCurrencyTotal>();
	for (const row of rows) {
		let total = totalsByCurrency.get(row.currency);
		if (!total) {
			total = { currency: row.currency, accrued: 0, hasUnstarted: false };
			totalsByCurrency.set(row.currency, total);
		}
		if (row.accrued === null) {
			total.hasUnstarted = true;
		} else {
			total.accrued += row.accrued;
		}
	}

	const currencyOrder = (currency: string): number => {
		const index = (CURRENCIES as readonly string[]).indexOf(currency);
		return index === -1 ? CURRENCIES.length : index;
	};
	const totals = [...totalsByCurrency.values()].sort(
		(a, b) => currencyOrder(a.currency) - currencyOrder(b.currency)
	);

	return { rows, totals };
}
