import { describe, it, expect, beforeEach } from 'vitest';
import { validateTradeRegisterParam } from '../../../../src/routes/trade/tradeLogic';

describe('validateTradeRegisterParam', () => {
	const validFormData = new FormData();
	beforeEach(() => {
		validFormData.append('transaction', 'BUY');
		validFormData.append('market', 'TSE');
		validFormData.append('code', '1234');
		validFormData.append('name', 'テスト株式');
		validFormData.append('share', '100');
		validFormData.append('price', '1000');
		validFormData.append('date', '2024-02-01');
	});

	it('正常な入力値でtrueを返す', () => {
		expect(validateTradeRegisterParam(validFormData)).toBe(true);
	});

	it.each([
		['transaction', ''],
		['market', ''],
		['code', ''],
		['name', ''],
		['share', 'invalid'],
		['share', ''],
		['price', 'invalid'],
		['price', ''],
		['date', 'invalid'],
		['date', '']
	])('%sが不正な値"%s"の場合、falseを返す', (key, value) => {
		const invalidFormData = validFormData;
		invalidFormData.set(key, value);
		expect(validateTradeRegisterParam(invalidFormData)).toBe(false);
	});

	it('必須項目が欠落している場合、falseを返す', () => {
		const incompleteFormData = new FormData();
		expect(validateTradeRegisterParam(incompleteFormData)).toBe(false);
	});
});
