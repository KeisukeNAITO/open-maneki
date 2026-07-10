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
				if (tx.quantity === null || !Number.isInteger(tx.quantity) || tx.quantity <= 0) {
					throw new Error(`BUY requires a positive integer quantity, got: ${tx.quantity}`);
				}
				quantity += tx.quantity;
				costBasis += tx.amount;
				break;
			}
			default:
				throw new Error(`Transaction type not yet supported: ${tx.type}`);
		}
	}

	return { quantity, costBasis };
}
