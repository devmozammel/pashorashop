const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("=== CREATING LANDING PAGE FOR FOLDABLE ELECTRIC KETTLE ===");

    const productId = "cmw10iak10002104yy0bv8c09";
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { productImages: true }
    });

    if (!product) {
        console.error("Kettle product not found!");
        process.exit(1);
    }

    const heroImg = product.productImages?.[0]?.url || "https://res.cloudinary.com/fyxpjjdd/image/upload/v1793729600/pashora-shop/jv5qolvnmcl3v9yeirbv.jpg";
    const countdown = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days

    const features = [
        { icon: "🧳", title: "ফোল্ডেবল ও সহজে বহনযোগ্য", desc: "সহজেই ভাঁজ করে যেকোনো হ্যান্ডব্যাগ বা ট্রাভেল লাগেজে বহন করা যায়" },
        { icon: "⚡", title: "দ্রুত পানি ফুটানো (Fast 600W)", desc: "শক্তিশালী ৬০০ ওয়াট হিটিং কয়েল, মাত্র ৩-৫ মিনিটে চা বা কফির গরম পানি প্রস্তুত" },
        { icon: "🛡️", title: "ফুড-গ্রেড বেবি সিলিকন", desc: "১০০% নিরাপদ, গন্ধহীন ও উচ্চ তাপে বিষাক্ত উপাদানমুক্ত ফুড গ্রেড উপাদান" },
        { icon: "🔌", title: "ড্রাই-বয়েল ও অটো শাট-অফ", desc: "পানি ফুটে গেলে অথবা পানি না থাকলে নিজে থেকেই বন্ধ হয়ে নিরাপদ রাখে" },
        { icon: "☕", title: "ভ্রমণ ও দৈনন্দিন ব্যবহার", desc: "ট্যুর, অফিস বা বাসায় চা, কফি, বেবি ফুড ও ইনস্ট্যান্ট নুডলসের জন্য আদর্শ" },
        { icon: "🚚", title: "ক্যাশ অন ডেলিভারি সুবিধা", desc: "সারা বাংলাদেশে ডেলিভারি ম্যানের সামনে পণ্য দেখে চেক করে মূল্য পরিশোধ করুন" }
    ];

    const testimonials = [
        { name: "তানজিম হোসেন", city: "ঢাকা", text: "ট্যুরে যাওয়ার জন্য একদম পারফেক্ট একটি গ্যাজেট! ভাঁজ করে ব্যাগের এক কোনায় রেখে দেওয়া যায়। ৩ মিনিটে পানি ফুটে যায়, চা বানাতে দারুণ কাজ দিচ্ছে।", rating: 5 },
        { name: "ফারহানা করিম", city: "চট্টগ্রাম", text: "বেবিকে নিয়ে ট্রাভেল করার সময় গরম পানির খুব দরকার হয়। এই কেটলিটা নেওয়ার পর থেকে কোনো চিন্তা নেই। ফুড-গ্রেড সিলিকন হওয়ায় নিশ্চিন্তে ব্যবহার করছি।", rating: 5 },
        { name: "মাহমুদুল হাসান", city: "সিলেট", text: "যেমন ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। চমৎকার ফিনিশিং এবং হ্যান্ডেল গ্রিপ আরামদায়ক। ক্যাশ অন ডেলিভারিতে চেক করে নিয়েছি। ধন্যবাদ পাশোরা শপ।", rating: 5 },
        { name: "সাব্বির আহমেদ", city: "রাজশাহী", text: "আমার দেখা অন্যতম সেরা ট্রাভেল গ্যাজেট। ব্যাগে একটুও জায়গা নেয় না, প্লাগ ইন করলেই দ্রুত গরম পানি তৈরি। ১০০% রেকমেন্ডেড।", rating: 5 }
    ];

    const lpSlugs = [
        product.slug, // "foldable-electric-travel-kettle-portable-water-heater"
        "foldable-electric-kettle"
    ];

    for (const slug of lpSlugs) {
        const lpData = {
            title: "ফোল্ডেবল ইলেকট্রিক ট্রাভেল কেটলি পোর্টেবল ওয়াটার হিটার | বিশেষ ছাড়",
            slug: slug,
            isActive: true,
            heroTitle: "ফোল্ডেবল ইলেকট্রিক ট্রাভেল কেটলি ও পোর্টেবল ওয়াটার হিটার — মেগা অফার!",
            heroDescription: "ঘরে, অফিসে কিংবা ভ্রমণে মাত্র ৩-৫ মিনিটে গরম পানি, চা ও কফি তৈরি করুন। ফোল্ডেবল ও লাইটওয়েট ডিজাইন, সহজে ভাঁজ করে ব্যাগে রাখা যায়। ফুড-গ্রেড সিলিকন ও অটো শাট-অফ সুবিধা সহ আজই অর্ডার করুন!",
            heroBtn: "অর্ডার করুন এখনই",
            heroLink: `/lp/${slug}`,
            heroImageUrl: heroImg,
            ctaText: "অর্ডার করুন এখনই",
            countdownEnd: countdown,
            discountCode: "KETTLE10",
            showTestimonials: true,
            testimonialsJson: JSON.stringify(testimonials),
            featuresJson: JSON.stringify(features)
        };

        const existing = await prisma.landingPage.findUnique({
            where: { slug },
            include: { products: true }
        });

        let lpRecord;
        if (existing) {
            lpRecord = await prisma.landingPage.update({
                where: { slug },
                data: lpData
            });
            console.log(`[UPDATED] Landing Page for slug: /lp/${slug}`);
        } else {
            lpRecord = await prisma.landingPage.create({
                data: lpData
            });
            console.log(`[CREATED] Landing Page for slug: /lp/${slug}`);
        }

        // Link product to landing page
        const linked = await prisma.landingPageProduct.findFirst({
            where: {
                landingPageId: lpRecord.id,
                productId: product.id
            }
        });

        if (!linked) {
            await prisma.landingPageProduct.create({
                data: {
                    landingPageId: lpRecord.id,
                    productId: product.id,
                    sortOrder: 0
                }
            });
            console.log(`[LINKED] Product ${product.name} to LP /lp/${slug}`);
        }
    }

    console.log("=== COMPLETED CREATING KETTLE LANDING PAGES ===");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
