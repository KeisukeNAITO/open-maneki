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
				<th>配当ID</th>
				<th>配当単価</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.assetList as asset}
				<tr>
					<th>{asset.stockId}</th>
					<th>{asset.market}</th>
					<td>{asset.code}</td>
					<td>{asset.name}</td>
					<td>{asset.share}</td>
					<td>{asset.price}</td>
					<td>{asset.dividendId || '-'}</td>
					<td>{asset.amount || '-'}</td>
					<th
						><a href="/stock/{asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">編集</button>
						</a></th
					>
				</tr>
			{/each}
			<tr>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th
					><a href="/stock" class="hover:text-gray-400">
						<button class="btn btn-outline btn-secondary btn-xs">登録</button>
					</a></th
				>
			</tr>
		</tbody>
	</table>
</div>
