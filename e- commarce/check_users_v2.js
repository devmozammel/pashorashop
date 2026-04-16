const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`);
        });
        console.log('-----------------');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
