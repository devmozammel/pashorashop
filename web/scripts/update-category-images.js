const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const updates = [
        { slug: "men", image: "/uploads/categories/men.png" },
        { slug: "women", image: "/uploads/categories/women.png" },
        { slug: "teens", image: "/uploads/categories/teens.png" },
        { slug: "kids", image: "/uploads/categories/kids.png" },
        { slug: "sports", image: "/uploads/categories/sports.png" },
        { slug: "home-living", image: "/uploads/categories/home-living.png" }
    ];

    for (const item of updates) {
        try {
            const updated = await prisma.category.update({
                where: { slug: item.slug },
                data: { image: item.image }
            });
            console.log(`Updated category "${updated.name}" with image: ${updated.image}`);
        } catch (e) {
            console.error(`Failed to update category with slug "${item.slug}":`, e.message);
        }
    }
}

main()
    .finally(() => prisma.$disconnect());
