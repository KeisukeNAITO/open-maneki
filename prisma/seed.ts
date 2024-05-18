import { PrismaClient } from '@prisma/client';
// import userData from './user.data.json' assert { type: 'json' };

const prisma = new PrismaClient();

async function main() {
	// for (const p of userData) {
	// 	await prisma.user.create({
	// 		data: {
	// 			name: p.user.name,
	// 			email: p.user.email
	// 		}
	// 	});
	// }
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
