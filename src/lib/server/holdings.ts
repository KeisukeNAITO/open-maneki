import { isTransactionType } from './types';

// 導出に必要な列だけを持つ入力型。構造的部分型なので Prisma の
// Transaction 行をそのまま渡せるが、この関数自体は DB に依存しない。
export type TransactionInput = {
	type: string;
	occurredAt: Date;
	quantity: number | null;
	amount: number;
};

// 1 銘柄 × 1 口座の保有状況。金額は最小通貨単位の Int。
export type Position = {
	quantity: number;
	costBasis: number; // 取得原価の合計（平均取得単価 = costBasis / quantity）
};

// 数量・金額に共通の検証。アサーション関数なので、呼び出し後は
// value が number（null でない）に絞り込まれる。
function assertPositiveInteger(value: number | null, context: string): asserts value is number {
	if (value === null || !Number.isInteger(value) || value <= 0) {
		throw new Error(`${context} must be a positive integer, got: ${value}`);
	}
}

/**
 * 1 銘柄 × 1 口座分の取引履歴から保有状況を導出する（移動平均法）。
 * 入力の順序に依存しないよう、発生日時の昇順で処理する。
 */
export function derivePosition(transactions: readonly TransactionInput[]): Position {
	const ordered = transactions.toSorted((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

	let quantity = 0;
	let costBasis = 0;

	for (const tx of ordered) {
		if (!isTransactionType(tx.type)) {
			throw new Error(`Unknown transaction type: ${tx.type}`);
		}
		switch (tx.type) {
			case 'BUY': {
				assertPositiveInteger(tx.quantity, 'BUY quantity');
				quantity += tx.quantity;
				costBasis += tx.amount;
				break;
			}
			case 'SELL': {
				assertPositiveInteger(tx.quantity, 'SELL quantity');
				if (tx.quantity > quantity) {
					throw new Error(
						`SELL quantity ${tx.quantity} exceeds current holding ${quantity} at ${tx.occurredAt.toISOString()}`
					);
				}
				// 移動平均法: 取得原価を売却口数の比率で取り崩す。
				// 平均単価を先に丸めず総額から按分することで、全量売却時に
				// 取得原価が誤差なくちょうどゼロになる。
				const costOut = Math.round((costBasis * tx.quantity) / quantity);
				quantity -= tx.quantity;
				costBasis -= costOut;
				break;
			}
			case 'DIVIDEND':
				// 配当は口数・取得原価に影響しない（実績記録として台帳に残るのみ）。
				// 現金残高への反映は複式簿記的連動を見送ったため行わない（PR #6）。
				break;
			default:
				// DEPOSIT / WITHDRAW は CASH 資産の取引。証券ポジションに
				// 紛れ込んでいたら呼び出し側の振り分けバグなので即エラー。
				throw new Error(`Transaction type not applicable to a security position: ${tx.type}`);
		}
	}

	return { quantity, costBasis };
}

/**
 * 現金（CASH 資産）の取引履歴から残高を導出する。
 * BUY / SELL との複式簿記的連動は行わない（PR #6 で見送り）ため、
 * 残高は DEPOSIT / WITHDRAW の積み上げのみで決まる。
 */
export function deriveCashBalance(transactions: readonly TransactionInput[]): number {
	const ordered = transactions.toSorted((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

	let balance = 0;

	for (const tx of ordered) {
		if (!isTransactionType(tx.type)) {
			throw new Error(`Unknown transaction type: ${tx.type}`);
		}
		switch (tx.type) {
			case 'DEPOSIT':
				assertPositiveInteger(tx.amount, 'DEPOSIT amount');
				balance += tx.amount;
				break;
			case 'WITHDRAW':
				assertPositiveInteger(tx.amount, 'WITHDRAW amount');
				if (tx.amount > balance) {
					throw new Error(
						`WITHDRAW amount ${tx.amount} exceeds current balance ${balance} at ${tx.occurredAt.toISOString()}`
					);
				}
				balance -= tx.amount;
				break;
			default:
				throw new Error(`Transaction type not applicable to cash: ${tx.type}`);
		}
	}

	return balance;
}
