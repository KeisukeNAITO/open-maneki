<script lang="ts">
	import { formatMoney } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// MarketPrice.date は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}
</script>

<h1>資産一覧</h1>

<h2>保有資産</h2>
{#if data.holdings.length === 0}
	<p>保有資産はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>口座</th>
				<th>銘柄</th>
				<th>シンボル</th>
				<th>数量</th>
				<th>取得原価</th>
				<th>評価額</th>
				<th>価格基準日</th>
			</tr>
		</thead>
		<tbody>
			{#each data.holdings as row (`${row.accountId}:${row.assetId}`)}
				<tr>
					<td>{row.accountName}</td>
					<td>{row.assetName}</td>
					<td>{row.symbol ?? '—'}</td>
					<td>{row.quantity.toLocaleString('en-US')}</td>
					<td>{formatMoney(row.costBasis, row.currency)}</td>
					<td
						>{row.marketValue === null
							? '価格未登録'
							: formatMoney(row.marketValue, row.currency)}</td
					>
					<td>{row.priceDate === null ? '—' : formatDate(row.priceDate)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<h2>現金残高</h2>
{#if data.cash.length === 0}
	<p>現金残高はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>口座</th>
				<th>通貨</th>
				<th>残高</th>
			</tr>
		</thead>
		<tbody>
			{#each data.cash as row (`${row.accountId}:${row.assetId}`)}
				<tr>
					<td>{row.accountName}</td>
					<td>{row.currency}</td>
					<td>{formatMoney(row.balance, row.currency)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<h2>通貨別合計</h2>
{#if data.totals.length === 0}
	<p>集計対象がありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>通貨</th>
				<th>現金残高</th>
				<th>保有評価額</th>
				<th>合計</th>
			</tr>
		</thead>
		<tbody>
			{#each data.totals as total (total.currency)}
				<tr>
					<td>{total.currency}</td>
					<td>{formatMoney(total.cashBalance, total.currency)}</td>
					<td>
						{formatMoney(total.marketValue, total.currency)}{total.hasMissingPrice ? ' ※' : ''}
					</td>
					<td>{formatMoney(total.cashBalance + total.marketValue, total.currency)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.totals.some((t) => t.hasMissingPrice)}
		<p>※ 価格未登録の銘柄は評価額の合計に含まれていません。</p>
	{/if}
{/if}
