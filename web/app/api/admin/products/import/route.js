import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { sanitizeHtml } from "@/lib/sanitize";
import { z } from "zod";

const importProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable().default(""),
    price: z.preprocess((val) => {
        if (typeof val === "number") return val;
        if (typeof val === "string") {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
    }, z.number({ required_error: "Price must be a valid number" }).nonnegative("Price must be non-negative")),
    stock: z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return 0;
        if (typeof val === "number") return Math.floor(val);
        if (typeof val === "string") {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }, z.number().int().nonnegative().default(0)),
    category: z.string().optional().nullable()
});

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

        if (products.length > 500) {
            return NextResponse.json({ error: "Bulk import exceeds maximum allowed limit of 500 products." }, { status: 400 });
        }

        let importedCount = 0;
        const errors = [];

        for (const [index, p] of products.entries()) {
            try {
                // Validate with Zod
                const parseResult = importProductSchema.safeParse(p);
                if (!parseResult.success) {
                    const validationErrors = parseResult.error.errors.map(err => err.message).join(", ");
                    errors.push(`Row ${index + 1}: ${validationErrors}`);
                    continue;
                }

                const parsedData = parseResult.data;

                // Sanitize HTML in description
                const sanitizedDescription = sanitizeHtml(parsedData.description || "");

                // Slug generation
                let slug = parsedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                // Ensure unique slug (simple append for conflict, ideally check DB)
                const existing = await prisma.product.findUnique({ where: { slug } });
                if (existing) {
                    slug = `${slug}-${Date.now()}`;
                }

                // Find or Create Category
                let categoryId = null;
                if (parsedData.category) {
                    const catSlug = parsedData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    let cat = await prisma.category.findUnique({ where: { slug: catSlug } });

                    if (!cat) {
                        errors.push(`Row ${index + 1}: Category '${parsedData.category}' not found.`);
                        continue;
                    }
                    categoryId = cat.id;
                }

                await prisma.product.create({
                    data: {
                        name: parsedData.name,
                        slug: slug,
                        description: sanitizedDescription,
                        price: parsedData.price,
                        stock: parsedData.stock,
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
