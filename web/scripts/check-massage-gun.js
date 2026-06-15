const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findUnique({
        where: { id: "cmqffvhqz0002zqgxvzaffkl4" },
        include: { productImages: true }
    });
    console.log(product);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
