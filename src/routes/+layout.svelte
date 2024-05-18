<script lang="ts">
	import '../app.css';
	import { dev, version } from '$app/environment';

	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="flex flex-col min-h-screen">
	<header class="flex items-center justify-between px-6 py-3 bg-black">
		<h1 class="text-2xl font-bold text-white text-xl">
			<a href="/" class="text-white font-bold text-xl">Open-Maneki</a>
		</h1>
		<nav class="flex gap-4">
			<div class="text-white">{@html data.layout.update}</div>
		</nav>
	</header>

	<div class="flex-grow px-4 py-6">
		<slot />
	</div>

	<footer class="bg-black py-2 text-center text-white">
		<p>
			Open-Maneki Ver.{@html data.layout.ver}, a dividend visualization tool to be used on the local
			network.
		</p>
		{#if dev == true}
			<div>development build {@html version}.</div>
		{/if}
	</footer>
</div>
