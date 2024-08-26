<script lang="ts">
	import { ChevronDoubleLeftOutline } from 'flowbite-svelte-icons';
	export let stock;
</script>

<div class="card w-96 bg-neutral">
	<div class="card-body text-white">
		<h2 class="card-title">{stock.code} <span class="font-normal">{stock.market}</span></h2>
		<p>銘柄名 {stock.name}</p>
		<p>保有株数 {stock.share}</p>
		<p>取得株価 {stock.price}</p>
		<div class="card-actions justify-end">
			<a href="/dividend"
				><button class="btn btn-outline btn-secondary btn-xs">配当</button></a
			>
		</div>
	</div>
	<div class="inline-flex">
		<a href="/">
			<button class="bg-neutral rounded-bl-lg">
				<ChevronDoubleLeftOutline
					class="text-base-100 w-10 h-8"
					title={{ id: 'my-title', title: 'Back' }}
					desc={{ id: 'my-descrip', desc: 'Back to home' }}
					ariaLabel="Back Button"
				/>
			</button>
		</a>
	</div>
</div>
