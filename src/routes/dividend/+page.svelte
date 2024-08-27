<script lang="ts">
	import DividendRecordCard from './DividendRecordCard.svelte';
	export let data;
	const dividendRecordCardParam = {
		markets: data.markets,
		stockInfo: data.stockInfo[0]
	};
</script>

<DividendRecordCard {dividendRecordCardParam} />
