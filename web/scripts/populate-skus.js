const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getCategoryShorthand(catName) {
    if (!catName) return "GEN";
    const name = catName.toLowerCase();
    if (name.includes("jersey")) return "JRS";
    if (name.includes("t-shirt")) return "TSH";
    if (name.includes("shirt")) return "SHR";
    if (name.includes("panjabi")) return "PJB";
    if (name.includes("perfume") || name.includes("attar") || name.includes("cologne")) return "PRF";
    if (name.includes("skin") || name.includes("care") || name.includes("soap")) return "SKN";
    if (name.includes("tea")) return "TEA";
    return catName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || "GEN";
}

async function main() {
    console.log("Fetching all products...");
    const products = await prisma.product.findMany({
        include: {
            category: true,
            variants: true
        }
    });

    console.log(`Found ${products.length} products. Start generating SKUs...`);
    let updatedProducts = 0;
    let updatedVariants = 0;

    for (const product of products) {
        const cleanSlug = product.slug.replace(/[^a-zA-Z0-9-]/g, '');
        const words = cleanSlug.split("-").filter(Boolean);
        const slugShort = words.map(w => w.substring(0, 3).toUpperCase()).join("-").substring(0, 12);
        
        const catShort = getCategoryShorthand(product.category?.name);
        let mainSku = product.sku;

        if (!mainSku) {
            mainSku = `AB-${catShort}-${slugShort}`;
            await prisma.product.update({
                where: { id: product.id },
                data: { sku: mainSku }
            });
            updatedProducts++;
            console.log(`Product "${product.name}": Generated SKU -> ${mainSku}`);
        }

        // Handle variants
        for (const variant of product.variants) {
            if (!variant.sku) {
                const sizePart = variant.size ? variant.size.replace(/\s+/g, '').toUpperCase() : "";
                const colorPart = variant.color ? variant.color.substring(0, 3).replace(/\s+/g, '').toUpperCase() : "";
                
                let variantSku = mainSku;
                if (colorPart) variantSku += `-${colorPart}`;
                if (sizePart) variantSku += `-${sizePart}`;

                await prisma.productVariant.update({
                    where: { id: variant.id },
                    data: { sku: variantSku }
                });
                updatedVariants++;
                console.log(`  Variant (Size: ${variant.size || "-"}, Color: ${variant.color || "-"}): Generated SKU -> ${variantSku}`);
            }
        }
    }

    console.log("\n-------------------------------------------");
    console.log(`SKU Population completed successfully!`);
    console.log(`Updated Products: ${updatedProducts}`);
    console.log(`Updated Variants: ${updatedVariants}`);
    console.log("-------------------------------------------");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
