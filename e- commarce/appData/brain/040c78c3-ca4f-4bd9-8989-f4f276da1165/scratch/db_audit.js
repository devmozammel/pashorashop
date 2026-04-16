const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.count();
    const categories = await prisma.category.count();
    const subGroups = await prisma.subcategoryGroup.count();
    const subItems = await prisma.subcategoryItem.count();
    const flashSales = await prisma.flashSale.count({ where: { isActive: true } });
    
    const sampleProducts = await prisma.product.findMany({
        take: 5,
        select: { name: true, images: true, productImages: { take: 1 } }
    });

    console.log({
        counts: { products, categories, subGroups, subItems, flashSales },
        sampleProducts
    });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
