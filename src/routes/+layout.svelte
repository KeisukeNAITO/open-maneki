<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href={resolve('/')}>資産一覧</a>
	<a href={resolve('/accounts')}>口座登録</a>
	<a href={resolve('/assets')}>資産登録</a>
	<a href={resolve('/prices')}>価格登録</a>
	<a href={resolve('/transactions')}>取引登録</a>
</nav>

{@render children()}
