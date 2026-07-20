<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// entryDate は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	// 記録日の初期値はローカルの今日（input[type=date] の value は YYYY-MM-DD）
	function todayLocal(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${day}`;
	}
</script>

<h1>ジャーナル</h1>

<p>
	「なぜ気になったか」「なぜ売買したか」「いま振り返ってどう評価するか」を書き溜める場所です。
	銘柄を選ばずに、相場全体の所感を残すこともできます。
</p>

<form method="POST" use:enhance>
	<p>
		<label>
			銘柄
			<select name="assetId">
				<option value="">（銘柄に紐づけない）</option>
				{#each data.assets as asset (asset.id)}
					<option value={asset.id} selected={form?.values?.assetId === String(asset.id)}>
						{asset.name}{asset.symbol ? `（${asset.symbol}）` : ''}
					</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.assetId}<span class="error">{form.errors.assetId}</span>{/if}
	</p>
	<p>
		<label>
			記録日
			<input type="date" name="entryDate" value={form?.values?.entryDate ?? todayLocal()} />
		</label>
		{#if form?.errors?.entryDate}<span class="error">{form.errors.entryDate}</span>{/if}
	</p>
	<p>
		<label>
			本文
			<textarea name="body" rows="5" cols="60">{form?.values?.body ?? ''}</textarea>
		</label>
		{#if form?.errors?.body}<span class="error">{form.errors.body}</span>{/if}
	</p>
	<p><button type="submit">登録</button></p>
	{#if form?.success}
		<p class="success">エントリを登録しました。</p>
	{/if}
</form>

<h2>直近のエントリ</h2>
{#if data.recentEntries.length === 0}
	<p>登録されたエントリはありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>記録日</th>
				<th>銘柄</th>
				<th>本文</th>
			</tr>
		</thead>
		<tbody>
			{#each data.recentEntries as entry (entry.id)}
				<tr>
					<td>{formatDate(entry.entryDate)}</td>
					<td>{entry.asset?.name ?? '（全般）'}</td>
					<td class="body-cell">{entry.body}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.success {
		color: #1b5e20;
	}
	.body-cell {
		white-space: pre-wrap;
	}
</style>
