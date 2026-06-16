const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const lps = await prisma.landingPage.findMany({
        include: {
            products: {
                include: {
                    product: true
                }
            }
        }
    });
    console.log("Existing Landing Pages:", JSON.stringify(lps, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
