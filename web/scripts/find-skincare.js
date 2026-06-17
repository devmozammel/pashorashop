const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.subcategoryItem.findMany({
        where: {
            OR: [
                { name: { contains: "wash" } },
                { name: { contains: "care" } },
                { name: { contains: "groom" } }
            ]
        },
        include: {
            group: {
                include: {
                    category: true
                }
            }
        }
    });
    console.log(JSON.stringify(items, null, 2));
}

main()
    .finally(() => prisma.$disconnect());
