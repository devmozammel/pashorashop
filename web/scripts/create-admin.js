const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ⚠️ এখানে আপনার পছন্দের ইমেইল ও পাসওয়ার্ড দিন
const ADMIN_EMAIL = 'admin@yoursite.com';
const ADMIN_PASSWORD = 'Admin@12345';
const ADMIN_NAME = 'Admin';

async function main() {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: { role: 'ADMIN' },
        create: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: ADMIN_NAME,
            role: 'ADMIN',
        }
    });

    console.log(`✅ ADMIN অ্যাকাউন্ট তৈরি/আপডেট হয়েছে:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`\n🔐 লগইন করুন:`);
    console.log(`   URL:      http://localhost:3000/auth/login`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
