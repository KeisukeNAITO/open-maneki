<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';
	import OrderCard from './OrderCard.svelte';

	let tradeTransaction: string = TRADE_TYPE.BUY;
</script>

<OrderCard {tradeTransaction} />
