import { formatMoneyForInput, parseMoney } from '../format';
import { INT32_MAX, parseDateOnly } from './forms';
import { deriveCashBalance, derivePosition, type TransactionInput } from './holdings';
import { isTransactionType, type TransactionType } from './types';

// 取引登録フォームの検証ロジック。prices.ts と同じ構成で、
// DB 非依存の純粋関数とし、取得・書き込みは +page.server.ts 側で行う。
// 検証は 2 段階:
//   1. validateTransactionForm — 形式検証（全項目のエラーを一括で返す）
//   2. checkLedgerInvariants — 台帳のシミュレーション検証（導出関数を判定器として使う）

// フォームから来る生の値。FormData.get() は string | File | null を返すため、
// 文字列でないものは null に落としてから渡す。
export type TransactionFormInput = {
	accountId: string | null;
	assetId: string | null;
	type: string | null;
	occurredAt: string | null;
	quantity: string | null;
	amount: string | null;
	note: string | null;
};

// 検証に必要な列だけを持つ構造的部分型（Prisma の行をそのまま渡せる）。
export type TransactionTargetAccount = {
	id: number;
};

export type TransactionTargetAsset = {
	id: number;
	type: string;
	currency: string;
};

export type TransactionFormErrors = {
	accountId?: string;
	assetId?: string;
	type?: string;
	occurredAt?: string;
	quantity?: string;
	amount?: string;
	// checkLedgerInvariants のエラー。特定の項目でなく取引全体の矛盾なので独立させる
	ledger?: string;
};

// 検証済みの値。そのまま prisma.transaction.create の data に渡せる形。
export type ValidatedTransaction = {
	accountId: number;
	assetId: number;
	type: TransactionType;
	occurredAt: Date;
	quantity: number | null;
	amount: number;
	currency: string;
	note: string | null;
};

export type TransactionValidation =
	{ ok: true; value: ValidatedTransaction } | { ok: false; errors: TransactionFormErrors };

/**
 * 取引登録フォームの入力を検証する（形式検証）。
 * エラーは項目ごとに集めて一括で返す（1 件目で打ち切らない）。
 *
 * 口座・資産の存在確認は呼び出し側の責務: ID で引いた行を渡し、
 * 見つからなければ null を渡す。通貨はフォームから受け取らず、
 * 選択された資産の currency を採用する（不一致の入りようがない）。
 *
 * @param today 「今日」の UTC 深夜 0 時。未来日判定に使う（parseDateOnly 参照）
 */
export function validateTransactionForm(
	input: TransactionFormInput,
	account: TransactionTargetAccount | null,
	asset: TransactionTargetAsset | null,
	today: Date
): TransactionValidation {
	const errors: TransactionFormErrors = {};

	if (account === null) {
		errors.accountId = '口座を選択してください';
	}
	if (asset === null) {
		errors.assetId = '資産を選択してください';
	}

	let type: TransactionType | null = null;
	if (!input.type || !isTransactionType(input.type)) {
		errors.type = '取引種別を選択してください';
	} else {
		type = input.type;
	}

	// 資産種別と取引種別の整合: 入出金 ⇔ CASH、売買・配当 ⇔ 証券
	if (asset !== null && type !== null && !errors.assetId) {
		const isCashAsset = asset.type === 'CASH';
		const isCashType = type === 'DEPOSIT' || type === 'WITHDRAW';
		if (isCashAsset && !isCashType) {
			errors.assetId = '現金資産には入金・出金のみ登録できます';
		} else if (!isCashAsset && isCashType) {
			errors.assetId = '入金・出金には現金資産を選択してください';
		}
	}

	let occurredAt: Date | null = null;
	const parsedDate = parseDateOnly(input.occurredAt, today);
	if (parsedDate.ok) {
		occurredAt = parsedDate.date;
	} else {
		errors.occurredAt = {
			FORMAT: '発生日を YYYY-MM-DD 形式で入力してください',
			NONEXISTENT: '存在しない日付です',
			FUTURE: '未来の日付は登録できません'
		}[parsedDate.error];
	}

	// 数量: BUY / SELL のみ必須。それ以外の種別に入力されていたら、
	// 黙って捨てずに明示的に拒否する（「知らずに無視」を避ける）
	let quantity: number | null = null;
	const quantityRaw = (input.quantity ?? '').trim();
	if (type === 'BUY' || type === 'SELL') {
		const normalized = quantityRaw.replace(/,/g, '');
		if (!/^\d+$/.test(normalized) || Number(normalized) === 0) {
			errors.quantity = '数量は正の整数で入力してください';
		} else if (Number(normalized) > INT32_MAX) {
			errors.quantity = '数量が大きすぎます';
		} else {
			quantity = Number(normalized);
		}
	} else if (quantityRaw !== '') {
		errors.quantity = 'この取引種別に数量は入力できません';
	}

	let amount: number | null = null;
	if (!input.amount || input.amount.trim() === '') {
		errors.amount = '金額を入力してください';
	} else if (asset !== null) {
		// 資産が不明な間は通貨が決まらず形式検証できない（assetId 側のエラーで足りる）
		const parsedAmount = parseMoney(input.amount, asset.currency);
		if (parsedAmount === null) {
			errors.amount =
				asset.currency === 'JPY'
					? '金額は円の整数で入力してください'
					: '金額はドルで小数 2 桁までの数値で入力してください';
		} else if (parsedAmount === 0) {
			errors.amount = '金額は 0 より大きい値を入力してください';
		} else if (parsedAmount > INT32_MAX) {
			errors.amount = '金額が大きすぎます';
		} else {
			amount = parsedAmount;
		}
	}

	const trimmedNote = (input.note ?? '').trim();
	const note = trimmedNote === '' ? null : trimmedNote;

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}
	// エラーなしなら必須の値は確定しているはず。崩れていたら検証ロジックのバグなので fail fast
	if (
		account === null ||
		asset === null ||
		type === null ||
		occurredAt === null ||
		amount === null
	) {
		throw new Error('validateTransactionForm: passed validation but values are missing (bug)');
	}
	if ((type === 'BUY' || type === 'SELL') && quantity === null) {
		throw new Error('validateTransactionForm: quantity missing for BUY/SELL (bug)');
	}
	return {
		ok: true,
		value: {
			accountId: account.id,
			assetId: asset.id,
			type,
			occurredAt,
			quantity,
			amount,
			currency: asset.currency,
			note
		}
	};
}

