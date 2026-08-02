const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding modern categories and subcategories...");

    // 1. Phones & Gadgets Main Category
    const phonesCategory = await prisma.category.upsert({
        where: { slug: "phones-gadgets" },
        update: {
            name: "Phones & Gadgets",
            isActive: true,
            showInMegaMenu: false,
            showInTopbar: false,
            showOnHomepage: true,
            sortOrder: 1,
        },
        create: {
            name: "Phones & Gadgets",
            slug: "phones-gadgets",
            image: "",
            isActive: true,
            showInMegaMenu: false,
            showInTopbar: false,
            showOnHomepage: true,
            sortOrder: 1,
        }
    });

    console.log("Category created/updated:", phonesCategory.name);

    // Group 1: Smartphones & Phones
    const phonesGroup = await prisma.subcategoryGroup.upsert({
        where: { slug: "phones-smartphones" },
        update: {
            name: "Smartphones",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 1,
        },
        create: {
            name: "Smartphones",
            slug: "phones-smartphones",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 1,
        }
    });

    const phoneItems = ["iPhones", "Android Phones", "Feature Phones"];
    for (let i = 0; i < phoneItems.length; i++) {
        const itemName = phoneItems[i];
        const itemSlug = `phones-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await prisma.subcategoryItem.upsert({
            where: { slug: itemSlug },
            update: { name: itemName, groupId: phonesGroup.id, isActive: true },
            create: { name: itemName, slug: itemSlug, groupId: phonesGroup.id, isActive: true, sortOrder: i }
        });
    }

    // Group 2: Mobile Accessories
    const accGroup = await prisma.subcategoryGroup.upsert({
        where: { slug: "phones-mobile-accessories" },
        update: {
            name: "Mobile Accessories",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 2,
        },
        create: {
            name: "Mobile Accessories",
            slug: "phones-mobile-accessories",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 2,
        }
    });

    const accItems = ["Phone Cases & Covers", "Chargers & Cables", "Power Banks", "Earphones & TWS"];
    for (let i = 0; i < accItems.length; i++) {
        const itemName = accItems[i];
        const itemSlug = `acc-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await prisma.subcategoryItem.upsert({
            where: { slug: itemSlug },
            update: { name: itemName, groupId: accGroup.id, isActive: true },
            create: { name: itemName, slug: itemSlug, groupId: accGroup.id, isActive: true, sortOrder: i }
        });
    }

    // Group 3: Smart Devices
    const smartGroup = await prisma.subcategoryGroup.upsert({
        where: { slug: "phones-smart-devices" },
        update: {
            name: "Smart Devices",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 3,
        },
        create: {
            name: "Smart Devices",
            slug: "phones-smart-devices",
            categoryId: phonesCategory.id,
            isActive: true,
            sortOrder: 3,
        }
    });

    const smartItems = ["Smartwatches", "Bluetooth Speakers", "Wireless Headphones"];
    for (let i = 0; i < smartItems.length; i++) {
        const itemName = smartItems[i];
        const itemSlug = `smart-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await prisma.subcategoryItem.upsert({
            where: { slug: itemSlug },
            update: { name: itemName, groupId: smartGroup.id, isActive: true },
            create: { name: itemName, slug: itemSlug, groupId: smartGroup.id, isActive: true, sortOrder: i }
        });
    }

    // Update existing categories to show on homepage
    const existingCats = await prisma.category.findMany({ where: { isActive: true } });
    for (const cat of existingCats) {
        await prisma.category.update({
            where: { id: cat.id },
            data: { showOnHomepage: true }
        });
    }

    console.log("Seeding finished successfully!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
