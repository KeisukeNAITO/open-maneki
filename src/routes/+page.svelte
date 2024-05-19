<script lang="ts">
	import type { PageData } from './$types';
	import AssetListTable from './AssetListTable.svelte';

	export let data: PageData;
</script>

<div class="flex flex-col w-full lg:flex-row">
	<div class="grid h-20 flex-grow card bg-base-300 rounded-box place-items-center">
		<h1>Dividend visualization tool.</h1>
	</div>
	<div class="divider divider-horizontal"></div>
	<div class="grid flex-grow card rounded-box">
		<AssetListTable {data} />
	</div>
</div>
