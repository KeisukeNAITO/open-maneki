import { fail } from '@sveltejs/kit';
import { validateAssetForm, type AssetFormInput } from '$lib/server/assets';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証関数の呼び出しのみを行い、検証ルールは lib/server/assets.ts に置く。
export const load: PageServerLoad = async () => {
	const assets = await prisma.asset.findMany({
		select: {
			id: true,
			name: true,
			type: true,
			symbol: true,
			currency: true,
			shareholderBenefit: true
		},
		orderBy: { id: 'asc' }
	});
	return { assets };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: AssetFormInput = {
			name: formString(form, 'name'),
			type: formString(form, 'type'),
			symbol: formString(form, 'symbol'),
			currency: formString(form, 'currency'),
			shareholderBenefit: formString(form, 'shareholderBenefit')
		};

		// 重複判定用に既存資産を全件渡す（シングルユーザーの銘柄数なら全件でも軽い）
		const existing = await prisma.asset.findMany({ select: { name: true } });

		const result = validateAssetForm(input, existing);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		await prisma.asset.create({ data: result.value });
		return { success: true };
	}
};
