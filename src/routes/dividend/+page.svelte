<script lang="ts">
	import DividendRegisterCard from './DividendRegisterCard.svelte';
	export let data;
	const dividendRegisterCardParam = {
		markets: data.markets,
		stockInfo: data.stockInfo[0]
	};
</script>

<DividendRegisterCard {dividendRegisterCardParam} />
