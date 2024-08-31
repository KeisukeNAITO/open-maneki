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
					<td>{asset.amount || '-'}</td>
					<td>{asset.recordDate || '-'}</td>
					<th
						><a href="/trade?code={asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">取引</button>
						</a><a href="/dividend/{asset.code}">
							<button class="btn btn-outline btn-primary btn-xs">配当</button>
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
					><a href="/trade" class="hover:text-gray-400">
						<button class="btn btn-outline btn-secondary btn-xs">新規取引</button>
					</a></th
				>
			</tr>
		</tbody>
	</table>
</div>
