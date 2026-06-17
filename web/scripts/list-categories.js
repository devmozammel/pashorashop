const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany({
        include: {
            subcategoryGroups: {
                include: {
                    items: true
                }
            }
        }
    });
    console.log(JSON.stringify(categories, null, 2));
}

main()
    .finally(() => prisma.$disconnect());
