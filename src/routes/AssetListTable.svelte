<script lang="ts">
	export let data;
	import { time, calcProgressRate } from '$lib/util/timeUtil';

	const TOTAL_AMOUNT = 0; // 総配当金額
	const AMOUNT = 1; // 配当金単価
	const THEORETICAL_AMOUNT = 2; // 論理配当金額
	let dividendView = TOTAL_AMOUNT;
	function rotateDividendView() {
		dividendView = (dividendView + 1) % 3;
	}

	const NEXT_DATE = 0; // 直近配当落ち日
	const PREVIOUS_DATE = 1; // 直前配当落ち日
	const PROGRESS_RATE = 2; // 進捗率
	let recordView = NEXT_DATE;
	function rotateRecordView() {
		recordView = (recordView + 1) % 3;
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
				<th onclick={rotateDividendView}>
					{#if dividendView == TOTAL_AMOUNT}
						総配当金額
					{:else if dividendView == AMOUNT}
						配当金単価(利回り)
					{:else if dividendView == THEORETICAL_AMOUNT}
						論理配当金額
					{/if}</th
				>
				<th onclick={rotateRecordView}>
					{#if recordView == NEXT_DATE}
						直近配当落ち日
					{:else if recordView == PREVIOUS_DATE}
						直前配当落ち日
					{:else}
						進捗率(%)
					{/if}
				</th>
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
							{#if dividendView == TOTAL_AMOUNT}
								{Math.floor(asset.amount * 100 * asset.share) / 100}
							{:else if dividendView == AMOUNT}
								{asset.amount} ({Math.floor((asset.amount * 10000) / asset.price) / 100}%)
							{:else if dividendView == THEORETICAL_AMOUNT}
								{Math.floor(
									asset.amount *
										100 *
										asset.share *
										calcProgressRate($time, asset.nextRecordDate, asset.previousRecordDate)
								) / 100}
							{/if}
						{:else}
							-
						{/if}
					</td>
					<td>
						{#if recordView == NEXT_DATE}
							{asset.nextRecordDate || '-'}
						{:else if recordView == PREVIOUS_DATE}
							{asset.previousRecordDate || '-'}
						{:else if recordView == PROGRESS_RATE}
							{#if !asset.nextRecordDate || !asset.previousRecordDate}
								-
							{:else}
								{Math.floor(
									calcProgressRate($time, asset.nextRecordDate, asset.previousRecordDate) * 1000
								) / 10}
							{/if}
						{/if}
					</td>
					<td
						><a href="/trade?code={asset.code}">
							<button class="hover:btn-primary-focus btn btn-outline btn-primary btn-xs"
								>取引</button
							>
						</a><a href="/dividend?code={asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">配当</button>
						</a><a href="/history?code={asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">履歴</button>
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
				<td
					><a href="/trade" class="hover:text-gray-400">
						<button class="btn btn-outline btn-secondary btn-xs">新規取引</button>
					</a></td
				>
			</tr>
		</tbody>
	</table>
</div>
