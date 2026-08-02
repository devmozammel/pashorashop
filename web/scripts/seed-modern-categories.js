const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_CATEGORIES = [
    {
        name: "Beauty & Skincare",
        slug: "beauty-skincare",
        showInTopbar: false,
        showInMegaMenu: false,
        showOnHomepage: true,
        sortOrder: 2,
        groups: [
            {
                name: "Skincare",
                slug: "beauty-skincare-care",
                items: ["Face Serums", "Sunscreen", "Moisturizers", "Cleansers"]
            },
            {
                name: "Makeup",
                slug: "beauty-makeup",
                items: ["Lipsticks", "Foundations", "Eye Makeup"]
            },
            {
                name: "Hair Care",
                slug: "beauty-haircare",
                items: ["Shampoos", "Hair Oils & Serums", "Conditioners"]
            }
        ]
    },
    {
        name: "Bags & Backpacks",
        slug: "bags-backpacks",
        showInTopbar: false,
        showInMegaMenu: false,
        showOnHomepage: true,
        sortOrder: 3,
        groups: [
            {
                name: "Backpacks",
                slug: "bags-backpacks-list",
                items: ["Laptop Bags", "Travel Backpacks", "College Bags"]
            },
            {
                name: "Ladies Handbags",
                slug: "bags-handbags",
                items: ["Tote Bags", "Crossbody Bags", "Clutches & Purses"]
            },
            {
                name: "Wallets & Travel",
                slug: "bags-wallets",
                items: ["Travel Luggage", "Leather Wallets", "Passport Holders"]
            }
        ]
    },
    {
        name: "Perfumes & Fragrances",
        slug: "perfumes-fragrances",
        showInTopbar: false,
        showInMegaMenu: false,
        showOnHomepage: true,
        sortOrder: 4,
        groups: [
            {
                name: "Men's Perfumes",
                slug: "perfumes-men",
                items: ["EDP Perfumes", "Body Sprays", "Pocket Perfumes"]
            },
            {
                name: "Women's Fragrances",
                slug: "perfumes-women",
                items: ["Floral Perfumes", "Body Mists", "Gift Sets"]
            },
            {
                name: "Attar & Oils",
                slug: "perfumes-attar",
                items: ["Organic Attar", "Essential Oils"]
            }
        ]
    },
    {
        name: "Gaming & PC Gear",
        slug: "gaming-pc-gear",
        showInTopbar: false,
        showInMegaMenu: false,
        showOnHomepage: true,
        sortOrder: 5,
        groups: [
            {
                name: "Peripherals",
                slug: "gaming-peripherals",
                items: ["Gaming Mice", "RGB Keyboards", "Gaming Headsets"]
            },
            {
                name: "Setup Accessories",
                slug: "gaming-accessories",
                items: ["RGB Mousepads", "Game Controllers", "Cable Organizers"]
            },
            {
                name: "Audio & Microphones",
                slug: "gaming-audio",
                items: ["Streaming Microphones", "Bluetooth Speakers"]
            }
        ]
    },
    {
        name: "Pet Care & Accessories",
        slug: "pet-care-accessories",
        showInTopbar: false,
        showInMegaMenu: false,
        showOnHomepage: true,
        sortOrder: 6,
        groups: [
            {
                name: "Cat Care",
                slug: "pet-cat-care",
                items: ["Cat Food", "Cat Litter", "Toys & Scratchers"]
            },
            {
                name: "Dog Care",
                slug: "pet-dog-care",
                items: ["Dog Food", "Leashes & Harnesses", "Dog Toys"]
            },
            {
                name: "Grooming & Beds",
                slug: "pet-grooming",
                items: ["Grooming Brushes", "Pet Shampoos", "Pet Beds"]
            }
        ]
    }
];

async function main() {
    console.log("Seeding requested 5 main categories for Topbar & Shop by Category...");

    for (const catData of NEW_CATEGORIES) {
        const category = await prisma.category.upsert({
            where: { slug: catData.slug },
            update: {
                name: catData.name,
                isActive: true,
                showInMegaMenu: catData.showInMegaMenu,
                showInTopbar: catData.showInTopbar,
                showOnHomepage: catData.showOnHomepage,
                sortOrder: catData.sortOrder,
            },
            create: {
                name: catData.name,
                slug: catData.slug,
                image: "",
                isActive: true,
                showInMegaMenu: catData.showInMegaMenu,
                showInTopbar: catData.showInTopbar,
                showOnHomepage: catData.showOnHomepage,
                sortOrder: catData.sortOrder,
            }
        });

        console.log(`Created/Updated Category: ${category.name}`);

        for (let gIdx = 0; gIdx < catData.groups.length; gIdx++) {
            const grpData = catData.groups[gIdx];
            const group = await prisma.subcategoryGroup.upsert({
                where: { slug: grpData.slug },
                update: {
                    name: grpData.name,
                    categoryId: category.id,
                    isActive: true,
                    sortOrder: gIdx + 1,
                },
                create: {
                    name: grpData.name,
                    slug: grpData.slug,
                    categoryId: category.id,
                    isActive: true,
                    sortOrder: gIdx + 1,
                }
            });

            for (let iIdx = 0; iIdx < grpData.items.length; iIdx++) {
                const itemName = grpData.items[iIdx];
                const itemSlug = `${grpData.slug}-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                await prisma.subcategoryItem.upsert({
                    where: { slug: itemSlug },
                    update: { name: itemName, groupId: group.id, isActive: true },
                    create: { name: itemName, slug: itemSlug, groupId: group.id, isActive: true, sortOrder: iIdx }
                });
            }
        }
    }

    console.log("Finished seeding 5 requested topbar & homepage categories!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
