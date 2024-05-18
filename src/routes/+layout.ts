/** @type {import('./$types').PageLoad} */
export const load = async ({ parent, data }) => {
	await parent();
	const payload = { update: new Date() };
	return {
		layout: { ...data, ...payload }
	};
};
