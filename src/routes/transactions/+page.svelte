<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatMoney } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Transaction.occurredAt は日付のみ（UTC 深夜 0 時）で保存されるため、
	// タイムゾーン変換なしに ISO 文字列の日付部分を切り出せばよい。
	function formatDate(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	// 発生日の初期値はローカルの今日（input[type=date] の value は YYYY-MM-DD）
	function todayLocal(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${day}`;
	}

	// キーは src/lib/server/types.ts の TRANSACTION_TYPES / ASSET_TYPES と一致させる
	// （lib/server はクライアントから import できないため表示用にここへ重複定義。
	// 未知の値はサーバ検証で弾かれるので、表示側は fallback で素通しする）
	const typeLabels: Record<string, string> = {
		BUY: '買付',
		SELL: '売却',
		DIVIDEND: '配当',
		DEPOSIT: '入金',
		WITHDRAW: '出金'
	};
	const assetTypeLabels: Record<string, string> = {
		CASH: '現金',
		STOCK_JP: '日本株',
		STOCK_US: '米国株',
		FUND: '投資信託'
	};

	// 種別の選択肢。context（資産一覧から遷移）では資産種別で絞る（現金は入出金、
	// 証券は買付・売却・配当）。通常フォームでは全種別を出し、サーバ検証に委ねる。
	const typeOptions = $derived.by(() => {
		const ctx = data.context;
		if (!ctx) return Object.entries(typeLabels);
		const allowed =
			ctx.asset.type === 'CASH' ? ['DEPOSIT', 'WITHDRAW'] : ['BUY', 'SELL', 'DIVIDEND'];
		return Object.entries(typeLabels).filter(([value]) => allowed.includes(value));
	});
</script>

<h1>取引登録</h1>

{#if data.accounts.length === 0 || data.assets.length === 0}
	<p>取引を登録するには口座と資産が必要です。</p>
{:else}
	<form method="POST" action="?/create" use:enhance>
		{#if data.context}
			<!-- 資産一覧の行から遷移: 口座・資産は自明なので表示のみ＋hidden で送る。
			     資産名・種別・コード・通貨も資産に属する確定値なので表示に留める。 -->
			<input type="hidden" name="accountId" value={data.context.account.id} />
			<input type="hidden" name="assetId" value={data.context.asset.id} />
			<p>口座: {data.context.account.name}（{data.context.account.type}）</p>
			<p>
				銘柄: {data.context.asset.name}{data.context.asset.symbol
					? `（${data.context.asset.symbol}）`
					: ''} / {data.context.asset.currency}（{assetTypeLabels[data.context.asset.type] ??
					data.context.asset.type}）
			</p>
		{:else}
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
					資産
					<select name="assetId">
						<option value="">選択してください</option>
						{#each data.assets as asset (asset.id)}
							<option value={asset.id} selected={form?.values?.assetId === String(asset.id)}>
								{asset.name}{asset.symbol ? `（${asset.symbol}）` : ''} / {asset.currency}
							</option>
						{/each}
					</select>
				</label>
				{#if form?.errors?.assetId}<span class="error">{form.errors.assetId}</span>{/if}
			</p>
		{/if}
		<p>
			<label>
				種別
				<select name="type">
					<option value="">選択してください</option>
					{#each typeOptions as [value, label] (value)}
						<option {value} selected={form?.values?.type === value}>{label}</option>
					{/each}
				</select>
			</label>
			{#if form?.errors?.type}<span class="error">{form.errors.type}</span>{/if}
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
				数量
				<input
					type="text"
					name="quantity"
					inputmode="numeric"
					value={form?.values?.quantity ?? ''}
				/>
			</label>
			<small>買付・売却のみ。株数・口数の整数</small>
			{#if form?.errors?.quantity}<span class="error">{form.errors.quantity}</span>{/if}
		</p>
		<p>
			<label>
				金額
				<input type="text" name="amount" inputmode="decimal" value={form?.values?.amount ?? ''} />
			</label>
			<small>受渡金額（手数料込みの総額）。JPY は円の整数、USD はドルで小数 2 桁まで</small>
			{#if form?.errors?.amount}<span class="error">{form.errors.amount}</span>{/if}
		</p>
		<p>
			<label>
				メモ
				<input type="text" name="note" value={form?.values?.note ?? ''} />
			</label>
			<small>売買理由など（任意）</small>
		</p>
		<p><button type="submit">登録</button></p>
		{#if form?.errors?.ledger}<p class="error">{form.errors.ledger}</p>{/if}
		{#if form?.success}<p class="success">取引を登録しました。</p>{/if}
	</form>
	{#if data.context}
		<p><a href={resolve('/transactions')}>別の口座・資産で登録する</a></p>
	{/if}
{/if}

{#if form?.suggestion}
	{@const suggestion = form.suggestion}
	{@const account = data.accounts.find((a) => a.id === suggestion.accountId)}
	<section class="suggestion">
		<h2>対応する入金の登録</h2>
		<p>
			配当は単式簿記のため現金に自動反映されません。同じ口座の現金に反映するには、
			対応する入金を登録してください。
		</p>
		{#if suggestion.cashAssets.length === 0}
			<p class="error">
				{suggestion.currency} の現金資産が未登録です。
				<a href={resolve('/assets')}>資産登録</a>で作成してから登録してください。
			</p>
		{:else}
			<form method="POST" action="?/create" use:enhance>
				<input type="hidden" name="accountId" value={suggestion.accountId} />
				<input type="hidden" name="type" value="DEPOSIT" />
				<input type="hidden" name="occurredAt" value={suggestion.occurredAt} />
				<p>口座: {account?.name ?? suggestion.accountId}（発生日 {suggestion.occurredAt}）</p>
				<p>
					<label>
						入金先の現金資産
						<select name="assetId">
							{#each suggestion.cashAssets as cashAsset (cashAsset.id)}
								<option value={cashAsset.id}>{cashAsset.name}</option>
							{/each}
						</select>
					</label>
				</p>
				<p>
					<label>
						金額
						<input type="text" name="amount" inputmode="decimal" value={suggestion.amount} />
					</label>
					<small>額面をプリフィルしています。源泉徴収後の実際の入金額に直してください</small>
				</p>
				<p>
					<label>
						メモ
						<input type="text" name="note" value="" />
					</label>
				</p>
				<p><button type="submit">入金を登録</button></p>
			</form>
		{/if}
	</section>
{/if}

<h2>直近の取引</h2>
{#if form?.deleteError}<p class="error">{form.deleteError}</p>{/if}
{#if form?.deleted}<p class="success">取引を削除しました。</p>{/if}
{#if data.recentTransactions.length === 0}
	<p>登録された取引はありません。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>発生日</th>
				<th>口座</th>
				<th>銘柄</th>
				<th>種別</th>
				<th>数量</th>
				<th>金額</th>
				<th>メモ</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.recentTransactions as row (row.id)}
				<tr>
					<td>{formatDate(row.occurredAt)}</td>
					<td>{row.account.name}</td>
					<td>{row.asset.name}</td>
					<td>{typeLabels[row.type] ?? row.type}</td>
					<td>{row.quantity === null ? '—' : row.quantity.toLocaleString('en-US')}</td>
					<td>{formatMoney(row.amount, row.currency)}</td>
					<td>{row.note ?? ''}</td>
					<td>
						<a href={resolve('/transactions/[id]/edit', { id: String(row.id) })}>編集</a>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm('この取引を削除します。よろしいですか？')) cancel();
							}}
						>
							<input type="hidden" name="transactionId" value={row.id} />
							<button type="submit">削除</button>
						</form>
					</td>
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
	.suggestion {
		margin-top: 1.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
