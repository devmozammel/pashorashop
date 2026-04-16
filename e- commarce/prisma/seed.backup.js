const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    console.log("Starting seed...")

    // 1. Site Settings
    // Note: The new schema removes 'type' and 'group'. We only have key, value, isPublic.
    const settings = [
        { key: 'site_name', value: 'Fashion House' },
        { key: 'site_logo', value: '/brand/logo.png' },
        { key: 'currency_symbol', value: '৳' },
        { key: 'shipping_cost', value: '60' },
        { key: 'free_shipping_threshold', value: '1000' },
        { key: 'enable_topbar', value: 'true' },
        { key: 'topbar_text', value: 'Free shipping on orders over ৳1000' },
        { key: 'shipping_fee_inside', value: '70' },
        { key: 'shipping_fee_outside', value: '130' },
    ]

    for (const s of settings) {
        await prisma.siteSetting.upsert({
            where: { key: s.key },
            update: { value: s.value, isPublic: true },
            create: { key: s.key, value: s.value, isPublic: true },
        })
    }
    console.log("Settings seeded.")

    // 2. Categories
    const categories = [
        { name: 'Men', slug: 'men' },
        { name: 'Women', slug: 'women' },
        { name: 'Teens', slug: 'teens' },
        { name: 'Kids', slug: 'kids' },
        { name: 'Sports', slug: 'sports' },
        { name: 'Accessories', slug: 'accessories' },
    ]

    const categoryMap = {};

    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const sortOrder = i + 1;
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                showInMegaMenu: true,
                showInTopbar: true,
                showInHomepage: true,
                isActive: true,
                sortOrder: sortOrder
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                showInMegaMenu: true,
                showInTopbar: true,
                showInHomepage: true,
                isActive: true,
                sortOrder: sortOrder
            },
        })
        categoryMap[cat.slug] = created.id;
    }
    console.log("Categories seeded.")

    // 3. Landing Page (Home Hero)
    // Schema updated: heroSub, heroBtn, heroLink (removed heroImage)
    await prisma.landingPage.upsert({
        where: { slug: 'home' },
        update: {
            heroTitle: 'ELEVATE YOUR STYLE',
            heroSub: 'Discover the latest trends in fashion with our new collection.',
            heroBtn: 'Shop New Arrivals',
            heroLink: '/category/women',
        },
        create: {
            slug: 'home',
            heroTitle: 'ELEVATE YOUR STYLE',
            heroSub: 'Discover the latest trends in fashion with our new collection.',
            heroBtn: 'Shop New Arrivals',
            heroLink: '/category/women',
        }
    });
    console.log("Landing Page seeded.");

    // 4. Products
    const products = [];
    const now = new Date();

    const createProduct = (i, categorySlug, isFeatured = false) => {
        const type = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
        return {
            name: `${type} Item ${i}`,
            slug: `${categorySlug}-item-${i}-${Math.floor(Math.random() * 1000)}`,
            description: `This is a premium ${categorySlug} item, designed for style and comfort.`,
            price: (Math.floor(Math.random() * 50) + 10) * 100,
            stock: 50,
            images: [],
            categoryId: categoryMap[categorySlug],
            isActive: true,
            isFeatured: isFeatured,
            createdAt: new Date(now.getTime() - Math.floor(Math.random() * 1000000000)),
        };
    };

    for (let i = 1; i <= 6; i++) products.push(createProduct(i, 'men', i <= 3));
    for (let i = 1; i <= 6; i++) products.push(createProduct(i, 'women', i <= 3));
    for (let i = 1; i <= 3; i++) products.push(createProduct(i, 'teens', i <= 2));
    for (let i = 1; i <= 3; i++) products.push(createProduct(i, 'kids', i <= 2));
    for (let i = 1; i <= 3; i++) products.push(createProduct(i, 'sports', i <= 1));
    for (let i = 1; i <= 3; i++) products.push(createProduct(i, 'accessories', i <= 1));

    for (const p of products) {
        await prisma.product.upsert({
            where: { slug: p.slug },
            update: {
                isFeatured: p.isFeatured,
                isActive: true,
                categoryId: p.categoryId,
            },
            create: p,
        });
    }
    console.log(`Seeded ${products.length} products.`);

    // 5. Admin User
    const adminEmail = 'tarunhossain567@gmail.com'
    const adminPassword = await bcrypt.hash('password123', 10)

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: 'ADMIN',
            password: adminPassword,
        },
        create: {
            email: adminEmail,
            name: 'Super Admin',
            role: 'ADMIN',
            password: adminPassword,
        },
    })
    console.log(`Admin user seeded: ${adminEmail}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
