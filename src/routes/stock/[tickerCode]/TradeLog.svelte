<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';
	export let tradeLogs;
</script>

<div class="overflow-x-auto">
	<table class="table table-md table-zebra">
		<thead>
			<tr>
				<th style="display:none">#</th>
				<th>取引日</th>
				<th>売買</th>
				<th>株数</th>
				<th>株価</th>
			</tr>
		</thead>
		<tbody>
			{#each tradeLogs as tradeLog}
				<tr>
					<th style="display:none">{tradeLog.tradeId}</th>
					<td>{new Date(tradeLog.tradeAt).toISOString().slice(0, 10)}</td>
					<td>{tradeLog.transaction === TRADE_TYPE.BUY ? '買い' : '売り'}</td>
					<td>{tradeLog.share}</td>
					<td>{tradeLog.price}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
