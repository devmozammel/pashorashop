const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteAdmin(email) {
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'ADMIN' },
        });
        console.log(`Success! ${user.email} is now an ADMIN.`);
    } catch (error) {
        if (error.code === 'P2025') {
            console.error(`Error: User with email ${email} not found. Please register first!`);
        } else {
            console.error('Error promoting user:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2] || 'tarunhossain567@gmail.com';
promoteAdmin(email);
