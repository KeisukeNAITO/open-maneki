<script>
	import StockCard from './StockCard.svelte';
	import TradeLog from './TradeLog.svelte';

	export let data;
	const stock = data.stocks[0];
	const tradeLogs = data.tradeLogs;
</script>

<StockCard {stock} />
<TradeLog {tradeLogs} />
