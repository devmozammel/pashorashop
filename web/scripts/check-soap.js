const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        where: { name: { contains: "Perfume" } },
        include: {
            category: true,
            subcategoryGroup: true,
            subcategoryItem: true
        }
    });
    console.log(JSON.stringify(product, null, 2));
}

main()
    .finally(() => prisma.$disconnect());
