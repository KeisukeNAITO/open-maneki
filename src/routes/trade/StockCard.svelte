<script lang="ts">
	export let stockInfo;
</script>

<div class="card bg-neutral w-96">
	<div class="card-body text-white">
		<h2 class="card-title">{stockInfo.code} <span class="font-normal">{stockInfo.market}</span></h2>
		<p>銘柄名 {stockInfo.name}</p>
		<p>保有株数 {stockInfo.share}</p>
		<p>平均取得株価 {stockInfo.price}</p>
	</div>
</div>
