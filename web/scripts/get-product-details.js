const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findUnique({
        where: { id: "cmqi5v23g000214bqh0w1uiiz" },
        include: {
            productImages: true,
            variants: true
        }
    });
    console.log(JSON.stringify(product, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
