import { describe, expect, it } from 'vitest';
import type { TransactionInput } from './holdings';
import {
	buildDepositSuggestion,
	checkLedgerInvariants,
	simulateLedger,
	validateTransactionForm,
	type CashAssetOption,
	type DividendForDeposit,
	type TransactionFormInput
} from './transactions';

// テストヘルパー: 本質（検証したい 1 項目）以外をデフォルト値で埋める
const account = { id: 1 };
const stockJp = { id: 10, type: 'STOCK_JP', currency: 'JPY' };
const stockUs = { id: 11, type: 'STOCK_US', currency: 'USD' };
const cashJpy = { id: 12, type: 'CASH', currency: 'JPY' };
const today = new Date('2026-07-15T00:00:00Z');

function input(overrides: Partial<TransactionFormInput> = {}): TransactionFormInput {
	return {
		accountId: '1',
		assetId: '10',
		type: 'BUY',
		occurredAt: '2026-07-14',
		quantity: '100',
		amount: '250000',
		note: null,
		...overrides
	};
}

describe('validateTransactionForm', () => {
	it('BUY の正常系: 通貨は資産から採用し、メモなしは null になる', () => {
		const result = validateTransactionForm(input(), account, stockJp, today);
		expect(result).toEqual({
			ok: true,
			value: {
				accountId: 1,
				assetId: 10,
				type: 'BUY',
				occurredAt: new Date('2026-07-14T00:00:00Z'),
				quantity: 100,
				amount: 250_000,
				currency: 'JPY',
				note: null
			}
		});
	});

	it('USD 資産の金額はドル小数 2 桁がセントになる', () => {
		const result = validateTransactionForm(
			input({ assetId: '11', amount: '1,899.50' }),
			account,
			stockUs,
			today
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.amount).toBe(189_950);
			expect(result.value.currency).toBe('USD');
		}
	});

	it('数量のカンマは無視し、メモは前後の空白を除いて保持する', () => {
		const result = validateTransactionForm(
			input({ quantity: '1,000', note: '  決算好調のため買い増し  ' }),
			account,
			stockJp,
			today
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.quantity).toBe(1000);
			expect(result.value.note).toBe('決算好調のため買い増し');
		}
	});

	it('DEPOSIT の正常系: CASH 資産・数量なし', () => {
		const result = validateTransactionForm(
			input({ assetId: '12', type: 'DEPOSIT', quantity: '' }),
			account,
			cashJpy,
			today
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.quantity).toBeNull();
		}
	});

	it('口座が見つからない（null）と accountId エラーになる', () => {
		const result = validateTransactionForm(input(), null, stockJp, today);
		expect(result).toMatchObject({ ok: false, errors: { accountId: '口座を選択してください' } });
	});

	it('資産が見つからない（null）と assetId エラーになる', () => {
		const result = validateTransactionForm(input(), account, null, today);
		expect(result).toMatchObject({ ok: false, errors: { assetId: '資産を選択してください' } });
	});

	it('取引種別が空・未知の値はエラーになる', () => {
		for (const type of [null, '', 'TRANSFER']) {
			const result = validateTransactionForm(input({ type }), account, stockJp, today);
			expect(result).toMatchObject({ ok: false, errors: { type: '取引種別を選択してください' } });
		}
	});

	it('CASH 資産に BUY は登録できない', () => {
		const result = validateTransactionForm(
			input({ assetId: '12', quantity: '100' }),
			account,
			cashJpy,
			today
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { assetId: '現金資産には入金・出金のみ登録できます' }
		});
	});

	it('証券資産に WITHDRAW は登録できない', () => {
		const result = validateTransactionForm(
			input({ type: 'WITHDRAW', quantity: '' }),
			account,
			stockJp,
			today
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { assetId: '入金・出金には現金資産を選択してください' }
		});
	});

	it('未来の発生日はエラーになる', () => {
		const result = validateTransactionForm(
			input({ occurredAt: '2026-07-16' }),
			account,
			stockJp,
			today
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { occurredAt: '未来の日付は登録できません' }
		});
	});

	it('存在しない発生日はエラーになる', () => {
		const result = validateTransactionForm(
			input({ occurredAt: '2026-02-31' }),
			account,
			stockJp,
			today
		);
		expect(result).toMatchObject({ ok: false, errors: { occurredAt: '存在しない日付です' } });
	});

	it('BUY で数量が空・非整数・0 はエラーになる', () => {
		for (const quantity of [null, '', '1.5', '0', 'abc']) {
			const result = validateTransactionForm(input({ quantity }), account, stockJp, today);
			expect(result).toMatchObject({
				ok: false,
				errors: { quantity: '数量は正の整数で入力してください' }
			});
		}
	});

	it('DIVIDEND に数量を入力すると明示的に拒否される', () => {
		const result = validateTransactionForm(
			input({ type: 'DIVIDEND', quantity: '100' }),
			account,
			stockJp,
			today
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { quantity: 'この取引種別に数量は入力できません' }
		});
	});

	it('金額が空・0・不正・Int 32bit 超はエラーになる', () => {
		const cases: [string | null, string][] = [
			[null, '金額を入力してください'],
			['', '金額を入力してください'],
			['0', '金額は 0 より大きい値を入力してください'],
			['12.5', '金額は円の整数で入力してください'],
			['2147483648', '金額が大きすぎます']
		];
		for (const [amount, message] of cases) {
			const result = validateTransactionForm(input({ amount }), account, stockJp, today);
			expect(result).toMatchObject({ ok: false, errors: { amount: message } });
		}
	});

	it('複数項目のエラーは一括で返す（1 件目で打ち切らない）', () => {
		const result = validateTransactionForm(
			{
				accountId: null,
				assetId: null,
				type: 'TRANSFER',
				occurredAt: '2026/07/14',
				quantity: null,
				amount: '',
				note: null
			},
			null,
			null,
			today
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(Object.keys(result.errors).sort()).toEqual([
				'accountId',
				'amount',
				'assetId',
				'occurredAt',
				'type'
			]);
		}
	});

	it('資産が不明な間は金額の形式検証をしない（通貨が決まらないため）', () => {
		const result = validateTransactionForm(input({ amount: 'abc' }), account, null, today);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.assetId).toBeDefined();
			expect(result.errors.amount).toBeUndefined();
		}
	});
});

