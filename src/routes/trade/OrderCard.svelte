<script lang="ts">
	import { ChevronDoubleLeftOutline } from 'flowbite-svelte-icons';
	import { TRADE_TYPE } from '$lib/const/const';
	import _ from 'lodash';
	export let tradeRegisterInfo;
	const markets = tradeRegisterInfo.markets;
	let tradeTransaction = tradeRegisterInfo.tradeTransaction;
	const stockInfo = tradeRegisterInfo.stockInfo;
	const isUpsert = !_.isEmpty(stockInfo);

	function changeBuyColor() {
		tradeTransaction = TRADE_TYPE.BUY;
	}
	function changeSellColor() {
		tradeTransaction = TRADE_TYPE.SELL;
	}
</script>

<div
	class="card bg-neutral w-96 {tradeTransaction === TRADE_TYPE.BUY
		? 'outline-red-200'
		: 'outline-emerald-200'}"
>
	<div class="inline-flex">
		<button
			on:click={changeBuyColor}
			class="text-2xl font-bold py-2 px-4 rounded-tl-lg
			{tradeTransaction === TRADE_TYPE.BUY ? 'bg-red-500' : 'bg-neutral'} hover:bg-red-700 text-white"
		>
			Buy
		</button>
		<button
			on:click={changeSellColor}
			class="text-2xl font-bold py-2 px-4
			{tradeTransaction === TRADE_TYPE.SELL
				? 'bg-emerald-500'
				: 'bg-neutral'} hover:bg-emerald-700 text-white"
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
			required
		/>
		{#if isUpsert}
			<select id="market" name="market" class="select select-bordered w-full">
				<option value={stockInfo.market}>{stockInfo.market}</option>
			</select>
			<label class="input input-bordered flex items-center gap-2">
				<input
					type="text"
					id="code"
					name="code"
					class="grow"
					placeholder="銘柄コード"
					value={stockInfo.code}
					readonly
					required
				/>
			</label>
			<label class="input input-bordered flex items-center gap-2">
				<input
					type="text"
					id="name"
					name="name"
					class="grow"
					placeholder="銘柄名"
					value={stockInfo.name}
					readonly
					required
				/>
			</label>
		{:else}
			<select id="market" name="market" class="select select-bordered w-full">
				<option disabled selected>市場</option>
				{#each markets as market}
					<option value={market.marketName}>{market.marketName}</option>
				{/each}
			</select>
			<label class="input input-bordered flex items-center gap-2">
				<input type="text" id="code" name="code" class="grow" placeholder="銘柄コード" required />
			</label>
			<label class="input input-bordered flex items-center gap-2">
				<input type="text" id="name" name="name" class="grow" placeholder="銘柄名" required />
			</label>
		{/if}
		<label class="input input-bordered flex items-center gap-2">
			<input type="number" id="share" name="share" class="grow" placeholder="株数" required />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input
				type="number"
				step="0.01"
				id="price"
				name="price"
				class="grow"
				placeholder="株価"
				required
			/>
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="date" id="date" name="date" class="grow" placeholder="受渡日" required />
		</label>
		<button type="submit" class="btn btn-secondary">登録</button>
	</form>
	<div class="inline-flex">
		<a href="/">
			<button class="bg-neutral rounded-bl-lg">
				<ChevronDoubleLeftOutline
					class="text-base-100 w-10 h-8"
					title={{ id: 'my-title', title: 'Back' }}
					desc={{ id: 'my-descrip', desc: 'Back to home' }}
					ariaLabel="red heart"
				/>
			</button>
		</a>
	</div>
</div>
