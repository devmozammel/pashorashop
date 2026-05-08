const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Full Database Initialization...');

    // 1. Create/Update Admin Account
    const ADMIN_EMAIL = 'admin@yoursite.com';
    const ADMIN_PASSWORD = 'Admin@12345';
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: { role: 'ADMIN', password: hashedPassword },
        create: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: 'Store Admin',
            role: 'ADMIN',
        }
    });
    console.log(`✅ Admin account ready: ${ADMIN_EMAIL}`);

    // 2. Initialize Site Settings
    const DEFAULT_SETTINGS = {
        siteName: "Authentic Bazar",
        currencySymbol: "৳",
        supportEmail: "support@authenticbazar.com",
        whatsapp: "8801613134043",
        address: "Dhaka, Bangladesh",
        deliveryFeeInside: 60,
        deliveryFeeOutside: 120,
        free_shipping_threshold: 2000,
        enable_topbar: "true",
        enable_sticky_header: "true"
    };

    await prisma.siteSetting.upsert({
        where: { key: 'store_settings' },
        update: { value: JSON.stringify(DEFAULT_SETTINGS), type: 'json' },
        create: { key: 'store_settings', value: JSON.stringify(DEFAULT_SETTINGS), type: 'json' }
    });
    console.log('✅ Site settings initialized.');

    // 3. Initialize Homepage Config
    await prisma.homepageConfig.upsert({
        where: { id: 'default-config' },
        update: {},
        create: {
            id: 'default-config',
            heroTitle: 'PREMIUM FASHION FOR EVERY OCCASION',
            heroSubtitle: 'Discover the latest trends from top international brands. Quality meets elegance.',
            heroButtonText: 'Shop New Collection',
            heroButtonLink: '/shop?sort=newest',
            heroImageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070',
            showFeatured: true,
            showNewArrivals: true,
            showTopSelling: true,
            showFlashSale: true,
        },
    });
    console.log('✅ Homepage configuration set.');

    // 4. Seed Categories & Products
    const categoriesData = [
        {
            name: 'Men',
            slug: 'men',
            image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2071',
            subgroups: [
                { name: 'Topwear', slug: 'men-topwear', items: ['T-Shirts', 'Shirts', 'Polo'] }
            ],
            products: [
                {
                    name: 'Premium Slim Fit Cotton Shirt',
                    price: 1850,
                    salePrice: 1550,
                    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1976',
                    description: 'A premium cotton shirt for formal and casual wear.'
                },
                {
                    name: 'Organic Cotton Basic T-Shirt',
                    price: 850,
                    salePrice: 750,
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080',
                    description: 'Soft organic cotton t-shirt for daily comfort.'
                }
            ]
        },
        {
            name: 'Women',
            slug: 'women',
            image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070',
            subgroups: [
                { name: 'Ethnic Wear', slug: 'women-ethnic', items: ['Sarees', 'Kurtas', 'Salwar Suits'] },
                { name: 'Western Wear', slug: 'women-western', items: ['Dresses', 'Tops'] }
            ],
            products: [
                {
                    name: 'Handwoven Silk Saree',
                    price: 8500,
                    salePrice: 7200,
                    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1974',
                    description: 'Elegant handwoven silk saree for weddings and festivals.'
                },
                {
                    name: 'Floral Print Summer Dress',
                    price: 2450,
                    salePrice: 1950,
                    image: 'https://images.unsplash.com/photo-1572804013307-f9a8a9228d7a?q=80&w=1964',
                    description: 'Lightweight and stylish summer dress with floral patterns.'
                }
            ]
        },
        {
            name: 'Accessories',
            slug: 'accessories',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999',
            subgroups: [
                { name: 'Bags', slug: 'bags', items: ['Handbags', 'Backpacks'] },
                { name: 'Watches', slug: 'watches', items: ['Luxury', 'Sports'] }
            ],
            products: [
                {
                    name: 'Classic Leather Watch',
                    price: 4500,
                    salePrice: 3800,
                    image: 'https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?q=80&w=1974',
                    description: 'Timeless leather watch with a minimalist face.'
                }
            ]
        }
    ];

    for (const cat of categoriesData) {
        const category = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { image: cat.image },
            create: { name: cat.name, slug: cat.slug, image: cat.image, isActive: true, showOnHomepage: true }
        });

        console.log(`📂 Processing Category: ${cat.name}`);

        for (const sub of cat.subgroups) {
            const group = await prisma.subcategoryGroup.upsert({
                where: { slug: sub.slug },
                update: {},
                create: { name: sub.name, slug: sub.slug, categoryId: category.id, isActive: true }
            });

            for (const item of sub.items) {
                const itemSlug = `${sub.slug}-${item.toLowerCase().replace(/\s+/g, '-')}`;
                await prisma.subcategoryItem.upsert({
                    where: { slug: itemSlug },
                    update: {},
                    create: { name: item, slug: itemSlug, groupId: group.id, isActive: true }
                });
            }
        }

        // Add Products if they don't exist
        for (const p of cat.products) {
            const product = await prisma.product.upsert({
                where: { slug: p.name.toLowerCase().replace(/\s+/g, '-') },
                update: {},
                create: {
                    name: p.name,
                    slug: p.name.toLowerCase().replace(/\s+/g, '-'),
                    description: p.description,
                    shortDesc: p.name,
                    price: p.price,
                    salePrice: p.salePrice,
                    categoryId: category.id,
                    stock: 50,
                    isActive: true,
                    isFeatured: true,
                    images: [p.image],
                    paymentMethods: 'BOTH'
                }
            });
            
            // Add initial image record
            await prisma.productImage.create({
                data: { productId: product.id, url: p.image, sortOrder: 0 }
            });
        }
    }

    // 5. Setup a Banner
    await prisma.banner.create({
        data: {
            text: 'Flash Sale: 20% Off on all products! Use code: WELCOME20',
            link: '/shop',
            isActive: true,
        }
    });

    console.log('✅ Banner created.');

    // 6. Setup Flash Sale
    const allProducts = await prisma.product.findMany({ take: 3 });
    if (allProducts.length > 0) {
        await prisma.flashSale.create({
            data: {
                title: 'Mega Weekend Sale',
                startsAt: new Date(),
                endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                isActive: true,
                items: {
                    create: allProducts.map(p => ({
                        productId: p.id,
                        salePrice: Math.floor(p.price * 0.75), // 25% off
                        isActive: true
                    }))
                }
            }
        });
        console.log('✅ Flash sale initialized.');
    }

    console.log('\n✨ Database Initialization Complete! ✨');
    console.log('-------------------------------------------');
    console.log(`Admin Email:    ${ADMIN_EMAIL}`);
    console.log(`Admin Password: ${ADMIN_PASSWORD}`);
    console.log('-------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
