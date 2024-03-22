<script>
	import '../app.css';
</script>

<div class="flex flex-col min-h-screen">
	<header class="flex items-center justify-between px-6 py-3 bg-black">
		<h1 class="text-2xl font-bold text-white text-xl">
			<a href="/" class="text-white font-bold text-xl">Open-Maneki</a>
		</h1>
		<nav class="flex gap-4">
			<a href="/stock" class="text-white hover:text-gray-400">Stock</a> |
			<a href="/dividend" class="text-white hover:text-gray-400">Dividend</a> |
			<a href="/demo" class="text-white hover:text-gray-400">Demo</a>
		</nav>
	</header>

	<div class="flex-grow px-4 py-6">
		<slot />
	</div>

	<footer class="bg-black py-2 text-center text-white">
		<p>Open-Maneki, a dividend visualization tool to be used on the local network.</p>
	</footer>
</div>
