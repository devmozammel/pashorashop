const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_LPS = [
    {
        slugs: [
            "q87-wireless-earbuds",
            "high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset"
        ],
        title: "Q87 Wireless Earbuds Easy Touch Control | Authentic Bazar",
        heroTitle: "Q87 TWS প্রিমিয়াম রেট্রো ওয়্যারলেস ইয়ারবাডস",
        heroDescription: "Bluetooth 5.3 • Hi-Fi Stereo অডিও • Digital Battery Display • Easy Touch Control • লো-লেটেন্সি গেমিং ও আউটডোর ইউজের জন্য সেরা ইয়ারবাডস!",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmsnpa0d5000c7don7jeulyue", // Q87 Product ID
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1786394550/authentic-bazar/otebreh5xm44f5ox27cc.jpg",
        countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        testimonials: [
            { name: "রাফসান আহমেদ", text: "Q87 ইয়ারবাডস কিনে অনেক খুশি। সাউন্ড কোয়ালিটি দারুণ, ডিজিটাল ডিসপ্লেতে ব্যাটারি দেখা যায়। দ্রুত ডেলিভারি পেয়েছি।", rating: 5, city: "ঢাকা" },
            { name: "সুমাইয়া আক্তার", text: "রেট্রো ডিজাইনটা দেখতে প্রিমিয়াম লাগে। অডিও কোয়ালিটি এবং টাচ কন্ট্রোল সুপার স্মুথ!", rating: 5, city: "চট্টগ্রাম" },
            { name: "তানভীর হাসান", text: "লো-লেটেন্সি মোডের কারণে গেমিং ও গান শোনার অভিজ্ঞতা দুর্দান্ত। এই দামে সেরা ইয়ারবাডস।", rating: 5, city: "সিলেট" }
        ],
        features: [
            { icon: "🎧", title: "Hi-Fi Stereo", desc: "নিখুঁত ও ক্লিয়ার ডিটেইল্ড সাউন্ড কোয়ালিটি" },
            { icon: "📶", title: "Bluetooth 5.3", desc: "দ্রুত ও স্ট্যাবল কানেকশন ও লো-লেটেন্সি" },
            { icon: "🔋", title: "Digital Display", desc: "চার্জিং কেসে ব্যাটারি লেভেল পার্সেন্টেজে দৃশ্যমান" },
            { icon: "🖐️", title: "Easy Touch", desc: "সহজেই কল, মিউজিক ও ভলিউম কন্ট্রোল" }
        ]
    },
    {
        slugs: [
            "frb-n-26-gaming-neckband",
            "frb-n-26-wireless-gaming-neckband-600h-standby-bluetooth-5-4-led-display"
        ],
        title: "FRB N-26 Wireless Gaming Neckband 600H Standby | Authentic Bazar",
        heroTitle: "FRB N-26 ওয়্যারলেস গেমিং নেক ব্যান্ড — 600H স্ট্যান্ডবাই",
        heroDescription: "Bluetooth 5.4 • 600 Hours Standby Time • LED Battery Display • Low Latency Gaming Mode • TF Card সাপোর্টেড ও Type-C ফাস্ট চার্জিং!",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmr593n1d0002b2dl6jtv7yn8", // FRB N-26 Product ID
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1783102103/authentic-bazar/kjym2f5yjciixw97nfcs.jpg",
        countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        testimonials: [
            { name: "সাকিব হাসান", text: "FRB N-26 এর ব্যাটারি ব্যাকআপ এক কথায় অবিশ্বাস্য! চার্জ দেওয়ার ঝামেলাই নেই। সাউন্ড কোয়ালিটিও অনেক জোস।", rating: 5, city: "ঢাকা" },
            { name: "মেহেদী হাসান", text: "গেমিং মোডে কোনো সাউন্ড ডিলে নেই, পিস জিম ও রানিং এর জন্য বেস্ট নেকব্যান্ড। LED ডিসপ্লে অনেক কাজে দেয়।", rating: 5, city: "খুলনা" },
            { name: "আরিফ রহমান", text: "মেমোরি কার্ড ঢুকিয়ে সরাসরি গান শোনার অপশনটা খুব ভালো লেগেছে। ফাস্ট চার্জিং ও বিল্ড কোয়ালিটি প্রিমিয়াম।", rating: 5, city: "রাজশাহী" }
        ],
        features: [
            { icon: "🔋", title: "600H Standby", desc: "দীর্ঘ সময় চার্জ ব্যাকআপ ও গান শোনার সুবিধা" },
            { icon: "🎮", title: "Gaming Mode", desc: "আল্ট্রা লো-লেটেন্সি অডিও গেমিং এক্সপেরিয়েন্স" },
            { icon: "📊", title: "LED Display", desc: "স্পষ্ট ব্যাটারি পার্সেন্টেজ ডিসপ্লে" },
            { icon: "💾", title: "TF Card & Type-C", desc: "মেমোরি কার্ড সাপোর্ট ও টাইপ-সি ফাস্ট চার্জিং" }
        ]
    }
];

async function main() {
    console.log("🚀 Creating Landing Pages for Q87 Earbuds and FRB N-26 Neckband...\n");

    for (const item of NEW_LPS) {
        for (const slug of item.slugs) {
            // Delete existing landing page if any with same slug
            const existing = await prisma.landingPage.findUnique({ where: { slug } });
            if (existing) {
                await prisma.landingPageProduct.deleteMany({ where: { landingPageId: existing.id } });
                await prisma.landingPage.delete({ where: { slug } });
                console.log(`🗑️ Deleted existing LP: /lp/${slug}`);
            }

            // Create Landing Page
            const created = await prisma.landingPage.create({
                data: {
                    title: item.title,
                    slug: slug,
                    isActive: true,
                    heroTitle: item.heroTitle,
                    heroDescription: item.heroDescription,
                    ctaText: item.ctaText,
                    heroImageUrl: item.heroImageUrl,
                    countdownEnd: item.countdownEnd,
                    showTestimonials: true,
                    testimonialsJson: JSON.stringify(item.testimonials),
                    featuresJson: JSON.stringify(item.features),
                    products: {
                        create: [{ productId: item.productId, sortOrder: 0 }]
                    }
                }
            });

            console.log(`✅ Created Landing Page: /lp/${slug} (ID: ${created.id})`);
        }
    }

    console.log("\n🎉 Landing pages successfully created in Database!");
}

main()
    .catch((err) => {
        console.error("❌ Error creating landing pages:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
