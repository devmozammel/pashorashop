const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const productId = "cmqdhx6xz0002oew5hrcm8cv3";
    const cleanSlug = "messi-10-player-edition-argentina-home";
    const dottedSlug = "messi-10-player-edition-argentina-home.";

    // 1. Delete existing landing pages with both slugs to avoid duplicate/orphaned records
    for (const slug of [cleanSlug, dottedSlug]) {
        const existing = await prisma.landingPage.findUnique({ where: { slug } });
        if (existing) {
            await prisma.landingPage.delete({ where: { slug } });
            console.log(`Deleted existing landing page for slug: ${slug}`);
        }
    }

    // 2. Create the landing page with slug 'messi-10-player-edition-argentina-home'
    const lp = await prisma.landingPage.create({
        data: {
            title: "Messi 10 player edition Argentina Home.",
            slug: cleanSlug,
            isActive: true,
            heroTitle: "মেসি ১০ প্লেয়ার এডিশন আর্জেন্টিনা হোম জার্সি",
            heroDescription: "মেসি ১০ প্লেয়ার এডিশন হোম জার্সি। ১০০% প্রিমিয়াম স্কয়ার কিউব ড্রাই-ফিট ফেব্রিক এবং আকর্ষণীয় এমব্রয়ডারি লোগো।",
            heroBtn: "অর্ডার করুন এখনই",
            ctaText: "অর্ডার করুন এখনই",
            countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days countdown
            discountCode: null,
            showTestimonials: true,
            testimonialsJson: JSON.stringify([
                { name: "তানজিম আহমেদ", text: "জার্সির ফেব্রিকটা অসাধারণ, প্লেয়ার ফিট সাইজটা একদম পারফেক্ট হয়েছে। ডেলিভারিও খুব দ্রুত পেয়েছি।", rating: 5 },
                { name: "জাহিদুল হাসান", text: "অরিজিনাল কালার ও নিখুঁত এমব্রয়ডারি লোগো। ৩-স্টার ব্যাজটাও দেখতে গর্জিয়াস লাগে।", rating: 5 },
                { name: "রাফসান ইসলাম", text: "যেমনটা ছবিতে দেখেছি ঠিক তেমনটাই পেয়েছি। প্রাইজ অনুযায়ী কোয়ালিটি বেশ ভালো।", rating: 5 }
            ]),
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

    console.log("Successfully created Messi 10 Argentina Home Jersey Landing Page:", lp);
}

main()
    .catch((e) => {
        console.error("Error creating landing page:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
