const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const DEFAULT_SETTINGS = {
        siteName: "Authentic Bazar",
        currencySymbol: "৳",
        supportEmail: "support@authenticbazar.shop",
        whatsapp: "8801600995299",
        address: "Dhaka, Bangladesh",
        deliveryFeeInside: 70, // 70 TK inside Dhaka
        deliveryFeeOutside: 130, // 130 TK outside Dhaka
        free_shipping_threshold: 2000,
        enable_topbar: "true",
        enable_sticky_header: "true"
    };

    const updated = await prisma.siteSetting.upsert({
        where: { key: 'store_settings' },
        update: { value: JSON.stringify(DEFAULT_SETTINGS), type: 'json' },
        create: { key: 'store_settings', value: JSON.stringify(DEFAULT_SETTINGS), type: 'json' }
    });
    console.log("Upserted store_settings in DB:", updated.value);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
