<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// キーは src/lib/server/types.ts の ASSET_TYPES / CURRENCIES と一致させる
	// （lib/server はクライアントから import できないため表示用にここへ重複定義。
	// 未知の値はサーバ検証で弾かれるので、表示側は fallback で素通しする）
	const typeLabels: Record<string, string> = {
		CASH: '現金',
		STOCK_JP: '日本株',
		STOCK_US: '米国株',
		FUND: '投資信託'
	};
	const currencies = ['JPY', 'USD'];
</script>

<h1>資産登録</h1>

<form method="POST" use:enhance>
	<p>
		<label>
			資産名
			<input type="text" name="name" value={form?.values?.name ?? ''} />
		</label>
		<small>例: トヨタ自動車、eMAXIS Slim 全世界株式、JPY 現金</small>
		{#if form?.errors?.name}<span class="error">{form.errors.name}</span>{/if}
	</p>
	<p>
		<label>
			資産種別
			<select name="type">
				<option value="">選択してください</option>
				{#each Object.entries(typeLabels) as [value, label] (value)}
					<option {value} selected={form?.values?.type === value}>{label}</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.type}<span class="error">{form.errors.type}</span>{/if}
	</p>
	<p>
		<label>
			証券コード・ティッカー
			<input type="text" name="symbol" value={form?.values?.symbol ?? ''} />
		</label>
		<small>例: 7203、AAPL。任意（現金には入力しない）</small>
		{#if form?.errors?.symbol}<span class="error">{form.errors.symbol}</span>{/if}
	</p>
	<p>
		<label>
			通貨
			<select name="currency">
				<option value="">選択してください</option>
				{#each currencies as currency (currency)}
					<option value={currency} selected={form?.values?.currency === currency}>
						{currency}
					</option>
				{/each}
			</select>
		</label>
		<small>日本株は JPY、米国株は USD</small>
		{#if form?.errors?.currency}<span class="error">{form.errors.currency}</span>{/if}
	</p>
	<p>
		<label>
			株主優待メモ
			<input type="text" name="shareholderBenefit" value={form?.values?.shareholderBenefit ?? ''} />
		</label>
		<small>日本株のみ（任意）</small>
		{#if form?.errors?.shareholderBenefit}<span class="error">{form.errors.shareholderBenefit}</span
			>{/if}
	</p>
	<p><button type="submit">登録</button></p>
	{#if form?.success}<p class="success">資産を登録しました。</p>{/if}
</form>

<h2>登録済みの資産</h2>
{#if data.assets.length === 0}
	<p>登録された資産はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>資産名</th>
				<th>種別</th>
				<th>コード</th>
				<th>通貨</th>
				<th>株主優待メモ</th>
			</tr>
		</thead>
		<tbody>
			{#each data.assets as row (row.id)}
				<tr>
					<td>{row.name}</td>
					<td>{typeLabels[row.type] ?? row.type}</td>
					<td>{row.symbol ?? ''}</td>
					<td>{row.currency}</td>
					<td>{row.shareholderBenefit ?? ''}</td>
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
