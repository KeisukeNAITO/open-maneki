import _ from 'lodash';
const { sortBy } = _;

/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();

	if (data.tradeLogs.length === 1 && _.isEmpty(data.tradeLogs[0])) {
		data.tradeLogs = [];
	} else {
		data.tradeLogs = sortBy(data.tradeLogs, 'tradeAt');
	}

	return data;
};
