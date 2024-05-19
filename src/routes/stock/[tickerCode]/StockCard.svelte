<script lang="ts">
	export let stock;
</script>

<div class="card w-96 bg-neutral">
	<div class="card-body">
		<h2 class="card-title"><span class="font-normal">{stock.code}</span> {stock.name}</h2>
		<p>保有株数 {stock.share}</p>
		<p>取得株価 {stock.price}</p>
		<div class="card-actions justify-end">
			<a href="../../"><button class="btn btn-outline btn-accent btn-xs">戻る</button></a>
		</div>
	</div>
</div>
