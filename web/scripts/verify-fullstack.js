const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkFullStack() {
    console.log("=== FULL-STACK VERIFICATION CHECK ===");

    // 1. Check Database Categories
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            subcategoryGroups: {
                include: {
                    items: true
                }
            }
        },
        orderBy: [{ sortOrder: 'asc' }]
    });

    console.log(`Total Active Categories in DB: ${categories.length}`);
    categories.forEach(c => {
        console.log(`- Category: "${c.name}" (Slug: ${c.slug}, Homepage: ${c.showOnHomepage}, Topbar: ${c.showInTopbar})`);
        if (c.subcategoryGroups.length > 0) {
            c.subcategoryGroups.forEach(g => {
                console.log(`   └─ Sub Group: "${g.name}" (Items: ${g.items.map(i => i.name).join(", ") || 'None'})`);
            });
        }
    });

    // 2. Check Phones & Gadgets specifically
    const phones = categories.find(c => c.slug === "phones-gadgets");
    if (phones) {
        console.log("\n✅ SUCCESS: 'Phones & Gadgets' category found in Database with:");
        console.log(`   - Groups Count: ${phones.subcategoryGroups.length}`);
        const totalItems = phones.subcategoryGroups.reduce((acc, g) => acc + g.items.length, 0);
        console.log(`   - Sub Items Count: ${totalItems}`);
    } else {
        console.log("\n❌ ERROR: 'Phones & Gadgets' category missing!");
    }
}

checkFullStack()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
