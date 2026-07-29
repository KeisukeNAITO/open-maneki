<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// 表示値の優先順位: 送信失敗時は入力値（form.values）、初回は load のプリフィル。
	const values = $derived(form?.values ?? data.prefill);

	// キーは src/lib/server/types.ts の TRANSACTION_TYPES と一致させる
	// （lib/server はクライアントから import できないため表示用にここへ重複定義）
	const typeLabels: Record<string, string> = {
		BUY: '買付',
		SELL: '売却',
		DIVIDEND: '配当',
		DEPOSIT: '入金',
		WITHDRAW: '出金'
	};
</script>

<h1>取引の編集</h1>

<p><a href={resolve('/transactions')}>取引一覧に戻る</a></p>

<form method="POST" use:enhance>
	<p>
		<label>
			口座
			<select name="accountId">
				<option value="">選択してください</option>
				{#each data.accounts as account (account.id)}
					<option value={account.id} selected={values.accountId === String(account.id)}>
						{account.name}（{account.type}）
					</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.accountId}<span class="error">{form.errors.accountId}</span>{/if}
	</p>
	<p>
		<label>
			資産
			<select name="assetId">
				<option value="">選択してください</option>
				{#each data.assets as asset (asset.id)}
					<option value={asset.id} selected={values.assetId === String(asset.id)}>
						{asset.name}{asset.symbol ? `（${asset.symbol}）` : ''} / {asset.currency}
					</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.assetId}<span class="error">{form.errors.assetId}</span>{/if}
	</p>
	<p>
		<label>
			種別
			<select name="type">
				<option value="">選択してください</option>
				{#each Object.entries(typeLabels) as [value, label] (value)}
					<option {value} selected={values.type === value}>{label}</option>
				{/each}
			</select>
		</label>
		{#if form?.errors?.type}<span class="error">{form.errors.type}</span>{/if}
	</p>
	<p>
		<label>
			発生日
			<input type="date" name="occurredAt" value={values.occurredAt ?? ''} />
		</label>
		{#if form?.errors?.occurredAt}<span class="error">{form.errors.occurredAt}</span>{/if}
	</p>
	<p>
		<label>
			数量
			<input type="text" name="quantity" inputmode="numeric" value={values.quantity ?? ''} />
		</label>
		<small>買付・売却のみ。株数・口数の整数</small>
		{#if form?.errors?.quantity}<span class="error">{form.errors.quantity}</span>{/if}
	</p>
	<p>
		<label>
			金額
			<input type="text" name="amount" inputmode="decimal" value={values.amount ?? ''} />
		</label>
		<small>受渡金額（手数料込みの総額）。JPY は円の整数、USD はドルで小数 2 桁まで</small>
		{#if form?.errors?.amount}<span class="error">{form.errors.amount}</span>{/if}
	</p>
	<p>
		<label>
			メモ
			<input type="text" name="note" value={values.note ?? ''} />
		</label>
		<small>売買理由など（任意）</small>
	</p>
	<p><button type="submit">更新</button></p>
	{#if form?.errors?.ledger}<p class="error">{form.errors.ledger}</p>{/if}
</form>

<style>
	.error {
		color: #b00020;
	}
</style>
