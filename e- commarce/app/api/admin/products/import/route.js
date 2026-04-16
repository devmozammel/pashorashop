
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') { // Only Admins can import
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { products } = await request.json();
        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        let importedCount = 0;
        const errors = [];

        for (const [index, p] of products.entries()) {
            try {
                // Basic Validation
                if (!p.name || !p.price) {
                    errors.push(`Row ${index + 1}: Missing name or price.`);
                    continue;
                }

                // Slug generation
                let slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                // Ensure unique slug (simple append for conflict, ideally check DB)
                const existing = await prisma.product.findUnique({ where: { slug } });
                if (existing) {
                    slug = `${slug}-${Date.now()}`;
                }

                // Find or Create Category
                let categoryId = null;
                if (p.category) {
                    const catSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    let cat = await prisma.category.findUnique({ where: { slug: catSlug } });

                    if (!cat) {
                        // Create category if not exists? Or skip? Let's skip or assign uncategorized
                        // Detailed error:
                        errors.push(`Row ${index + 1}: Category '${p.category}' not found.`);
                        continue;
                    }
                    categoryId = cat.id;
                }

                await prisma.product.create({
                    data: {
                        name: p.name,
                        slug: slug,
                        description: p.description || "",
                        price: parseFloat(p.price),
                        stock: parseInt(p.stock || "0"),
                        categoryId: categoryId,
                        isActive: true
                    }
                });

                importedCount++;

            } catch (err) {
                console.error("Import Error Row " + index, err);
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        }

        await logActivity(session.user.id, "IMPORT", "Products", { count: importedCount, errors: errors.length });

        return NextResponse.json({ success: true, count: importedCount, errors });

    } catch (error) {
        console.error("Bulk Import Fatal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
