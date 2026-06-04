const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = process.argv[2] || 'admin@yoursite.com'; // আপনার এডমিন ইমেইল

async function main() {
    // প্রথমে ইউজার চেক করি
    const user = await prisma.user.findUnique({
        where: { email: EMAIL },
        select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
        console.log(`❌ ইউজার পাওয়া যায়নি: ${EMAIL}`);
        console.log('👉 এই ইমেইলে আগে রেজিস্ট্রেশন করুন, তারপর আবার রান করুন।');
        return;
    }

    console.log(`\n✅ ইউজার পাওয়া গেছে:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);

    if (user.role === 'ADMIN') {
        console.log(`\n✅ ইউজার ইতোমধ্যেই ADMIN। সমস্যা অন্য কোথাও।`);
    } else {
        // ADMIN role সেট করি
        const updated = await prisma.user.update({
            where: { email: EMAIL },
            data: { role: 'ADMIN' }
        });
        console.log(`\n🚀 Role আপডেট হয়েছে: ${updated.role}`);
        console.log(`✅ এখন লগইন করুন, এডমিন প্যানেলে ঢুকতে পারবেন।`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
