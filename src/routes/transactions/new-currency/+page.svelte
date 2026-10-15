<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// 発生日の初期値はローカルの今日（input[type=date] の value は YYYY-MM-DD）
	function todayLocal(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${day}`;
	}
</script>

<h1>新しい通貨の現金を追加</h1>

{#if data.accounts.length === 0}
	<p>入金を登録するには口座が必要です。</p>
{:else}
	<p>選んだ通貨の現金資産が無ければ自動で作成し、あれば既存の資産へ入金します。</p>
	{#if form?.errors?.general}<p class="error">{form.errors.general}</p>{/if}
	<form method="POST" use:enhance>
		<p>
			<label>
				口座
				<select name="accountId">
					<option value="">選択してください</option>
					{#each data.accounts as account (account.id)}
						<option value={account.id} selected={form?.values?.accountId === String(account.id)}>
							{account.name}（{account.type}）
						</option>
					{/each}
				</select>
			</label>
			{#if form?.errors?.accountId}<span class="error">{form.errors.accountId}</span>{/if}
		</p>
		<p>
			<label>
				通貨
				<select name="currency">
					<option value="">選択してください</option>
					<option value="JPY" selected={form?.values?.currency === 'JPY'}>JPY</option>
					<option value="USD" selected={form?.values?.currency === 'USD'}>USD</option>
				</select>
			</label>
			{#if form?.errors?.currency}<span class="error">{form.errors.currency}</span>{/if}
		</p>
		<p>
			<label>
				発生日
				<input type="date" name="occurredAt" value={form?.values?.occurredAt ?? todayLocal()} />
			</label>
			{#if form?.errors?.occurredAt}<span class="error">{form.errors.occurredAt}</span>{/if}
		</p>
		<p>
			<label>
				金額
				<input type="text" name="amount" inputmode="decimal" value={form?.values?.amount ?? ''} />
			</label>
			<small>入金額。JPY は円の整数、USD はドルで小数 2 桁まで</small>
			{#if form?.errors?.amount}<span class="error">{form.errors.amount}</span>{/if}
		</p>
		<p>
			<label>
				メモ
				<input type="text" name="note" value={form?.values?.note ?? ''} />
			</label>
			<small>任意</small>
		</p>
		<p><button type="submit">登録</button></p>
		{#if form?.errors?.ledger}<p class="error">{form.errors.ledger}</p>{/if}
		{#if form?.success}<p class="success">入金を登録しました。</p>{/if}
	</form>
	<p><a href={resolve('/transactions')}>既存の資産で取引を登録する</a></p>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.success {
		color: #1b5e20;
	}
</style>
