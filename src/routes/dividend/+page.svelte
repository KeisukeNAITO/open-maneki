<script lang="ts">
	import { setContext } from 'svelte';
	import ActionCard from './ActionCard.svelte';
	export let data;
	setContext('markets', data.markets);
</script>

<ActionCard />
