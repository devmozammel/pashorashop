const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const productId = "cmqffvhqz0002zqgxvzaffkl4";
    const slug = "massage-gun";

    // Delete existing landing page with this slug if any
    const existing = await prisma.landingPage.findUnique({ where: { slug } });
    if (existing) {
        await prisma.landingPage.delete({ where: { slug } });
        console.log("Deleted existing landing page.");
    }

    // Create the landing page
    const lp = await prisma.landingPage.create({
        data: {
            title: "Premium Massage Gun",
            slug: slug,
            isActive: true,
            heroTitle: "পাওয়ারফুল ডিপ টিস্যু ম্যাসাজ গান",
            heroDescription: "শরীর ও জয়েন্টের যেকোনো ব্যথা থেকে দ্রুত মুক্তি পান গ্যারান্টি সহ। এটি আপনার মাসল পেইনের আরাম নিশ্চিত করবে।",
            heroBtn: "অর্ডার করুন এখনই",
            ctaText: "অর্ডার করুন এখনই",
            countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            discountCode: "FREE50",
            showTestimonials: true,
            products: {
                create: [
                    {
                        productId: productId,
                        sortOrder: 0
                    }
                ]
            }
        }
    });

    console.log("Successfully created Massage Gun Landing Page:", lp);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