describe('checkLedgerInvariants', () => {
	// テストヘルパー: 取引 1 行を短く書く
	function tx(
		type: string,
		occurredAt: string,
		quantity: number | null,
		amount: number
	): TransactionInput {
		return { type, occurredAt: new Date(`${occurredAt}T00:00:00Z`), quantity, amount };
	}

	it('保有の範囲内の SELL は登録できる', () => {
		const existing = [tx('BUY', '2026-07-01', 100, 250_000)];
		const candidate = tx('SELL', '2026-07-14', 100, 260_000);
		expect(checkLedgerInvariants('STOCK_JP', existing, candidate)).toBeNull();
	});

	it('保有を超える SELL は拒否される（売り越し）', () => {
		const existing = [tx('BUY', '2026-07-01', 100, 250_000)];
		const candidate = tx('SELL', '2026-07-14', 150, 390_000);
		const message = checkLedgerInvariants('STOCK_JP', existing, candidate);
		expect(message).toContain('台帳の整合性が崩れるため登録できません');
		expect(message).toContain('SELL quantity 150 exceeds current holding 100');
	});

	it('バックデートの SELL は「その時点の保有」で判定される', () => {
		// 現在の保有は 100 株だが、7/10 の BUY より前の日付で売ることはできない
		const existing = [tx('BUY', '2026-07-10', 100, 250_000)];
		const candidate = tx('SELL', '2026-06-20', 50, 130_000);
		const message = checkLedgerInvariants('STOCK_JP', existing, candidate);
		expect(message).toContain('SELL quantity 50 exceeds current holding 0');
	});

	it('同一日の取引は既存の行が先に処理される（登録順 = 表示時の導出と同じ並び）', () => {
		// 同じ日に BUY 100 → SELL 100 の順で登録するケース。候補が末尾に
		// 足されるため、安定ソートで BUY の後に処理され、全量売却として通る
		const existing = [tx('BUY', '2026-07-14', 100, 250_000)];
		const candidate = tx('SELL', '2026-07-14', 100, 255_000);
		expect(checkLedgerInvariants('STOCK_JP', existing, candidate)).toBeNull();
	});

	it('DIVIDEND はポジションに影響せず登録できる（保有ゼロでも可）', () => {
		expect(
			checkLedgerInvariants('STOCK_JP', [], tx('DIVIDEND', '2026-07-14', null, 5000))
		).toBeNull();
	});

	it('残高の範囲内の WITHDRAW は登録できる', () => {
		const existing = [tx('DEPOSIT', '2026-07-01', null, 100_000)];
		const candidate = tx('WITHDRAW', '2026-07-14', null, 30_000);
		expect(checkLedgerInvariants('CASH', existing, candidate)).toBeNull();
	});

	it('残高を超える WITHDRAW は拒否される', () => {
		const existing = [tx('DEPOSIT', '2026-07-01', null, 30_000)];
		const candidate = tx('WITHDRAW', '2026-07-14', null, 50_000);
		const message = checkLedgerInvariants('CASH', existing, candidate);
		expect(message).toContain('WITHDRAW amount 50000 exceeds current balance 30000');
	});

	it('バックデートの WITHDRAW は「その時点の残高」で判定される', () => {
		const existing = [tx('DEPOSIT', '2026-07-10', null, 100_000)];
		const candidate = tx('WITHDRAW', '2026-06-20', null, 50_000);
		const message = checkLedgerInvariants('CASH', existing, candidate);
		expect(message).toContain('WITHDRAW amount 50000 exceeds current balance 0');
	});

	it('CASH 資産に紛れ込んだ証券取引も導出のエラーとして検出される', () => {
		// フォーム検証をすり抜けるルートはないはずだが、判定器としては
		// 導出関数の fail fast がそのまま効くことを固定しておく
		const message = checkLedgerInvariants('CASH', [], tx('BUY', '2026-07-14', 100, 250_000));
		expect(message).toContain('not applicable to cash');
	});
});

