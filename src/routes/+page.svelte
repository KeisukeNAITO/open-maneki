<script lang="ts">
	import type { PageData } from './$types';
	import RegisterCard from './RegisterCard.svelte';
	import AssetCard from './AssetCard.svelte';

	export let data: PageData;
</script>

{#each data.assetList as asset}
	<AssetCard {asset} />
{/each}

<RegisterCard />
