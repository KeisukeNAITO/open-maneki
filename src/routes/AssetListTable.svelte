<script lang="ts">
	export let data;
	import { time, calcProgressRate } from '$lib/util/timeUtil';

	let dividendView = true;
	function toggleDividendView() {
		dividendView = !dividendView;
	}

	let recordView = true;
	function toggleRecordView() {
		recordView = !recordView;
	}

	let progressView = true;
	function toggleProgressView() {
		progressView = !progressView;
	}
</script>

<div class="overflow-x-auto">
	<table class="table table-zebra table-md" role="grid" aria-label="資産一覧">
		<thead>
			<tr>
				<th>#</th>
				<th>市場</th>
				<th>銘柄コード</th>
				<th>銘柄名</th>
				<th>株数</th>
				<th>株価</th>
				<th onclick={toggleDividendView}>
					{#if dividendView == true}
						総配当金額
					{:else}
						配当金単価
					{/if}</th
				>
				<th onclick={toggleRecordView}>
					{#if recordView == true}
						直近配当落ち日
					{:else}
						直前配当落ち日
					{/if}
				</th>
				<th onclick={toggleProgressView}>
					{#if progressView == true}
						論理配当額
					{:else}
						進捗率(%)
					{/if}</th
				>
				<th>登録</th>
			</tr>
		</thead>
		<tbody>
			{#each data.assetList as asset}
				<tr>
					<td>{asset.stockId}</td>
					<td>{asset.market}</td>
					<td>{asset.code}</td>
					<td>{asset.name}</td>
					<td>{asset.share}</td>
					<td>{asset.price}</td>
					<td>
						{#if asset.amount !== undefined}
							{#if dividendView == true}
								{Math.floor(asset.amount * 100 * asset.share) / 100}
							{:else}
								{asset.amount}
							{/if}
						{:else}
							-
						{/if}
					</td>
					<td>
						{#if recordView == true}
							{asset.recordDate || '-'}
						{:else}
							{asset.previousRecordDate || '-'}
						{/if}
					</td>
					<td>
						{#if progressView == true}
							{#if !asset.recordDate || !asset.previousRecordDate}
								-
							{:else}
								{Math.floor(
									asset.amount *
										100 *
										asset.share *
										calcProgressRate($time, asset.recordDate, asset.previousRecordDate)
								) / 100}
							{/if}
						{:else if !asset.recordDate || !asset.previousRecordDate}
							-
						{:else}
							{Math.floor(
								calcProgressRate($time, asset.recordDate, asset.previousRecordDate) * 1000
							) / 10}
						{/if}</td
					>
					<td
						><a href="/trade?code={asset.code}">
							<button class="hover:btn-primary-focus btn btn-outline btn-primary btn-xs"
								>取引</button
							>
						</a><a href="/dividend?code={asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">配当</button>
						</a></td
					>
				</tr>
			{/each}
			<tr>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td
					><a href="/trade" class="hover:text-gray-400">
						<button class="btn btn-outline btn-secondary btn-xs">新規取引</button>
					</a></td
				>
			</tr>
		</tbody>
	</table>
</div>
