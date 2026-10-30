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
		<!-- 登録・入力系（口座・資産・取引・価格・配当予想）はすべて資産一覧（/）の
		     ボディから対象資産の文脈つきで到達できるためナビには出さない。
		     ナビは閲覧系（資産一覧・ジャーナル）に絞る。 -->
		<ul>
			<li><a href={resolve('/')}>資産一覧</a></li>
			<li><a href={resolve('/journal')}>ジャーナル</a></li>
		</ul>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>
