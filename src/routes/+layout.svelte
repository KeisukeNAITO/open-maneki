<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="container">
	<nav>
		<ul>
			<li><a href={resolve('/')}>資産一覧</a></li>
			<li><a href={resolve('/accounts')}>口座登録</a></li>
			<li><a href={resolve('/assets')}>資産登録</a></li>
			<li><a href={resolve('/prices')}>価格登録</a></li>
			<li><a href={resolve('/transactions')}>取引登録</a></li>
			<li><a href={resolve('/dividends')}>配当予想</a></li>
			<li><a href={resolve('/journal')}>ジャーナル</a></li>
			<li><a href={resolve('/watchlist')}>ウォッチリスト</a></li>
		</ul>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>
