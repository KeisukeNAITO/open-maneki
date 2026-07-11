import fs from 'node:fs';
import process from 'node:process';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

// 開発用サンプルデータ。`npx prisma db seed` で実行する（Node 22.18+ の
// TypeScript 型消去実行を前提に、追加のランナーは使わない）。
// 実行のたびに全テーブルを消してから投入するので冪等。

if (fs.existsSync('.env')) {
	process.loadEnvFile();
}

const url = process.env['DATABASE_URL'];
if (!url) {
	throw new Error('DATABASE_URL is not set. Copy .env.example to .env and adjust it.');
}

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main(): Promise<void> {
	// 外部キーの子 → 親の順に全消去
	await prisma.transaction.deleteMany();
	await prisma.marketPrice.deleteMany();
	await prisma.asset.deleteMany();
	await prisma.account.deleteMany();

	const taxable = await prisma.account.create({
		data: { name: '楽天証券', type: 'TAXABLE' }
	});
	const nisa = await prisma.account.create({
		data: { name: '楽天証券 NISA', type: 'NISA' }
	});

	const cashJpy = await prisma.asset.create({
		data: { name: 'JPY 現金', type: 'CASH', currency: 'JPY' }
	});
	const cashUsd = await prisma.asset.create({
		data: { name: 'USD 現金', type: 'CASH', currency: 'USD' }
	});
	const toyota = await prisma.asset.create({
		data: {
			name: 'トヨタ自動車',
			type: 'STOCK_JP',
			symbol: '7203',
			currency: 'JPY',
			shareholderBenefit: 'なし'
		}
	});
	const apple = await prisma.asset.create({
		data: { name: 'Apple Inc.', type: 'STOCK_US', symbol: 'AAPL', currency: 'USD' }
	});
	const fund = await prisma.asset.create({
		data: {
			name: 'eMAXIS Slim 全世界株式（オール・カントリー）',
			type: 'FUND',
			currency: 'JPY'
		}
	});

	await prisma.transaction.createMany({
		data: [
			// 課税口座: 入金 → トヨタ購入 → 一部売却 → 配当
			{
				accountId: taxable.id,
				assetId: cashJpy.id,
				type: 'DEPOSIT',
				occurredAt: new Date('2026-01-05'),
				quantity: null,
				amount: 1_000_000,
				currency: 'JPY'
			},
			{
				accountId: taxable.id,
				assetId: toyota.id,
				type: 'BUY',
				occurredAt: new Date('2026-02-03'),
				quantity: 100,
				amount: 285_000,
				currency: 'JPY',
				note: '長期保有目的'
			},
			{
				accountId: taxable.id,
				assetId: toyota.id,
				type: 'SELL',
				occurredAt: new Date('2026-05-15'),
				quantity: 30,
				amount: 92_000,
				currency: 'JPY'
			},
			{
				accountId: taxable.id,
				assetId: toyota.id,
				type: 'DIVIDEND',
				occurredAt: new Date('2026-06-28'),
				quantity: null,
				amount: 5_250,
				currency: 'JPY'
			},
			// 課税口座: USD 入金 → Apple 購入
			{
				accountId: taxable.id,
				assetId: cashUsd.id,
				type: 'DEPOSIT',
				occurredAt: new Date('2026-02-20'),
				quantity: null,
				amount: 500_000, // $5,000.00
				currency: 'USD'
			},
			{
				accountId: taxable.id,
				assetId: apple.id,
				type: 'BUY',
				occurredAt: new Date('2026-03-10'),
				quantity: 10,
				amount: 189_900, // $1,899.00
				currency: 'USD'
			},
			// NISA: 投信のつみたて 2 回
			{
				accountId: nisa.id,
				assetId: fund.id,
				type: 'BUY',
				occurredAt: new Date('2026-04-01'),
				quantity: 19_120,
				amount: 50_000,
				currency: 'JPY'
			},
			{
				accountId: nisa.id,
				assetId: fund.id,
				type: 'BUY',
				occurredAt: new Date('2026-05-01'),
				quantity: 18_650,
				amount: 50_000,
				currency: 'JPY'
			}
		]
	});

	await prisma.marketPrice.createMany({
		data: [
			// 最新日を選ぶロジックの確認用に、トヨタだけ 2 日分入れる
			{ assetId: toyota.id, date: new Date('2026-07-09'), price: 3_080 },
			{ assetId: toyota.id, date: new Date('2026-07-10'), price: 3_120 },
			{ assetId: apple.id, date: new Date('2026-07-10'), price: 21_834 }, // $218.34
			{ assetId: fund.id, date: new Date('2026-07-10'), price: 27_412 } // 1 万口あたり
		]
	});

	const counts = {
		accounts: await prisma.account.count(),
		assets: await prisma.asset.count(),
		transactions: await prisma.transaction.count(),
		marketPrices: await prisma.marketPrice.count()
	};
	console.log('Seeded:', counts);
}

try {
	await main();
} finally {
	await prisma.$disconnect();
}
