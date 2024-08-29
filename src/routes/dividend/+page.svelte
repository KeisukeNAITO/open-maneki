<script lang="ts">
	import DividendHistoryCard from './DividendHistoryCard.svelte';
	import DividendRegisterCard from './DividendRegisterCard.svelte';
	export let data;
	const dividendRegisterInfo = {
		markets: data.markets,
		stockInfo: data.stockInfo[0]
	};
	const dividendHistory = data.dividendHistory;
</script>

<DividendRegisterCard {dividendRegisterInfo} />
<DividendHistoryCard {dividendHistory} />
