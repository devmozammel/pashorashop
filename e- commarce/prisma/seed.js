const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    // Create Homepage Config
    await prisma.homepageConfig.upsert({
        where: { id: 'default-config' },
        update: {},
        create: {
            id: 'default-config',
            heroTitle: 'New Summer Collection',
            heroSubtitle: 'Up to 50% Off on selected items',
            heroButtonText: 'Shop Now',
            heroButtonLink: '/shop',
            showFeatured: true,
            showNewArrivals: true,
            showTopSelling: true,
            showFlashSale: true,
        },
    });

    // Create a Coupon
    const coupon = await prisma.coupon.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: {
            code: 'WELCOME10',
            discountType: 'PERCENT',
            discountValue: 10,
            minOrderAmount: 1000,
            maxUsage: 100,
            isActive: true,
        },
    });

    // Seed Categories
    const categories = [
        {
            name: 'Men',
            slug: 'men',
            subcategories: [
                {
                    name: 'Topwear',
                    slug: 'men-topwear',
                    items: ['T-Shirts', 'Casual Shirts', 'Formal Shirts', 'Hoodies', 'Jackets']
                },
                {
                    name: 'Bottomwear',
                    slug: 'men-bottomwear',
                    items: ['Jeans', 'Chinos', 'Joggers', 'Shorts', 'Formal Trousers']
                },
                {
                    name: 'Footwear',
                    slug: 'men-footwear',
                    items: ['Sneakers', 'Formal Shoes', 'Loafers', 'Boots', 'Sandals']
                },
                {
                    name: 'Accessories',
                    slug: 'men-accessories',
                    items: ['Watches', 'Belts', 'Wallets', 'Sunglasses', 'Caps']
                }
            ]
        },
        {
            name: 'Women',
            slug: 'women',
            subcategories: [
                {
                    name: 'Indian & Fusion Wear',
                    slug: 'women-ethnic',
                    items: ['Kurtas', 'Sarees', 'Ethnic Sets', 'Lehengas', 'Dupattas']
                },
                {
                    name: 'Western Wear',
                    slug: 'women-western',
                    items: ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits']
                },
                {
                    name: 'Footwear',
                    slug: 'women-footwear',
                    items: ['Flats', 'Heels', 'Boots', 'Sneakers', 'Sandals']
                },
                {
                    name: 'Jewelry & Accessories',
                    slug: 'women-jewelry',
                    items: ['Earrings', 'Necklaces', 'Bags', 'Watches', 'Scarves']
                }
            ]
        },
        {
            name: 'Teens',
            slug: 'teens',
            subcategories: [
                {
                    name: 'Boys',
                    slug: 'teens-boys',
                    items: ['T-Shirts', 'Jeans', 'Hoodies', 'Jackets']
                },
                {
                    name: 'Girls',
                    slug: 'teens-girls',
                    items: ['Tops', 'Dresses', 'Jeans', 'Skirts']
                }
            ]
        },
        {
            name: 'Kids',
            slug: 'kids',
            subcategories: [
                {
                    name: 'Boys Clothing',
                    slug: 'kids-boys',
                    items: ['T-Shirts', 'Shirts', 'Jeans', 'Shorts', 'Ethnic Wear']
                },
                {
                    name: 'Girls Clothing',
                    slug: 'kids-girls',
                    items: ['Dresses', 'Tops', 'Skirts', 'Leggings', 'Ethnic Wear']
                },
                {
                    name: 'Footwear',
                    slug: 'kids-footwear',
                    items: ['School Shoes', 'Sports Shoes', 'Sandals', 'Flip Flops']
                },
                {
                    name: 'Toys',
                    slug: 'kids-toys',
                    items: ['Action Figures', 'Dolls', 'Board Games', 'Educational Toys']
                }
            ]
        },
        {
            name: 'Sports',
            slug: 'sports',
            subcategories: [
                {
                    name: 'Men\'s Sports',
                    slug: 'sports-men',
                    items: ['Running Shoes', 'Training Wear', 'Jerseys', 'Track Pants']
                },
                {
                    name: 'Women\'s Sports',
                    slug: 'sports-women',
                    items: ['Running Shoes', 'Sports Bras', 'Leggings', 'Tops']
                },
                {
                    name: 'Equipment',
                    slug: 'sports-equipment',
                    items: ['Cricket', 'Football', 'Badminton', 'Gym Accessories']
                }
            ]
        },
        {
            name: 'Home & Living',
            slug: 'home-living',
            subcategories: [
                {
                    name: 'Decor',
                    slug: 'home-decor',
                    items: ['Wall Art', 'Vases', 'Clocks', 'Mirrors', 'Lighting']
                },
                {
                    name: 'Bedding',
                    slug: 'home-bedding',
                    items: ['Bed Sheets', 'Blankets', 'Pillows', 'Comforters']
                },
                {
                    name: 'Kitchen',
                    slug: 'home-kitchen',
                    items: ['Cookware', 'Dinnerware', 'Storage', 'Tools']
                }
            ]
        }
    ];

    for (const cat of categories) {
        const createdCat = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: {
                name: cat.name,
                slug: cat.slug,
                isActive: true,
                showInMegaMenu: true,
                sortOrder: 0,
            }
        });

        console.log(`Created Category: ${cat.name}`);

        for (const sub of cat.subcategories) {
            const createdGroup = await prisma.subcategoryGroup.upsert({
                where: { slug: sub.slug },
                update: {},
                create: {
                    name: sub.name,
                    title: sub.name, // Set title as well
                    slug: sub.slug,
                    categoryId: createdCat.id,
                    isActive: true,
                    sortOrder: 0
                }
            });

            for (const itemName of sub.items) {
                const itemSlug = `${sub.slug}-${itemName.toLowerCase().replace(/\s+/g, '-')}`;
                await prisma.subcategoryItem.upsert({
                    where: { slug: itemSlug },
                    update: {},
                    create: {
                        name: itemName,
                        slug: itemSlug,
                        groupId: createdGroup.id, // Updated from subcategoryId
                        isActive: true,
                        sortOrder: 0
                    }
                });
            }
        }
    }

    // Find or Create Products for Flash Sale
    const products = await prisma.product.findMany({ take: 5 });

    if (products.length > 0) {
        // Create Flash Sale
        // Check if exists first to avoid duplicate key error if re-running
        const existingFlashSale = await prisma.flashSale.findFirst({ where: { title: 'Weekend Flash Sale' } });
        if (!existingFlashSale) {
            const flashSale = await prisma.flashSale.create({
                data: {
                    title: 'Weekend Flash Sale',
                    startsAt: new Date(),
                    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    isActive: true,
                    items: {
                        create: products.map(p => ({
                            productId: p.id,
                            salePrice: Math.floor(p.price * 0.8), // 20% off
                            isActive: true
                        }))
                    }
                }
            });
            console.log('Created Flash Sale:', flashSale.title);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
