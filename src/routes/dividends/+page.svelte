<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDividendRate, formatMoney } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// exDate は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	// 経過割合（%）。progress 要素の value/max とは別に、数値ラベルとして表示する。
	function percent(elapsed: number, period: number): number {
		return Math.round((elapsed / period) * 100);
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

<h2>貯まっている配当（見込み）</h2>
<p class="note">
	前回〜次回の権利確定日の経過割合から、次回配当のうち「論理的に貯まっている」見込み額を按分表示します。前回権利日が未登録の銘柄は起点が定まらないため按分せず、予想額のみ表示します（源泉徴収前の額面）。
</p>
{#if data.accrual.rows.length === 0}
	<p>按分対象の保有株がありません。株式を保有し、次回の配当予想を登録すると表示されます。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>口座</th>
				<th>銘柄</th>
				<th class="num">保有</th>
				<th>期間（前回→次回）</th>
				<th>経過</th>
				<th class="num">貯まり中</th>
				<th class="num">次回予想</th>
			</tr>
		</thead>
		<tbody>
			{#each data.accrual.rows as row (`${row.accountId}:${row.assetId}`)}
				<tr>
					<td>{row.accountName}</td>
					<td>{row.assetName}{row.symbol ? `（${row.symbol}）` : ''}</td>
					<td class="num">{row.quantity.toLocaleString('en-US')}</td>
					<td>
						{#if row.prevExDate}
							{formatDate(row.prevExDate)} → {formatDate(row.nextExDate)}
						{:else}
							起点未登録 → {formatDate(row.nextExDate)}
						{/if}
					</td>
					<td>
						{#if row.elapsedDays !== null && row.periodDays !== null}
							<progress value={row.elapsedDays} max={row.periodDays}></progress>
							<small>{percent(row.elapsedDays, row.periodDays)}%</small>
						{:else}
							<small>—</small>
						{/if}
					</td>
					<td class="num">
						{#if row.accrued !== null}
							{formatMoney(row.accrued, row.currency)}
						{:else}
							—
						{/if}
					</td>
					<td class="num">{formatMoney(row.forecastTotal, row.currency)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			{#each data.accrual.totals as total (total.currency)}
				<tr>
					<th colspan="5">合計（{total.currency}）</th>
					<td class="num">
						{formatMoney(total.accrued, total.currency)}{total.hasUnstarted ? ' *' : ''}
					</td>
					<td></td>
				</tr>
			{/each}
		</tfoot>
	</table>
	{#if data.accrual.totals.some((t) => t.hasUnstarted)}
		<p class="note">* 起点未登録の銘柄は合計に含まれていません。</p>
	{/if}
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
	.note {
		color: #555;
		font-size: 0.9em;
	}
	.num {
		text-align: right;
	}
</style>
