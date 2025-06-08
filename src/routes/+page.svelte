<script lang="ts">
	import type { PageData } from './$types';
	import AssetListTable from './AssetListTable.svelte';

	export let data: PageData;
</script>

<div class="flex w-full flex-col lg:flex-row">
	<div class="card rounded-box bg-base-300 grid h-20 flex-grow place-items-center">
		<h1>Dividend visualization tool.</h1>
	</div>
	<div class="divider divider-horizontal"></div>
	<div class="card rounded-box grid flex-grow">
		<AssetListTable {data} />
	</div>
</div>
