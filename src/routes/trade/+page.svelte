<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';
	import _ from 'lodash';
	import OrderCard from './OrderCard.svelte';
	import TradeHistoryCard from './TradeHistoryCard.svelte';
	import StockCard from './StockCard.svelte';

	export let data;
	const tradeRegisterInfo = {
		markets: data.markets,
		stockInfo: data.stockInfo[0],
		tradeTransaction: TRADE_TYPE.BUY
	};
	const stockInfo = data.stockInfo[0];
	const tradeLogs = data.tradeLogs;
</script>

<OrderCard {tradeRegisterInfo} />

{#if !_.isEmpty(tradeLogs)}
	<StockCard {stockInfo} />
	<TradeHistoryCard {tradeLogs} />
{/if}
