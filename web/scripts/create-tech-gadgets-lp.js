const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const slug = "tech-gadgets-sale";

    // Delete existing if any
    const existing = await prisma.landingPage.findUnique({ where: { slug } });
    if (existing) {
        await prisma.landingPageProduct.deleteMany({ where: { landingPageId: existing.id } });
        await prisma.landingPage.delete({ where: { slug } });
        console.log("Deleted existing landing page.");
    }

    // Product IDs from DB
    const products = [
        { id: "cmqy84q6i0002iy7p42z03m5d", sortOrder: 0 },   // Ven-Dens Power Bank (main)
        { id: "cmr3qylnu0002d4sd2mgggxy9", sortOrder: 1 },   // CYXG Q10 Earbuds
        { id: "cmqy6yoe100028y0aguuczg3g", sortOrder: 2 },   // Q86 TWS Retro Earbuds
    ];

    const lp = await prisma.landingPage.create({
        data: {
            title: "টেক গ্যাজেট মেগা সেল | Authentic Bazar",
            slug,
            isActive: true,
            heroTitle: "🔥 আমাদের সেরা টেক গ্যাজেট এখন সুপার ডিলে!",
            heroDescription: "প্রিমিয়াম পাওয়ার ব্যাংক, হাইফাই ওয়্যারলেস ইয়ারবাডস, এক পেজেই সেরা টেক কালেকশন, সীমিত সময়ের অফারে।",
            ctaText: "এখনই অর্ডার করুন",
            heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1782677292/authentic-bazar/hxpvxmv2mbfj0n46mjxf.jpg",
            countdownEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            showTestimonials: true,
            testimonialsJson: JSON.stringify([
                { name: "সাকিব হোসেন", text: "পাওয়ার ব্যাংকটা দারুণ! ডিজিটাল ডিসপ্লে আর বিল্ট ইন ক্যাবল, একদম পারফেক্ট। দ্রুত ডেলিভারি পেয়েছি।", rating: 5 },
                { name: "তামিম আহমেদ", text: "Q10 ইয়ারবাডস কিনেছি, সাউন্ড কোয়ালিটি অসাধারণ। দামে এত ভালো প্রোডাক্ট আগে পাইনি।", rating: 5 },
                { name: "নাফিসা রহমান", text: "Q86 এর রেট্রো ডিজাইন দেখতে অনেক স্টাইলিশ। ব্লুটুথ কানেকশন সুপার স্ট্যাবল। অবশ্যই রেকমেন্ড করব।", rating: 5 },
            ]),
        }
    });

    // Add products
    for (const prod of products) {
        await prisma.landingPageProduct.create({
            data: {
                landingPageId: lp.id,
                productId: prod.id,
                sortOrder: prod.sortOrder,
            }
        });
    }

    console.log("✅ Landing page created successfully!");
    console.log("URL: /lp/tech-gadgets-sale");
    console.log("ID:", lp.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
