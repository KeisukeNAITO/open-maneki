// 金額は最小通貨単位の Int で保持する（ADR 0003: JPY は円、USD はセント）。
// 表示用文字列への変換はここに集約する。lib/server の外に置くのは、
// クライアント側（Svelte コンポーネント）からも使うため。

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
