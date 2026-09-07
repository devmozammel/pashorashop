const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Find the target product Q87
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: "high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset" },
                { name: { contains: "Q87" } }
            ]
        }
    });

    if (!product) {
        console.error("Q87 Product not found!");
        process.exit(1);
    }

    console.log("Found product:", product.id, product.name);

    const slugs = [
        "high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset",
        "q87-wireless-earbuds"
    ];

    const lpData = {
        title: "Q87 Wireless Earbuds Easy Touch Control | Authentic Bazar",
        heroTitle: "Q87 TWS প্রিমিয়াম রেট্রো ওয়্যারলেস ইয়ারবাডস",
        heroDescription: "Bluetooth 5.3 • Hi-Fi Stereo অডিও • Digital Battery Display • Easy Touch Control • লো-লেটেন্সি গেমিং ও আউটডোর ইউজের জন্য সেরা ইয়ারবাডস!",
        heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1786394550/authentic-bazar/otebreh5xm44f5ox27cc.jpg",
        heroBtn: "অর্ডার করুন এখনই",
        ctaText: "অর্ডার করুন এখনই",
        discountCode: "AUTHENTIC10",
        countdownEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        isActive: true,
        showTestimonials: true,
        featuresJson: JSON.stringify([
            { icon: "📷", title: "Retro Camera Design", desc: "ক্লাসিক ভিন্টেজ ক্যামেরা থিম ও লাক্সারি টেক্সচার ফিনিশ" },
            { icon: "🎧", title: "Hi-Fi Stereo Sound", desc: "নিখুঁত, ক্রিস্টাল ক্লিয়ার ও খাঁটি ডিটেইল্ড সাউন্ড কোয়ালিটি" },
            { icon: "📶", title: "Bluetooth 5.3", desc: "দ্রুততম পেয়ারিং, স্ট্যাবল কানেকশন ও লো-লেটেন্সি অডিও" },
            { icon: "🔋", title: "Digital Display", desc: "চার্জিং কেসে রিয়েল-টাইম ব্যাটারি পার্সেন্টেজ ডিসপ্লে" },
            { icon: "🖐️", title: "Easy Touch Control", desc: "সহজ স্পর্শেই কল রিসিভ, মিউজিক প্লে/পজ ও ট্র্যাক পরিবর্তন" },
            { icon: "👂", title: "Ergonomic Comfort Fit", desc: "দীর্ঘসময় ব্যবহারে কান ব্যথার ঝামেলামুক্ত ও লাইটওয়েট" }
        ]),
        testimonialsJson: JSON.stringify([
            { name: "রাফসান আহমেদ", text: "Q87 ইয়ারবাডস কিনে অনেক খুশি! ক্যামেরা শেপের রেট্রো ডিজাইনটা একদম ইউনিক। সাউন্ড কোয়ালিটি দুর্দান্ত, আর ডিজিটাল ডিসপ্লেতে ব্যাটারি দেখা যায়।", rating: 5, city: "ঢাকা" },
            { name: "সুমাইয়া আক্তার", text: "রেট্রো ডিজাইনটা দেখতে ভিষণ প্রিমিয়াম লাগে। অডিও কোয়ালিটি এবং টাচ কন্ট্রোল সুপার স্মুথ! ক্যাশ অন ডেলিভারিতে দ্রুত পেয়েছি।", rating: 5, city: "চট্টগ্রাম" },
            { name: "তানভীর হাসান", text: "লো-লেটেন্সি মোডের কারণে গেমিং ও ভিডিও দেখার সময় কোনো সাউন্ড ডিলে হয় না। এই বাজেটে সেরা ইয়ারবাডস!", rating: 5, city: "সিলেট" }
        ])
    };

    for (const slug of slugs) {
        const existing = await prisma.landingPage.findUnique({ where: { slug } });
        if (existing) {
            await prisma.landingPage.update({
                where: { slug },
                data: {
                    ...lpData,
                    products: {
                        deleteMany: {},
                        create: [{ productId: product.id, sortOrder: 0 }]
                    }
                }
            });
            console.log(`Updated Landing Page for slug: ${slug}`);
        } else {
            await prisma.landingPage.create({
                data: {
                    ...lpData,
                    slug,
                    products: {
                        create: [{ productId: product.id, sortOrder: 0 }]
                    }
                }
            });
            console.log(`Created Landing Page for slug: ${slug}`);
        }
    }

    console.log("Q87 Landing Pages successfully set up!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
