const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LPS = [
    {
        slug: "cyxg-q10-earbuds",
        title: "CYXG Q10 Wireless Earbuds | Best Price Bangladesh",
        heroTitle: "CYXG Q10 : প্রিমিয়াম ওয়্যারলেস ইয়ারবাডস",
        heroDescription: "Bluetooth 5.49 TWS ইয়ারফোন • LED ডিসপ্লে • নয়েজ ক্যান্সেলিং • HiFi সাউন্ড • ডিজিটাল চার্জিং কেস সহ।",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmr3qylnu0002d4sd2mgggxy9",
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1783011267/authentic-bazar/c1jridc4m4ym6sssdmri.jpg",
        countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        testimonials: [
            { name: "রাফসান আহমেদ", text: "Q10 ইয়ারবাডস কিনে অনেক খুশি। সাউন্ড কোয়ালিটি দারুণ, LED ডিসপ্লেতে ব্যাটারি লেভেল দেখা যায়। দ্রুত ডেলিভারি।", rating: 5, city: "ঢাকা" },
            { name: "সুমাইয়া খানম", text: "নয়েজ ক্যান্সেলিং ফিচারটা চমৎকার। ব্লুটুথ কানেকশন একদম স্টেবল। দামে এত ভালো আর পাইনি।", rating: 5, city: "রাজশাহী" },
            { name: "তানভীর ইসলাম", text: "বাজারে এত কম দামে এই কোয়ালিটির ইয়ারবাডস পাওয়া সত্যিই ভাগ্যের ব্যাপার। রেকমেন্ড করব সবাইকে।", rating: 5, city: "সিলেট" },
        ],
        features: [
            { icon: "🎵", title: "HiFi সাউন্ড", desc: "স্টুডিও মানের অডিও অভিজ্ঞতা" },
            { icon: "📡", title: "Bluetooth 5.49", desc: "দ্রুত ও স্ট্যাবল কানেকশন" },
            { icon: "💡", title: "LED ডিসপ্লে", desc: "রিয়েল-টাইম ব্যাটারি স্ট্যাটাস" },
            { icon: "🔇", title: "নয়েজ ক্যান্সেলিং", desc: "বাইরের শব্দ ব্লক করে" },
        ],
    },
    {
        slug: "q86-retro-earbuds",
        title: "Q86 TWS Retro Earbuds | Best Deal Bangladesh",
        heroTitle: "Q86 Retro TWS : রেট্রো স্টাইলে HiFi অডিও",
        heroDescription: "Bluetooth 5.3 • True Wireless Stereo • HiFi Audio • রেট্রো ডিজাইন • চারটি আকর্ষণীয় রঙে পাওয়া যাচ্ছে।",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmqy6yoe100028y0aguuczg3g",
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1785219665/authentic-bazar/sw5xogw4hgyzroh7yqek.jpg",
        countdownEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        testimonials: [
            { name: "সাকিব হাসান", text: "Q86 এর রেট্রো ডিজাইনটা একদম ইউনিক। অফিসে পরে গেলে সবাই জিজ্ঞেস করে কোথা থেকে কিনেছি। সাউন্ডও অসাধারণ।", rating: 5, city: "চট্টগ্রাম" },
            { name: "মিথিলা রহমান", text: "Black কালারটা নিয়েছি, দেখতে প্রিমিয়াম লাগে। ব্যাটারি ব্যাকআপ ভালো। প্যাকেজিং সুন্দর ছিল।", rating: 5, city: "ঢাকা" },
            { name: "শাকিল আহমেদ", text: "HiFi সাউন্ড মানে এটাই বোঝায়। বেস একদম পরিষ্কার, ভোকাল ক্লিয়ার। দামে অসাধারণ ডিল।", rating: 5, city: "খুলনা" },
        ],
        features: [
            { icon: "🎨", title: "রেট্রো ডিজাইন", desc: "৪টি স্টাইলিশ রঙে পাওয়া যায়" },
            { icon: "🎶", title: "True Stereo", desc: "বাম ডান পার্ফেক্ট ব্যালেন্স" },
            { icon: "📶", title: "Bluetooth 5.3", desc: "স্ট্যাবল ও লো লেটেন্সি" },
            { icon: "🔋", title: "লং ব্যাটারি", desc: "দীর্ঘ সময় মিউজিক উপভোগ" },
        ],
    },
    {
        slug: "ven-dens-powerbank",
        title: "Ven-Dens 20000mAh Power Bank | Best Price BD",
        heroTitle: "Ven-Dens 20000mAh : সুপার ফাস্ট চার্জিং পাওয়ার ব্যাংক",
        heroDescription: "22.5W সুপার ফাস্ট চার্জিং • বিল্ট ইন তিনটি ক্যাবল (Lightning, Type-C, Micro) • ডিজিটাল ডিসপ্লে • ২০০০০ mAh বিশাল ব্যাটারি।",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmqy84q6i0002iy7p42z03m5d",
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1782677292/authentic-bazar/hxpvxmv2mbfj0n46mjxf.jpg",
        countdownEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        testimonials: [
            { name: "নাজমুল হাসান", text: "পাওয়ার ব্যাংকটা দারুণ! বিল্ট ইন তিনটি ক্যাবল থাকায় আলাদা ক্যাবল নিতে হয় না। ডিজিটাল ডিসপ্লেতে চার্জ দেখা যায়।", rating: 5, city: "ঢাকা" },
            { name: "ফারজানা আক্তার", text: "22.5W ফাস্ট চার্জিং মানে আসলেই দ্রুত। আমার ফোন অনেক দ্রুত চার্জ হচ্ছে। ভালো প্রোডাক্ট।", rating: 5, city: "ময়মনসিংহ" },
            { name: "ইমন চৌধুরী", text: "ট্র্যাভেলের জন্য পারফেক্ট। তিনটি ক্যাবল বিল্ট ইন, ফোন ও ট্যাবলেট দুটোই চার্জ দেওয়া যায়। দামে বেশ ভালো।", rating: 5, city: "কুমিল্লা" },
        ],
        features: [
            { icon: "⚡", title: "22.5W ফাস্ট চার্জ", desc: "অতি দ্রুত চার্জিং ক্ষমতা" },
            { icon: "🔌", title: "৩টি বিল্ট ইন ক্যাবল", desc: "সব ডিভাইসের জন্য উপযুক্ত" },
            { icon: "📊", title: "ডিজিটাল ডিসপ্লে", desc: "সঠিক ব্যাটারি লেভেল দেখুন" },
            { icon: "🔋", title: "২০০০০০ mAh", desc: "একাধিক ডিভাইস চার্জ করুন" },
        ],
    },
    {
        slug: "high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset",
        title: "Q87 Wireless Earbuds Easy Touch Control | Authentic Bazar",
        heroTitle: "Q87 TWS প্রিমিয়াম রেট্রো ওয়্যারলেস ইয়ারবাডস",
        heroDescription: "Bluetooth 5.3 • Hi-Fi Stereo অডিও • Digital Battery Display • Easy Touch Control • লো-লেটেন্সি গেমিং ও আউটডোর ইউজের জন্য সেরা ইয়ারবাডস!",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmsnpa0d5000c7don7jeulyue",
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
        slug: "frb-n-26-wireless-gaming-neckband-600h-standby-bluetooth-5-4-led-display",
        title: "FRB N-26 Wireless Gaming Neckband 600H Standby | Authentic Bazar",
        heroTitle: "FRB N-26 ওয়্যারলেস গেমিং নেক ব্যান্ড — 600H স্ট্যান্ডবাই",
        heroDescription: "Bluetooth 5.4 • 600 Hours Standby Time • LED Battery Display • Low Latency Gaming Mode • TF Card সাপোর্টেড ও Type-C ফাস্ট চার্জিং!",
        ctaText: "এখনই অর্ডার করুন",
        productId: "cmr593n1d0002b2dl6jtv7yn8",
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
    },
];

async function main() {
    for (const lp of LPS) {
        // Delete existing
        const existing = await prisma.landingPage.findUnique({ where: { slug: lp.slug } });
        if (existing) {
            await prisma.landingPageProduct.deleteMany({ where: { landingPageId: existing.id } });
            await prisma.landingPage.delete({ where: { slug: lp.slug } });
            console.log(`Deleted existing: ${lp.slug}`);
        }

        // Create new
        const created = await prisma.landingPage.create({
            data: {
                title: lp.title,
                slug: lp.slug,
                isActive: true,
                heroTitle: lp.heroTitle,
                heroDescription: lp.heroDescription,
                ctaText: lp.ctaText,
                heroImageUrl: lp.heroImageUrl,
                countdownEnd: lp.countdownEnd,
                showTestimonials: true,
                testimonialsJson: JSON.stringify(lp.testimonials),
                featuresJson: JSON.stringify(lp.features),
                products: {
                    create: [{ productId: lp.productId, sortOrder: 0 }]
                }
            }
        });

        console.log(`✅ Created: /lp/${lp.slug} (ID: ${created.id})`);
    }

    console.log("\n🎉 All 3 landing pages created successfully!\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
