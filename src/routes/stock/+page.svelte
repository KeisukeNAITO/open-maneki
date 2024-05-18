<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

{#if form?.success}
	<p style:color="green">registered.</p>
{/if}

<form method="POST">
	<div>
		<label for="code">Code</label>
		<input type="text" id="code" name="code" placeholder="Code" />
	</div>
	<div>
		<label for="name">Name</label>
		<textarea id="name" name="name" placeholder="Name" />
	</div>
	<div>
		<label for="share">Share</label>
		<input type="text" id="share" name="share" placeholder="Share" />
	</div>
	<div>
		<label for="price">Price</label>
		<input type="text" id="price" name="price" placeholder="Price" />
	</div>
	<div>
		<label for="accountType">AccountType</label>
		<input type="text" id="accountType" name="accountType" placeholder="AccountType" />
	</div>
	<div>
		<button type="submit">Add</button>
	</div>
</form>

<style>
	form {
		margin: 0.8em 0;
		border-radius: 0.2em;
		background-color: #dddddd;
		color: #333333;
	}
	div {
		padding: 0.2em 0.5em;
		text-align: left;
	}
</style>
