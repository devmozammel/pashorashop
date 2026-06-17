const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const primaryProductId = "cmqi5v23g000214bqh0w1uiiz"; // Park Avenue Harmony
    const conquerProductId = "cmqi0dagl0002rh6zt42uhb73"; // Park Avenue Conquer
    const savannaProductId = "cmqhybw2t00023jpkml8ob7b3"; // Park Avenue Savanna Fresh

    const slug = "park-avenue-harmony-eau-de-parfum-for-men-100ml";

    // 1. Delete existing landing page products link if any
    const lp = await prisma.landingPage.findUnique({
        where: { slug }
    });

    if (lp) {
        await prisma.landingPageProduct.deleteMany({
            where: { landingPageId: lp.id }
        });
        console.log("Cleared existing products on the landing page.");
    }

    // 2. Upsert the Landing Page details
    const updatedLp = await prisma.landingPage.upsert({
        where: { slug },
        update: {
            title: "Park Avenue Harmony Eau De Parfum For Men 100ml",
            heroTitle: "রাজকীয় সুবাসে নিজেকে অনন্য করে তুলুন - Park Avenue Harmony",
            heroDescription: "পার্ক এভিনিউ হারমনি এর রিফ্রেশিং নোটস ও মেলোডিয়াস ব্লেন্ড আপনাকে দিনভর রাখবে ফ্রেশ, আত্মবিশ্বাসী ও আকর্ষণীয়। ১০০% অরিজিনাল লং-লাস্টিং প্রিমিয়াম সুগন্ধি এখন স্পেশাল অফার প্রাইসে!",
            heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1781706214/authentic-bazar/xnihfdxsdv5mdgh8yyu1.jpg",
            heroBtn: "অর্ডার করুন এখনই",
            ctaText: "অর্ডার করুন এখনই",
            countdownEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
            discountCode: "PARK10",
            showTestimonials: true,
            testimonialsJson: JSON.stringify([
                { name: "কবির হোসেন", text: "পার্ক এভিনিউ হারমনির সুবাস দারুণ, সারাদিন স্থায়ী হয়। অফিস বা অনুষ্ঠানের জন্য পারফেক্ট।", rating: 5 },
                { name: "তানভীর আলম", text: "খুবই রিফ্রেশিং এবং প্রিমিয়াম একটা স্মেল। ১০০% অরিজিনাল প্রোডাক্ট পেয়েছি। ধন্যবাদ অথেন্টিক বাজারকে।", rating: 5 },
                { name: "সাকিব চৌধুরী", text: "যেমনটা চেয়েছিলাম তেমনটাই পেয়েছি। লং-লাস্টিং সুগন্ধ এবং প্রাইস রেঞ্জ অনুযায়ী বেস্ট পারফিউম।", rating: 5 }
            ]),
            products: {
                create: [
                    { productId: primaryProductId, sortOrder: 0 },
                    { productId: conquerProductId, sortOrder: 1 },
                    { productId: savannaProductId, sortOrder: 2 }
                ]
            }
        },
        create: {
            title: "Park Avenue Harmony Eau De Parfum For Men 100ml",
            slug: slug,
            isActive: true,
            heroTitle: "রাজকীয় সুবাসে নিজেকে অনন্য করে তুলুন - Park Avenue Harmony",
            heroDescription: "পার্ক এভিনিউ হারমনি এর রিফ্রেশিং নোটস ও মেলোডিয়াস ব্লেন্ড আপনাকে দিনভর রাখবে ফ্রেশ, আত্মবিশ্বাসী ও আকর্ষণীয়। ১০০% অরিজিনাল লং-লাস্টিং প্রিমিয়াম সুগন্ধি এখন স্পেশাল অফার প্রাইসে!",
            heroImageUrl: "https://res.cloudinary.com/dqijzckfb/image/upload/v1781706214/authentic-bazar/xnihfdxsdv5mdgh8yyu1.jpg",
            heroBtn: "অর্ডার করুন এখনই",
            ctaText: "অর্ডার করুন এখনই",
            countdownEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
            discountCode: "PARK10",
            showTestimonials: true,
            testimonialsJson: JSON.stringify([
                { name: "কবির হোসেন", text: "পার্ক এভিনিউ হারমনির সুবাস দারুণ, সারাদিন স্থায়ী হয়। অফিস বা অনুষ্ঠানের জন্য পারফেক্ট।", rating: 5 },
                { name: "তানভীর আলম", text: "খুবই রিফ্রেশিং এবং প্রিমিয়াম একটা স্মেল। ১০০% অরিজিনাল প্রোডাক্ট পেয়েছি। ধন্যবাদ অথেন্টিক বাজারকে।", rating: 5 },
                { name: "সাকিব চৌধুরী", text: "যেমনটা চেয়েছিলাম তেমনটাই পেয়েছি। লং-লাস্টিং সুগন্ধ এবং প্রাইস রেঞ্জ অনুযায়ী বেস্ট পারফিউম।", rating: 5 }
            ]),
            products: {
                create: [
                    { productId: primaryProductId, sortOrder: 0 },
                    { productId: conquerProductId, sortOrder: 1 },
                    { productId: savannaProductId, sortOrder: 2 }
                ]
            }
        }
    });

    console.log("Successfully updated/created Landing Page:", updatedLp);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
