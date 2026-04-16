const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    // সব ইউজার দেখাও
    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
    });

    console.log('\n📋 ডেটাবেজে সব ইউজার:');
    if (users.length === 0) {
        console.log('   কোনো ইউজার নেই!');
    } else {
        users.forEach(u => {
            console.log(`   - ${u.email} | Role: ${u.role} | Name: ${u.name}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