describe('simulateLedger', () => {
	// テストヘルパー: 取引 1 行を短く書く
	function tx(
		type: string,
		occurredAt: string,
		quantity: number | null,
		amount: number
	): TransactionInput {
		return { type, occurredAt: new Date(`${occurredAt}T00:00:00Z`), quantity, amount };
	}

	it('整合した集合は null を返す（削除後の残りが健全なケース）', () => {
		// BUY 100 → SELL 40 が残る。BUY を消していないので売り越しにならない
		const remaining = [
			tx('BUY', '2026-07-01', 100, 250_000),
			tx('SELL', '2026-07-14', 40, 110_000)
		];
		expect(simulateLedger('STOCK_JP', remaining)).toBeNull();
	});

	it('空集合は null を返す（唯一の取引を削除するケース）', () => {
		expect(simulateLedger('STOCK_JP', [])).toBeNull();
		expect(simulateLedger('CASH', [])).toBeNull();
	});

	it('BUY を削除すると後続 SELL が売り越しになる集合は理由を返す', () => {
		// BUY を消した後に残るのは SELL 100 のみ → 保有 0 に対する売り越し
		const remaining = [tx('SELL', '2026-07-14', 100, 260_000)];
		const detail = simulateLedger('STOCK_JP', remaining);
		expect(detail).toContain('SELL quantity 100 exceeds current holding 0');
	});

	it('DEPOSIT を削除すると後続 WITHDRAW が残高を超える集合は理由を返す', () => {
		// DEPOSIT を消した後に残るのは WITHDRAW 50000 のみ → 残高 0 に対する超過
		const remaining = [tx('WITHDRAW', '2026-07-14', null, 50_000)];
		const detail = simulateLedger('CASH', remaining);
		expect(detail).toContain('WITHDRAW amount 50000 exceeds current balance 0');
	});

	it('返す文字列は文脈語（登録 / 削除）を含まない生の理由である', () => {
		// 文脈語の付与は呼び出し側の責務。ここでは導出の英語メッセージだけを返す
		const detail = simulateLedger('STOCK_JP', [tx('SELL', '2026-07-14', 100, 260_000)]);
		expect(detail).not.toContain('登録');
		expect(detail).not.toContain('削除');
	});
});

describe('buildDepositSuggestion', () => {
	const jpyDividend: DividendForDeposit = {
		accountId: 1,
		currency: 'JPY',
		occurredAt: new Date('2026-07-14T00:00:00Z'),
		amount: 5000
	};
	const usdDividend: DividendForDeposit = {
		accountId: 2,
		currency: 'USD',
		occurredAt: new Date('2026-07-14T00:00:00Z'),
		amount: 1234 // 12.34 ドル（税引前の額面）
	};
	const cashAssets: CashAssetOption[] = [
		{ id: 12, name: '円資産', currency: 'JPY' },
		{ id: 13, name: 'ドル資産', currency: 'USD' },
		{ id: 14, name: '外貨MMF', currency: 'USD' }
	];

	it('口座・発生日・額面をプリフィルし、同通貨の現金資産だけを候補に出す', () => {
		expect(buildDepositSuggestion(jpyDividend, cashAssets)).toEqual({
			accountId: 1,
			currency: 'JPY',
			occurredAt: '2026-07-14',
			amount: '5000',
			cashAssets: [{ id: 12, name: '円資産' }]
		});
	});

	it('USD 配当はセントをドル文字列にプリフィルし、USD の候補を複数返す', () => {
		expect(buildDepositSuggestion(usdDividend, cashAssets)).toEqual({
			accountId: 2,
			currency: 'USD',
			occurredAt: '2026-07-14',
			amount: '12.34',
			cashAssets: [
				{ id: 13, name: 'ドル資産' },
				{ id: 14, name: '外貨MMF' }
			]
		});
	});

	it('同通貨の現金資産が無ければ候補は空になる（画面側で作成を案内する）', () => {
		const onlyJpy: CashAssetOption[] = [{ id: 12, name: '円資産', currency: 'JPY' }];
		expect(buildDepositSuggestion(usdDividend, onlyJpy).cashAssets).toEqual([]);
	});
});
