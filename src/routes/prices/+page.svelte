<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatMoney } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// MarketPrice.date は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	// 基準日の初期値はローカルの今日（input[type=date] の value は YYYY-MM-DD）
	function todayLocal(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${day}`;
	}
</script>

<h1>価格登録</h1>

{#if data.assets.length === 0}
	<p>価格を登録できる資産がありません。</p>
{:else}
	<form method="POST" use:enhance>
		<p>
			<label>
				資産
				<select name="assetId">
					<option value="">選択してください</option>
					{#each data.assets as asset (asset.id)}
						<option value={asset.id} selected={form?.values?.assetId === String(asset.id)}>
							{asset.name}{asset.symbol ? `（${asset.symbol}）` : ''} / {asset.currency}
						</option>
					{/each}
				</select>
			</label>
			{#if form?.errors?.assetId}<span class="error">{form.errors.assetId}</span>{/if}
		</p>
		<p>
			<label>
				基準日
				<input type="date" name="date" value={form?.values?.date ?? todayLocal()} />
			</label>
			{#if form?.errors?.date}<span class="error">{form.errors.date}</span>{/if}
		</p>
		<p>
			<label>
				価格
				<input type="text" name="price" inputmode="decimal" value={form?.values?.price ?? ''} />
			</label>
			<small>JPY は円の整数、USD はドルで小数 2 桁まで。投資信託は 1 万口あたりの基準価額</small>
			{#if form?.errors?.price}<span class="error">{form.errors.price}</span>{/if}
		</p>
		<p><button type="submit">登録</button></p>
		{#if form?.success}
			<p class="success">
				{form?.updated ? '同じ基準日の価格を上書きしました。' : '価格を登録しました。'}
			</p>
		{/if}
	</form>
{/if}

<h2>直近の登録価格</h2>
{#if data.recentPrices.length === 0}
	<p>登録された価格はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>銘柄</th>
				<th>基準日</th>
				<th>価格</th>
			</tr>
		</thead>
		<tbody>
			{#each data.recentPrices as row (row.id)}
				<tr>
					<td>{row.asset.name}</td>
					<td>{formatDate(row.date)}</td>
					<td>{formatMoney(row.price, row.asset.currency)}</td>
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
