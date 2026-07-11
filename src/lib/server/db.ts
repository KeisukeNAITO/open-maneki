import { env } from '$env/dynamic/private';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

// Prisma 7 は Rust エンジン廃止に伴い、ランタイム接続にドライバアダプタが必須。
// SQLite には公式の better-sqlite3 アダプタを使う。
// DATABASE_URL の相対パスはプロジェクトルート基準（CLI 側の解決と同じ）。
if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set. Copy .env.example to .env and adjust it.');
}

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

// サーバプロセスにつき 1 インスタンスを共有するシングルトン。
// SvelteKit のサーバ専用境界（lib/server）にあるため、クライアントには漏れない。
export const prisma = new PrismaClient({ adapter });
