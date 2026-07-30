// 金額は最小通貨単位の Int で保持する（ADR 0003: JPY は円、USD はセント）。
// 表示用文字列への変換はここに集約する。lib/server の外に置くのは、
// クライアント側（Svelte コンポーネント）からも使うため。

/**
 * 表示単位の入力文字列を最小通貨単位の Int にする（formatMoney の逆変換）。
 * JPY は円の整数、USD はドル（小数 2 桁まで）→ セント。桁区切りのカンマは無視する。
 * 形式が不正な入力はユーザー入力の検証用途として null を返す。
 * 対応していない通貨はプログラミングエラーなのでエラーにする（formatMoney と同じ）。
 */
export function parseMoney(input: string, currency: string): number | null {
	const normalized = input.trim().replace(/,/g, '');
	switch (currency) {
		case 'JPY': {
			if (!/^\d+$/.test(normalized)) return null;
			return Number(normalized);
		}
		case 'USD': {
			const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
			if (!match) return null;
			// 小数部は右を 0 埋めしてセント 2 桁に揃える（'3' → '30'、なし → '00'）。
			// 浮動小数点の乗算を避け、文字列のまま桁を確定してから整数化する。
			const cents = Number((match[2] ?? '').padEnd(2, '0'));
			return Number(match[1]) * 100 + cents;
		}
		default:
			throw new Error(`Unknown currency: ${currency}`);
	}
}

/**
 * 最小通貨単位の金額を、金額入力欄にそのまま入れられる素の数値文字列にする
 * （parseMoney で読み戻せる形）。formatMoney と違い通貨記号も桁区切りも付けない。
 * フォームのプリフィル用途。対応していない通貨は formatMoney と同じくエラーにする。
 */
export function formatMoneyForInput(amount: number, currency: string): string {
	switch (currency) {
		case 'JPY':
			return String(amount);
		case 'USD': {
			// 浮動小数点の除算を避け、整数のまま円・銭に分けて組み立てる
			const dollars = Math.trunc(amount / 100);
			const cents = amount % 100;
			return `${dollars}.${String(cents).padStart(2, '0')}`;
		}
		default:
			throw new Error(`Unknown currency: ${currency}`);
	}
}

// 1 株あたり配当（DividendForecast.amountPerShare）は最小通貨単位 × このスケールで
// 整数保持する。1 株あたり配当は最小通貨単位で小数になる（28.5 円/株・$0.245/株）ため、
// レートとして精度を保ちつつ Int で持つ。丸めは按分総額の算出時に 1 回だけ行う。
export const DIVIDEND_RATE_SCALE = 10_000;

// 通貨の「表示 1 単位あたりの最小通貨単位」。JPY は円がそのまま最小単位、USD はドル → セント。
function minorUnitsPerDisplayUnit(currency: string): number {
	switch (currency) {
		case 'JPY':
			return 1;
		case 'USD':
			return 100;
		default:
			throw new Error(`Unknown currency: ${currency}`);
	}
}

/**
 * 1 株あたり配当の入力文字列（表示単位＝円・ドル）をスケール整数レートにする。
 * 例: '28.5' 円/株 → 285000、'0.245' ドル/株 → 245000（= 24.5 セント × 10000）。
 * 桁区切りのカンマは無視する。表現できる精度を超える小数や不正な形式は null を返す。
 * 浮動小数点の乗算を避け、整数・文字列操作だけでスケールする。
 */
export function parseDividendRate(input: string, currency: string): number | null {
	const scale = minorUnitsPerDisplayUnit(currency) * DIVIDEND_RATE_SCALE;
	// scale は 10 の冪（JPY 10000・USD 1000000）。小数はこの桁数まで表現できる。
	const decimals = Math.log10(scale);
	const normalized = input.trim().replace(/,/g, '');
	const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
	if (!match) return null;
	const fraction = match[2] ?? '';
	if (fraction.length > decimals) return null; // 保持できる精度を超える
	return Number(match[1]) * scale + Number(fraction.padEnd(decimals, '0'));
}

/**
 * スケール整数レートの 1 株あたり配当を表示用文字列にする（parseDividendRate の逆）。
 * 末尾の余分な 0 は落とす（285000 → '28.5'、245000 → '0.245'、整数なら小数点なし）。
 */
export function formatDividendRate(rate: number, currency: string): string {
	const scale = minorUnitsPerDisplayUnit(currency) * DIVIDEND_RATE_SCALE;
	const decimals = Math.log10(scale);
	const whole = Math.trunc(rate / scale);
	const fraction = String(rate % scale)
		.padStart(decimals, '0')
		.replace(/0+$/, '');
	return fraction === '' ? String(whole) : `${whole}.${fraction}`;
}

/**
 * 最小通貨単位の金額を表示用文字列にする。
 * JPY は円のまま桁区切り、USD はセント → ドルに換算して小数 2 桁固定。
 * 対応していない通貨は、表示の黙った桁ズレを防ぐためエラーにする。
 */
export function formatMoney(amount: number, currency: string): string {
	switch (currency) {
		case 'JPY':
			return `¥${amount.toLocaleString('en-US')}`;
		case 'USD':
			return `$${(amount / 100).toLocaleString('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			})}`;
		default:
			throw new Error(`Unknown currency: ${currency}`);
	}
}
