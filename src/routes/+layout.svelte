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
		<!-- 口座・資産・取引・価格の登録は資産一覧（/）のボディから到達できるため
		     ナビには出さない。ナビは閲覧系と、まだボディ導線を持たない定期入力
		     （配当予想）に絞る。 -->
		<ul>
			<li><a href={resolve('/')}>資産一覧</a></li>
			<li><a href={resolve('/dividends')}>配当予想</a></li>
			<li><a href={resolve('/journal')}>ジャーナル</a></li>
		</ul>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>
