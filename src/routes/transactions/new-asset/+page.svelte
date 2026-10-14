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

	// 資産種別で通貨・優待メモの出し分けを駆動するためクライアント状態を持つ
	// （専用ルートなので登録ページにクライアント二状態を持ち込む懸念はない）。
	// 失敗再送時は form.values から初期値を復元する（enhance では再マウントされず
	// ユーザーの選択が保持され、非 JS では完全リロードで初期値が入る）。初期値の
	// 一度きりの取り込みが目的なので form への反応は不要。
	// svelte-ignore state_referenced_locally
	let assetType = $state(form?.values?.asset?.type ?? '');

	// 通貨は種別から決まる（STOCK_JP → JPY / STOCK_US → USD は固定、FUND は選択）。
	// 資産登録ページの validateAssetForm の強制ルールを UI 側でも先取りする。
	const fixedCurrency = $derived(
		assetType === 'STOCK_JP' ? 'JPY' : assetType === 'STOCK_US' ? 'USD' : null
	);
	const showBenefit = $derived(assetType === 'STOCK_JP');
</script>

<h1>新しい資産を追加して取引を登録</h1>

{#if data.accounts.length === 0}
	<p>取引を登録するには口座が必要です。</p>
{:else}
	<form method="POST" use:enhance>
		<h2>資産</h2>
		<p>
			<label>
				資産名
				<input type="text" name="name" value={form?.values?.asset?.name ?? ''} />
			</label>
			{#if form?.assetErrors?.name}<span class="error">{form.assetErrors.name}</span>{/if}
		</p>
		<p>
			<label>
				資産種別
				<select name="assetType" bind:value={assetType}>
					<option value="">選択してください</option>
					<option value="STOCK_JP">日本株</option>
					<option value="STOCK_US">米国株</option>
					<option value="FUND">投資信託</option>
				</select>
			</label>
			{#if form?.assetErrors?.type}<span class="error">{form.assetErrors.type}</span>{/if}
		</p>
		<p>
			<label>
				証券コード
				<input type="text" name="symbol" value={form?.values?.asset?.symbol ?? ''} />
			</label>
			<small>任意</small>
			{#if form?.assetErrors?.symbol}<span class="error">{form.assetErrors.symbol}</span>{/if}
		</p>
		<p>
			{#if fixedCurrency}
				<!-- 種別から通貨が確定するので表示のみ＋hidden で送る -->
				<input type="hidden" name="currency" value={fixedCurrency} />
				通貨: {fixedCurrency}
			{:else}
				<label>
					通貨
					<select name="currency">
						<option value="JPY" selected={form?.values?.asset?.currency === 'JPY'}>JPY</option>
						<option value="USD" selected={form?.values?.asset?.currency === 'USD'}>USD</option>
					</select>
				</label>
			{/if}
			{#if form?.assetErrors?.currency}<span class="error">{form.assetErrors.currency}</span>{/if}
		</p>
		{#if showBenefit}
			<p>
				<label>
					株主優待メモ
					<input
						type="text"
						name="shareholderBenefit"
						value={form?.values?.asset?.shareholderBenefit ?? ''}
					/>
				</label>
				<small>日本株のみ（任意）</small>
				{#if form?.assetErrors?.shareholderBenefit}<span class="error"
						>{form.assetErrors.shareholderBenefit}</span
					>{/if}
			</p>
		{/if}

		<h2>最初の取引</h2>
		<p>
			<label>
				口座
				<select name="accountId">
					<option value="">選択してください</option>
					{#each data.accounts as account (account.id)}
						<option
							value={account.id}
							selected={form?.values?.transaction?.accountId === String(account.id)}
						>
							{account.name}（{account.type}）
						</option>
					{/each}
				</select>
			</label>
			{#if form?.transactionErrors?.accountId}<span class="error"
					>{form.transactionErrors.accountId}</span
				>{/if}
		</p>
		<p>
			<label>
				種別
				<select name="transactionType">
					<option value="">選択してください</option>
					<option value="BUY" selected={form?.values?.transaction?.type === 'BUY'}>買付</option>
					<option value="SELL" selected={form?.values?.transaction?.type === 'SELL'}>売却</option>
					<option value="DIVIDEND" selected={form?.values?.transaction?.type === 'DIVIDEND'}
						>配当</option
					>
				</select>
			</label>
			{#if form?.transactionErrors?.type}<span class="error">{form.transactionErrors.type}</span
				>{/if}
		</p>
		<p>
			<label>
				発生日
				<input
					type="date"
					name="occurredAt"
					value={form?.values?.transaction?.occurredAt ?? todayLocal()}
				/>
			</label>
			{#if form?.transactionErrors?.occurredAt}<span class="error"
					>{form.transactionErrors.occurredAt}</span
				>{/if}
		</p>
		<p>
			<label>
				数量
				<input
					type="text"
					name="quantity"
					inputmode="numeric"
					value={form?.values?.transaction?.quantity ?? ''}
				/>
			</label>
			<small>買付・売却のみ。株数・口数の整数</small>
			{#if form?.transactionErrors?.quantity}<span class="error"
					>{form.transactionErrors.quantity}</span
				>{/if}
		</p>
		<p>
			<label>
				金額
				<input
					type="text"
					name="amount"
					inputmode="decimal"
					value={form?.values?.transaction?.amount ?? ''}
				/>
			</label>
			<small>受渡金額（手数料込みの総額）。JPY は円の整数、USD はドルで小数 2 桁まで</small>
			{#if form?.transactionErrors?.amount}<span class="error">{form.transactionErrors.amount}</span
				>{/if}
		</p>
		<p>
			<label>
				メモ
				<input type="text" name="note" value={form?.values?.transaction?.note ?? ''} />
			</label>
			<small>売買理由など（任意）</small>
		</p>
		<p><button type="submit">登録</button></p>
		{#if form?.transactionErrors?.ledger}<p class="error">{form.transactionErrors.ledger}</p>{/if}
		{#if form?.success}<p class="success">資産と取引を登録しました。</p>{/if}
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
