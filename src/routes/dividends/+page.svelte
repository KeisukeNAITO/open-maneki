<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDividendRate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// exDate は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}
</script>

<h1>配当予想登録</h1>

{#if data.assets.length === 0}
	<p>配当予想を登録できる株式がありません。先に資産を登録してください。</p>
{:else}
	<form method="POST" use:enhance>
		<p>
			<label>
				銘柄
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
				権利確定日
				<input type="date" name="exDate" value={form?.values?.exDate ?? ''} />
			</label>
			{#if form?.errors?.exDate}<span class="error">{form.errors.exDate}</span>{/if}
		</p>
		<p>
			<label>
				1 株あたり配当
				<input
					type="text"
					name="amountPerShare"
					inputmode="decimal"
					value={form?.values?.amountPerShare ?? ''}
				/>
			</label>
			<small>1 株あたりの配当額。JPY は円、USD はドルで入力（小数可）</small>
			{#if form?.errors?.amountPerShare}<span class="error">{form.errors.amountPerShare}</span>{/if}
		</p>
		<p><button type="submit">登録</button></p>
		{#if form?.success}
			<p class="success">
				{form?.updated ? '同じ権利確定日の予想を上書きしました。' : '配当予想を登録しました。'}
			</p>
		{/if}
	</form>
{/if}

<h2>直近の配当予想</h2>
{#if data.recentForecasts.length === 0}
	<p>登録された配当予想はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>銘柄</th>
				<th>権利確定日</th>
				<th>1 株あたり配当</th>
			</tr>
		</thead>
		<tbody>
			{#each data.recentForecasts as row (row.id)}
				<tr>
					<td>{row.asset.name}</td>
					<td>{formatDate(row.exDate)}</td>
					<td>{formatDividendRate(row.amountPerShare, row.asset.currency)} {row.asset.currency}</td>
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
