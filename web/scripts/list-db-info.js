const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const totalProducts = await prisma.product.count();
    console.log(`Total Products: ${totalProducts}`);

    const products = await prisma.product.findMany({
        select: { id: true, name: true, slug: true, price: true, isActive: true }
    });
    console.log(products);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
