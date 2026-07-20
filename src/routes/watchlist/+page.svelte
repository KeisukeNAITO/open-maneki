<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatMoney } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	// ジャーナル本文が長い場合はウォッチリストでは先頭 80 文字だけ見せる
	const EXCERPT_LENGTH = 80;
	function excerpt(body: string): string {
		return body.length <= EXCERPT_LENGTH ? body : body.slice(0, EXCERPT_LENGTH) + '…';
	}
</script>

<h1>ウォッチリスト</h1>

<p>
	登録済みだがまだ保有していない銘柄の一覧です。 取引を登録すると自動的にここから消え、<a
		href={resolve('/')}>資産一覧</a
	>に現れます。
</p>

{#if data.rows.length === 0}
	<p>
		ウォッチ中の銘柄はありません。
		<a href={resolve('/assets')}>資産登録</a
		>で銘柄を登録してから取引を登録しない状態にしておくと表示されます。
	</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>銘柄</th>
				<th>最新価格</th>
				<th>最新ジャーナル</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row (row.assetId)}
				<tr>
					<td>
						{row.assetName}{row.symbol ? `（${row.symbol}）` : ''}
						<span class="currency">/ {row.currency}</span>
					</td>
					<td>
						{#if row.price !== null && row.priceDate !== null}
							{formatMoney(row.price, row.currency)}
							<span class="date">（{formatDate(row.priceDate)}）</span>
						{:else}
							<span class="missing">価格未登録</span>
						{/if}
					</td>
					<td>
						{#if row.latestEntry !== null}
							<span class="entry-date">{formatDate(row.latestEntry.entryDate)}</span>
							{excerpt(row.latestEntry.body)}
						{:else}
							<span class="missing">—</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.currency {
		color: #666;
		font-size: 0.9em;
	}
	.date {
		color: #666;
		font-size: 0.9em;
	}
	.entry-date {
		color: #666;
		font-size: 0.9em;
		margin-right: 0.4em;
	}
	.missing {
		color: #999;
	}
</style>
