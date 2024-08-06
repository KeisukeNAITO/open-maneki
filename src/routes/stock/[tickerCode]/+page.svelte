<script>
	import StockCard from './StockCard.svelte';

	export let data;
	const stock = data.stocks[0];
</script>

<StockCard {stock} />
