<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

{#if form?.success}
	<p style:color="green">registered.</p>
{/if}

<div class="card bg-base-200 w-80">
	<form method="POST" class="card-body">
		<label class="input input-bordered flex items-center gap-2">
			<input type="text" id="code" name="code" class="grow" placeholder="銘柄コード" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="text" id="name" name="name" class="grow" placeholder="銘柄名" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="number" id="share" name="share" class="grow" placeholder="株数" />
		</label>
		<label class="input input-bordered flex items-center gap-2">
			<input type="number" id="price" name="price" class="grow" placeholder="株価" />
		</label>

		<button type="submit" class="btn btn-neutral">登録</button>
	</form>
</div>
