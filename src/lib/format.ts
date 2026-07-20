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
