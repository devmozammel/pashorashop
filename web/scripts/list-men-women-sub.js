const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany({
        where: {
            name: { in: ["Men", "Women"] }
        },
        include: {
            subcategoryGroups: {
                include: {
                    items: true
                }
            }
        }
    });
    categories.forEach(c => {
        console.log(`Category: ${c.name}`);
        c.subcategoryGroups.forEach(g => {
            console.log(`  Group: ${g.name} (${g.id})`);
            g.items.forEach(i => {
                console.log(`    Item: ${i.name} (${i.id})`);
            });
        });
    });
}

main()
    .finally(() => prisma.$disconnect());
