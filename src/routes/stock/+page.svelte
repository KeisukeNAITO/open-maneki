<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';
	import { setContext } from 'svelte';
	import OrderCard from './OrderCard.svelte';
	export let data;
	setContext('markets', data.markets);

	let tradeTransaction: string = TRADE_TYPE.BUY;
</script>

<OrderCard {tradeTransaction} />
