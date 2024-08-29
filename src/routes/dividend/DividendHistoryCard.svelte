<script lang="ts">
	export let dividendHistory;

	const isPastRecordDate = (date: Date) => {
		const today = Date.now();
		const recordDate = new Date(date).setHours(23, 59, 59, 999);
		return  recordDate < today;
	}
</script>

<div class="overflow-x-auto">
	<table class="table table-md table-zebra">
		<thead>
			<tr>
				<th>#</th>
				<th>権利確定日</th>
				<th>配当金額</th>
				<th>ステータス</th>
			</tr>
		</thead>
		<tbody>
			{#each dividendHistory as dividendInfo}
				<tr>
					<td>{dividendInfo.dividendId}</td>
					<td>{new Date(dividendInfo.recordDate).toISOString().slice(0, 10)}</td>
					<td>{dividendInfo.amount}</td>
					<td>
						{#if dividendInfo.daysLeft > 0}
							D+{dividendInfo.daysLeft}
						{:else if dividendInfo.daysLeft === 0}
							本日
						{:else}
							確定済み
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
