<script lang="ts">
	export let data;
</script>

<div class="overflow-x-auto">
	<table class="table table-md table-zebra">
		<thead>
			<tr>
				<th>#</th>
				<th>市場</th>
				<th>銘柄コード</th>
				<th>銘柄名</th>
				<th>株数</th>
				<th>株価</th>
				<th>配当単価</th>
				<th>直近配当落ち日</th>
				<th>直前配当落ち日</th>
				<th>進捗率(%)</th>
				<th></th>
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
					<td>{asset.amount || '-'}</td>
					<td>{asset.recordDate || '-'}</td>
					<td>{asset.previousRecordDate || '-'}</td>
					<td>{asset.progressRate*100 || '-'}</td>
					<td
						><a href="/trade?code={asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">取引</button>
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
