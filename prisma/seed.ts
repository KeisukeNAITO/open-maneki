import { PrismaClient } from '@prisma/client';
import marketMstData from './marketMst.data.json' assert { type: 'json' };

const db = new PrismaClient();

async function main() {
	for (const market of marketMstData) {
		console.log(market)
		await db.market.create({
			data: {
				marketId: market.marketId,
				marketName: market.marketName,
				officialName: market.officialName,
				currency: market.currency
			}
		});
	}
}

main()
	.then(async () => {
		await db.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await db.$disconnect();
		process.exit(1);
	});
