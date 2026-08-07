const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const slugs = [
        "cyxg-q10-wireless-earbuds-bluetooth-5-49-tws-earphones",
        "ven-dens-20000mah-22-5w-super-fast-charging-power-bank-with-built-in-cables-digital-display",
        "q86-tws-retro-true-wireless-stereo-earbuds-bluetooth-5-3-hi-fi-audio"
    ];

    const products = await prisma.product.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, shortDesc: true }
    });

    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
