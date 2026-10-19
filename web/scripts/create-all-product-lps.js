const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_FEATURES = [
    { icon: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন" },
    { icon: "✅", title: "১০০% অরিজিনাল", desc: "প্রিমিয়াম কোয়ালিটি ও খাঁটি পণ্যের ১০০% নিশ্চয়তা" },
    { icon: "⚡", title: "দ্রুত হোম ডেলিভারি", desc: "ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ২-৪ দিনে ডেলিভারি" },
    { icon: "🔄", title: "সহজ রিপ্লেসমেন্ট", desc: "কোনো সমস্যা থাকলে সাথে সাথে রিটার্ন সাপোর্ট" },
    { icon: "🛡️", title: "টেকসই ও নিখুঁত", desc: "লং-লাস্টিং ব্যবহারের জন্য সম্পূর্ণ কোয়ালিটি টেস্ট করা" },
    { icon: "📞", title: "সার্বক্ষণিক সাপোর্ট", desc: "অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে ২৪/৭ কাস্টমার কেয়ার" }
];

function generateTestimonials(productName) {
    const pool = [
        { name: "রাফসান আহমেদ", city: "ঢাকা", text: `${productName} হাতে পাওয়ার পর কোয়ালিটি দেখে সত্যিই মুগ্ধ হয়েছি। প্যাকেজিং ও ফাস্ট ডেলিভারির জন্য ধন্যবাদ।` },
        { name: "তানভীর হাসান", city: "চট্টগ্রাম", text: `যেমন ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। ১০০% অরিজিনাল প্রোডাক্ট, ক্যাশ অন ডেলিভারিতে চেক করে নিতে পেরেছি।` },
        { name: "সাদিয়া ইসলাম", city: "সিলেট", text: `অসাধারণ কোয়ালিটি এবং চমৎকার ফিনিশিং! এই প্রাইস রেঞ্জে এত ভালো প্রোডাক্ট পাওয়া ভাগ্যের ব্যাপার।` },
        { name: "মাহমুদুল হাসান", city: "রাজশাহী", text: `ডেলিভারি ম্যান অনেক হেল্পফুল ছিল, প্রোডাক্ট ওপেন করে দেখে নিয়েছি। খুবই ভালো সার্ভিস।` },
        { name: "আরিফুল ইসলাম", city: "খুলনা", text: `পণ্যটি ব্যবহারের অভিজ্ঞতা খুবই ভালো। যে কেউ নিশ্চিন্তে অর্ডার করতে পারেন।` }
    ];
    // Pick 3 pseudo-random but deterministic based on product name length
    const offset = productName.length % pool.length;
    return [
        { ...pool[offset], rating: 5 },
        { ...pool[(offset + 1) % pool.length], rating: 5 },
        { ...pool[(offset + 2) % pool.length], rating: 5 }
    ];
}

async function main() {
    console.log("=== STARTING LANDING PAGE GENERATION FOR ALL PRODUCTS ===");

    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            productImages: { orderBy: { sortOrder: 'asc' } },
            category: true,
            landingPages: { include: { landingPage: true } }
        }
    });

    console.log(`Total active products to process: ${products.length}`);

    const futureCountdown = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000); // 25 days ahead
    let createdCount = 0;
    let updatedCount = 0;

    for (const p of products) {
        const prodImg = p.productImages?.[0]?.url || (Array.isArray(p.images) ? p.images[0] : null);

        // Check if landing page with exact product.slug exists
        let existingLp = await prisma.landingPage.findUnique({
            where: { slug: p.slug },
            include: { products: true }
        });

        if (!existingLp) {
            // Create brand new landing page for this product
            const heroDesc = p.shortDesc || "১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি পণ্য। দ্রুত হোম ডেলিভারি ও সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা সহ আজই অর্ডার করুন।";
            const testimonials = generateTestimonials(p.name);

            existingLp = await prisma.landingPage.create({
                data: {
                    title: `${p.name} | স্পেশাল অফার`,
                    slug: p.slug,
                    isActive: true,
                    heroTitle: `${p.name} — বিশেষ মেগা অফার!`,
                    heroDescription: heroDesc,
                    heroBtn: "অর্ডার করুন এখনই",
                    heroLink: `/lp/${p.slug}`,
                    heroImageUrl: prodImg,
                    ctaText: "এখনই অর্ডার করুন",
                    countdownEnd: futureCountdown,
                    showTestimonials: true,
                    testimonialsJson: JSON.stringify(testimonials),
                    featuresJson: JSON.stringify(DEFAULT_FEATURES)
                }
            });

            // Link product to landing page
            await prisma.landingPageProduct.create({
                data: {
                    landingPageId: existingLp.id,
                    productId: p.id,
                    sortOrder: 0
                }
            });

            createdCount++;
            console.log(`[CREATED] /lp/${p.slug} -> Product: ${p.name}`);
        } else {
            // Update existing LP: refresh countdown if expired or missing, populate image if missing
            const needCountdownRefresh = !existingLp.countdownEnd || existingLp.countdownEnd < new Date();
            const needImage = !existingLp.heroImageUrl && prodImg;

            const updateData = {};
            if (needCountdownRefresh) updateData.countdownEnd = futureCountdown;
            if (needImage) updateData.heroImageUrl = prodImg;
            if (!existingLp.isActive) updateData.isActive = true;

            if (Object.keys(updateData).length > 0) {
                await prisma.landingPage.update({
                    where: { id: existingLp.id },
                    data: updateData
                });
                updatedCount++;
            }

            // Ensure product is linked
            const alreadyLinked = (existingLp.products || []).some(lpp => lpp.productId === p.id);
            if (!alreadyLinked) {
                await prisma.landingPageProduct.create({
                    data: {
                        landingPageId: existingLp.id,
                        productId: p.id,
                        sortOrder: 0
                    }
                });
            }
        }
    }

    // Also refresh countdown on any alias landing pages (e.g. massage-gun, ven-dens-powerbank, etc.)
    const allLps = await prisma.landingPage.findMany();
    let aliasRefreshed = 0;
    for (const lp of allLps) {
        if (!lp.countdownEnd || lp.countdownEnd < new Date()) {
            await prisma.landingPage.update({
                where: { id: lp.id },
                data: { countdownEnd: futureCountdown, isActive: true }
            });
            aliasRefreshed++;
        }
    }

    console.log("=== COMPLETED ===");
    console.log(`Brand New LPs Created: ${createdCount}`);
    console.log(`Existing LPs Refreshed: ${updatedCount}`);
    console.log(`Alias/Other LPs Countdown Refreshed: ${aliasRefreshed}`);

    const finalLpCount = await prisma.landingPage.count();
    console.log(`Total Landing Pages in Database: ${finalLpCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
