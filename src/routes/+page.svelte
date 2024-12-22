<script lang="ts">
	import type { PageData } from './$types';
	import AssetListTable from './AssetListTable.svelte';

	export let data: PageData;
</script>

<div class="flex w-full flex-col lg:flex-row">
	<div class="card grid h-20 flex-grow place-items-center rounded-box bg-base-300">
		<h1>Dividend visualization tool.</h1>
	</div>
	<div class="divider divider-horizontal"></div>
	<div class="card grid flex-grow rounded-box">
		<AssetListTable {data} />
	</div>
</div>
