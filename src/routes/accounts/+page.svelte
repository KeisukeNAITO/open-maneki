<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// キーは src/lib/server/types.ts の ACCOUNT_TYPES と一致させる
	// （lib/server はクライアントから import できないため表示用にここへ重複定義。
	// 未知の値はサーバ検証で弾かれるので、表示側は fallback で素通しする）
	const typeLabels: Record<string, string> = {
		TAXABLE: '課税口座',
		NISA: 'NISA 口座',
		DC: '確定拠出年金'
	};
</script>

<h1>口座登録</h1>

<form method="POST" use:enhance>
	<p>
		<label>
			口座名
			<input type="text" name="name" value={form?.values?.name ?? ''} />
		</label>
		<small>例: 楽天証券、○○銀行</small>
		{#if form?.errors?.name}<span class="error">{form.errors.name}</span>{/if}
	</p>
	<p>
		<label>
			口座種別
			<select name="type">
				<option value="">選択してください</option>
				{#each Object.entries(typeLabels) as [value, label] (value)}
					<option {value} selected={form?.values?.type === value}>{label}</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.type}<span class="error">{form.errors.type}</span>{/if}
	</p>
	<p><button type="submit">登録</button></p>
	{#if form?.success}<p class="success">口座を登録しました。</p>{/if}
</form>

<h2>登録済みの口座</h2>
{#if data.accounts.length === 0}
	<p>登録された口座はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>口座名</th>
				<th>種別</th>
			</tr>
		</thead>
		<tbody>
			{#each data.accounts as row (row.id)}
				<tr>
					<td>{row.name}</td>
					<td>{typeLabels[row.type] ?? row.type}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.success {
		color: #1b5e20;
	}
</style>
