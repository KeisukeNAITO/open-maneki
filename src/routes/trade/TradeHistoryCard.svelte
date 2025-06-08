<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';

	export let tradeLogs;
</script>

<div class="overflow-x-auto">
	<table class="table-zebra table-md table">
		<thead>
			<tr>
				<th>#</th>
				<th>受渡日</th>
				<th>株数</th>
				<th>株価</th>
				<th>売買</th>
			</tr>
		</thead>
		<tbody>
			{#each tradeLogs as tradeInfo}
				<tr>
					<td>{tradeInfo.tradeId}</td>
					<td>{new Date(tradeInfo.tradeAt).toLocaleDateString('ja-JP')}</td>
					<td>{tradeInfo.share}</td>
					<td>{tradeInfo.price}</td>
					<td>{tradeInfo.transaction === TRADE_TYPE.BUY ? '買い' : '売り'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
