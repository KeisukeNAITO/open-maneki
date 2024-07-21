<script lang="ts">
	import { TRADE_TYPE } from '$lib/const/const';
	import type { ActionData } from './$types';
	export let form: ActionData;

	let tradeTransaction = TRADE_TYPE.BUY;
	function changeBuyColor() {
		tradeTransaction = TRADE_TYPE.BUY;
	}
	function changeSellColor() {
		tradeTransaction = TRADE_TYPE.SELL;
	}
</script>

{#if form?.success}
	<p style:color="green">registered.</p>
{/if}

<div
	class="card bg-base-200 w-80 {tradeTransaction === TRADE_TYPE.BUY
		? 'outline-red-200'
		: 'outline-emerald-200'}"
>
	<div class="inline-flex">
		<button
			on:click={changeBuyColor}
			class="text-2xl font-bold py-2 px-4 rounded-tl-lg
			{tradeTransaction === TRADE_TYPE.BUY ? 'bg-red-500' : 'bg-base-300'} hover:bg-red-700 text-white"
		>
			Buy
		</button>
		<button
			on:click={changeSellColor}
			class="text-2xl font-bold py-2 px-4
			{tradeTransaction === TRADE_TYPE.SELL
				? 'bg-emerald-500'
				: 'bg-base-300'} hover:bg-emerald-700 text-white"
		>
			Sell
		</button>
	</div>
	<form method="POST" class="card-body">
		<input
			type="hidden"
			id="transaction"
			name="transaction"
			class="grow"
			placeholder="売買"
			bind:value={tradeTransaction}
		/>
		<label class="input input-bordered flex items-center gap-2">
			<input type="text" id="market" name="market" class="grow" placeholder="市場" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="text" id="code" name="code" class="grow" placeholder="銘柄コード" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="text" id="name" name="name" class="grow" placeholder="銘柄名" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="number" id="share" name="share" class="grow" placeholder="株数" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="number" id="price" name="price" class="grow" placeholder="株価" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="date" id="date" name="date" class="grow" placeholder="受渡日" />
		</label>
		<button type="submit" class="btn btn-neutral">登録</button>
	</form>
</div>
