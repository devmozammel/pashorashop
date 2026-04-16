
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "mysql://root:TeLPybMknMrmYalVKSDDyRjIlCRBEeaZ@nozomi.proxy.rlwy.net:18499/railway"
        }
    }
});

async function main() {
    console.log("Checking categories and MegaMenu status...");
    const cats = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            showInMegaMenu: true,
            _count: {
                select: { subcategoryGroups: true }
            }
        }
    });
    console.log("--- RESULTS ---");
    console.log(JSON.stringify(cats, null, 2));
    console.log("----------------");
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
