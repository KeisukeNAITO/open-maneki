import { fail } from '@sveltejs/kit';
import { validateAccountForm, type AccountFormInput } from '$lib/server/accounts';
import { prisma } from '$lib/server/db';
import { formString } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

// routes は薄く保つ（コード構成方針 2）: ここでは取得・書き込みと
// 検証関数の呼び出しのみを行い、検証ルールは lib/server/accounts.ts に置く。
export const load: PageServerLoad = async () => {
	const accounts = await prisma.account.findMany({
		select: { id: true, name: true, type: true },
		orderBy: { id: 'asc' }
	});
	return { accounts };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const input: AccountFormInput = {
			name: formString(form, 'name'),
			type: formString(form, 'type')
		};

		// 重複判定用に既存口座を全件渡す（シングルユーザーの口座数なら全件でも軽い）
		const existing = await prisma.account.findMany({ select: { name: true, type: true } });

		const result = validateAccountForm(input, existing);
		if (!result.ok) {
			return fail(400, { errors: result.errors, values: input });
		}

		await prisma.account.create({ data: result.value });
		return { success: true };
	}
};
