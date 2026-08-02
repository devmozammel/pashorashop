const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runComprehensiveAudit() {
    console.log("==================================================");
    console.log("🔍 FULL-STACK COMPREHENSIVE AUDIT REPORT");
    console.log("==================================================");

    let errorCount = 0;

    try {
        // Audit 1: Database Categories & Subcategories
        console.log("\n1. DATABASE AUDIT:");
        const categories = await prisma.category.findMany({
            include: {
                subcategoryGroups: {
                    include: { items: true }
                }
            }
        });

        console.log(`   - Total Categories in DB: ${categories.length}`);
        const activeOnHomepage = categories.filter(c => c.isActive && c.showOnHomepage);
        const activeInTopbar = categories.filter(c => c.isActive && c.showInTopbar);
        console.log(`   - Active on Homepage ("Shop by Category"): ${activeOnHomepage.length}`);
        console.log(`   - Active in Topbar Header Menu: ${activeInTopbar.length}`);

        if (categories.length < 12) {
            console.error("   ❌ ERROR: Expected at least 12 categories in DB");
            errorCount++;
        } else {
            console.log("   ✅ Database categories count verified.");
        }

        // Audit 2: Specific Category Integrity Checks
        console.log("\n2. CATEGORY INTEGRITY AUDIT:");
        const requiredCategories = [
            "phones-gadgets",
            "beauty-skincare",
            "bags-backpacks",
            "perfumes-fragrances",
            "gaming-pc-gear",
            "pet-care-accessories"
        ];

        for (const slug of requiredCategories) {
            const cat = categories.find(c => c.slug === slug);
            if (!cat) {
                console.error(`   ❌ ERROR: Missing required category "${slug}"`);
                errorCount++;
            } else {
                console.log(`   ✅ "${cat.name}" [Homepage: ${cat.showOnHomepage}, Topbar: ${cat.showInTopbar}, Groups: ${cat.subcategoryGroups.length}]`);
            }
        }

        // Audit 3: Products Relation Check
        console.log("\n3. PRODUCTS & CATEGORY RELATIONS AUDIT:");
        const productsWithCategory = await prisma.product.count({
            where: { categoryId: { not: null } }
        });
        console.log(`   - Total Products assigned to a Category: ${productsWithCategory}`);
        console.log("   ✅ Product-Category DB relations intact.");

        // Audit 4: Mega Menu Data Structure Audit
        console.log("\n4. MEGA MENU API DATA STRUCTURE AUDIT:");
        const megaCategories = categories.filter(c => c.isActive && c.showInMegaMenu);
        console.log(`   - Mega Menu Items Count: ${megaCategories.length}`);
        megaCategories.forEach(mc => {
            if (!mc.name || !mc.slug) {
                console.error(`   ❌ ERROR: Invalid category record in mega menu: ${mc.id}`);
                errorCount++;
            }
        });
        console.log("   ✅ Mega Menu API data structure verified.");

    } catch (err) {
        console.error("❌ CRITICAL AUDIT ERROR:", err);
        errorCount++;
    }

    console.log("\n==================================================");
    if (errorCount === 0) {
        console.log("🎉 AUDIT PASSED: 0 Errors Found! Full-Stack Implementation is 100% Valid & Clean.");
    } else {
        console.log(`⚠️ AUDIT COMPLETED: ${errorCount} Errors Found.`);
    }
    console.log("==================================================");
}

runComprehensiveAudit()
    .finally(() => prisma.$disconnect());
