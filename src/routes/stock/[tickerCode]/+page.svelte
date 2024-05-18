<script>
	import StockCard from './StockCard.svelte';

	export let data;
</script>

{#each data.stocks as stock}
	<StockCard {stock} />
{/each}
