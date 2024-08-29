<script lang="ts">
	import { ChevronDoubleLeftOutline } from 'flowbite-svelte-icons';
	import _ from 'lodash';
	export let dividendRegisterInfo;
	const markets = dividendRegisterInfo.markets;
	const stockInfo = dividendRegisterInfo.stockInfo;
	const isUpdate = !_.isEmpty(stockInfo);
</script>

<div class="card bg-neutral w-96">
	<form method="POST" class="card-body">
		{#if isUpdate}
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
			<input
				type="number"
				step="0.01"
				id="amount"
				name="amount"
				class="grow"
				placeholder="配当額"
				required
			/>
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="date" id="date" name="date" class="grow" placeholder="配当落ち日" required />
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
