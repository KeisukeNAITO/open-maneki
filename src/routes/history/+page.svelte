<script>
	export let data;
</script>

<table class="table table-zebra table-md" role="grid" aria-label="資産一覧">
	<thead>
		<tr>
			<th>市場</th>
			<th>コード</th>
			<th>銘柄名</th>
			<th>イベント発生日</th>
			<th>イベント種類</th>
			<th>単価, 株数, 備考</th>
		</tr>
	</thead>
	<tbody>
		{#each data.transactionHistory as record}
			<tr>
				<td>{record.market}</td>
				<td>{record.code}</td>
				<td>{record.name}</td>
				<td>{record.eventDate}</td>
				<td>
					{#if record.dividendId}
						配当
					{:else if record.tradeId}
						{#if record.transaction == 'buy'}
							購入
						{:else}
							売却
						{/if}
					{/if}
				</td>
				<td></td>
			</tr>
		{/each}
	</tbody>
</table>
