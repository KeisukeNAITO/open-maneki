import fs from 'node:fs';
import process from 'node:process';
import { defineConfig } from 'prisma/config';

// Load .env for the Prisma CLI (Node's built-in loader, no dotenv needed).
// The SvelteKit app itself gets env vars via $env, so this is CLI-only.
if (fs.existsSync('.env')) {
	process.loadEnvFile();
}

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'node prisma/seed.ts'
	},
	datasource: {
		url: process.env['DATABASE_URL']
	}
});
