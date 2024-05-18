/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const payload = {
		ver: process.env.npm_package_version
	};
	return payload;
}