/**
 * 台帳のシミュレーション検証の中核: ある口座 × 資産の取引集合をまるごと導出に
 * かけ、不変条件（売り越し・残高超）が崩れて例外が出たら**その理由（導出関数の
 * 英語メッセージ）**を返す。登録（既存＋候補）・削除（対象を除いた残り）・編集
 * （対象を差し替えた集合）のいずれも「検証したい最終状態の集合」をここに渡すことで、
 * 不変条件の実装を導出関数の 1 箇所に保ったまま使い回せる。
 * この検証を通さず不正な集合が台帳に残ると、次に資産一覧を開いた時点で
 * 導出が例外を投げ、画面全体が開けなくなる。
 *
 * 並び順は導出側の toSorted（安定ソート）に委ねる。同一日付は配列の並び順が
 * 保たれ、これは id 昇順の読み取り順と一致するため、検証時と表示時でズレない。
 *
 * 「登録できません / 削除できません」といった文脈語を含む文面は呼び出し側で
 * 組み立てる（同じ検証を登録・削除の両方から使うため）。
 *
 * @returns 違反があれば理由の文字列、なければ null
 */
export function simulateLedger(
	assetType: string,
	transactions: readonly TransactionInput[]
): string | null {
	try {
		if (assetType === 'CASH') {
			deriveCashBalance(transactions);
		} else {
			derivePosition(transactions);
		}
		return null;
	} catch (e) {
		// 導出関数のエラーメッセージ（英語）をそのまま返す。原因（数量・日時）が
		// 含まれており、検証側で言い換えると将来の導出ルール変更からズレるため
		return e instanceof Error ? e.message : String(e);
	}
}

/**
 * 登録時の台帳検証: 「既存の取引＋登録候補」を最終状態として simulateLedger に渡す。
 * 候補は配列の末尾に足す（同一日付の既存行の後に処理され、insert 後の読み取り順と一致）。
 *
 * @returns 矛盾があればエラーメッセージ、なければ null
 */
export function checkLedgerInvariants(
	assetType: string,
	existingTransactions: readonly TransactionInput[],
	candidate: TransactionInput
): string | null {
	const detail = simulateLedger(assetType, [...existingTransactions, candidate]);
	return detail === null ? null : `台帳の整合性が崩れるため登録できません（${detail}）`;
}

// 登録済みの配当のうち、対応する入金の提案に必要な列だけ。
export type DividendForDeposit = {
	accountId: number;
	currency: string;
	occurredAt: Date;
	amount: number;
};

// 現金資産の候補行（構造的部分型。Prisma の行をそのまま渡せる）。
export type CashAssetOption = {
	id: number;
	name: string;
	currency: string;
};

// 配当登録の成功時に画面へ渡す入金プリフィル。amount / occurredAt は
// そのまま取引フォームの input に入れられる文字列（parseDateOnly / parseMoney が読み戻せる）。
export type DepositSuggestion = {
	accountId: number;
	currency: string;
	occurredAt: string; // YYYY-MM-DD
	amount: string; // 額面のプリフィル。ユーザーが税引後の実額に直す
	cashAssets: { id: number; name: string }[]; // 同通貨の候補（空なら未登録の案内を出す）
};

/**
 * 配当登録の成功後、対応する入金（DEPOSIT）の提案データを組み立てる（DB 非依存）。
 * 単式簿記（ADR 0006）は維持したまま、連動を登録側の提案で補うための純粋関数。
 *
 * 入金先は「配当と同じ口座 × 同じ通貨の CASH 資産」。候補が複数なら画面で選ばせ、
 * ゼロなら（例: 米国株配当だがドルの現金資産が未作成）画面側で作成を案内する。
 * 金額は配当の額面をプリフィルする（源泉徴収後の実額はユーザーが直す）。
 */
export function buildDepositSuggestion(
	dividend: DividendForDeposit,
	cashAssets: readonly CashAssetOption[]
): DepositSuggestion {
	const sameCurrency = cashAssets.filter((a) => a.currency === dividend.currency);
	return {
		accountId: dividend.accountId,
		currency: dividend.currency,
		// occurredAt は UTC 深夜 0 時で保存されるため、日付部分の切り出しでズレない
		occurredAt: dividend.occurredAt.toISOString().slice(0, 10),
		amount: formatMoneyForInput(dividend.amount, dividend.currency),
		cashAssets: sameCurrency.map((a) => ({ id: a.id, name: a.name }))
	};
}
