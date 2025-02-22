import _ from 'lodash';

/**
 * 売買情報の登録フォームのバリデーター
 * @param data
 * @returns
 */
export const validateTradeRegisterParam = (data: FormData): boolean => {
	const validators = {
		transaction: (v: FormDataEntryValue | null) => _.isString(v) && !_.isEmpty(v),
		market: (v: FormDataEntryValue | null) => _.isString(v) && !_.isEmpty(v),
		code: (v: FormDataEntryValue | null) => _.isString(v) && !_.isEmpty(v),
		name: (v: FormDataEntryValue | null) => _.isString(v) && !_.isEmpty(v),
		share: (v: FormDataEntryValue | null) => !_.isEmpty(v) && _.isNumber(Number(v)),
		price: (v: FormDataEntryValue | null) => !_.isEmpty(v) && _.isNumber(Number(v)),
		date: (v: FormDataEntryValue | null) => !_.isEmpty(v) && _.isDate(new Date(v?.toString() || ''))
	};

	return Object.entries(validators).every(([key, validate]) => validate(data.get(key)));
};
