
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getProductThumbnail } from "@/lib/productImages";

function getGoogleCategory(categoryName) {
    if (!categoryName) return "Shopping";
    const cat = categoryName.toLowerCase();
    if (cat.includes("jersey") || cat.includes("t-shirt") || cat.includes("shirt") || cat.includes("clothing") || cat.includes("wear")) {
        return "Apparel & Accessories > Clothing > Activewear > Athletic Uniforms";
    }
    if (cat.includes("perfume") || cat.includes("cologne") || cat.includes("fragrance") || cat.includes("attar") || cat.includes("body spray")) {
        return "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne";
    }
    if (cat.includes("skin") || cat.includes("face") || cat.includes("cream") || cat.includes("gel") || cat.includes("serum") || cat.includes("wash") || cat.includes("soap")) {
        return "Health & Beauty > Personal Care > Cosmetics > Skin Care";
    }
    if (cat.includes("tea") || cat.includes("beverage") || cat.includes("drink")) {
        return "Food, Beverages & Tobacco > Beverages > Tea & Infusions";
    }
    if (cat.includes("massager") || cat.includes("massage") || cat.includes("personal care") || cat.includes("health")) {
        return "Health & Beauty > Personal Care";
    }
    return "Shopping";
}

// Safely strip HTML tags to prevent GMC policy rejection
function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, " ")      // Strip HTML tags
        .replace(/&nbsp;/g, " ")       // Replace non-breaking spaces
        .replace(/\s+/g, " ")          // Collapse multiple spaces
        .trim();
}

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { 
                category: true, 
                variants: true,
                productImages: { orderBy: { sortOrder: 'asc' } }
            }
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://www.authenticbazar.shop';

        let xml = '<?xml version="1.0"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n<title>Authentic Bazar Catalog</title>\n<link>' + baseUrl + '</link>\n<description>Authentic Bazar Product Feed</description>\n';

        products.forEach(product => {
            const image = getProductThumbnail(product) || '';
            
            // Extract secondary gallery images for Google Shopping Carousel
            const additionalImages = product.productImages?.slice(1).map(pi => pi.url) || [];

            // Calculate baseline price (handling variants overrides and adjustments)
            let finalPrice = product.discountPrice || product.salePrice || product.price || 0;

            if (finalPrice === 0 && product.variants && product.variants.length > 0) {
                const variantPrices = product.variants.map(v => {
                    const hasVariantPrices = (v.price !== null && v.price !== undefined) || (v.salePrice !== null && v.salePrice !== undefined);
                    if (hasVariantPrices) {
                        return (v.salePrice !== null && v.salePrice !== undefined && v.salePrice !== "") ? Number(v.salePrice) : Number(v.price);
                    } else {
                        const basePrice = Number(product.salePrice ?? product.price);
                        return basePrice + Number(v.priceAdjustment || 0);
                    }
                }).filter(price => price > 0);

                if (variantPrices.length > 0) {
                    finalPrice = Math.min(...variantPrices);
                }
            }

            // Skip zero-priced products to prevent GMC policy suspensions/disapprovals
            if (finalPrice <= 0) return;

            const price = `${finalPrice} BDT`;
            const googleCategory = getGoogleCategory(product.category?.name);
            const cleanDescription = stripHtml(product.shortDesc || product.description || product.name);

            // Extract unique sizes and colors
            let sizes = [];
            let colors = [];
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(v => {
                    if (v.size && v.size.trim() !== "") sizes.push(v.size.trim());
                    if (v.color && v.color.trim() !== "") colors.push(v.color.trim());
                });
            }
            sizes = [...new Set(sizes)];
            colors = [...new Set(colors)];

            xml += `<item>
    <g:id>${product.id}</g:id>
    <g:title><![CDATA[${product.name}]]></g:title>
    <g:description><![CDATA[${cleanDescription}]]></g:description>
    <g:link>${baseUrl}/product/${product.slug}</g:link>
    <g:image_link>${image}</g:image_link>
    ${additionalImages.map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n    ')}
    <g:brand>Authentic Bazar Shop</g:brand>
    <g:condition>new</g:condition>
    <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
    <g:price>${price}</g:price>
    <g:google_product_category><![CDATA[${googleCategory}]]></g:google_product_category>
    ${product.sku ? `<g:mpn><![CDATA[${product.sku}]]></g:mpn>` : ""}
    ${sizes.length > 0 ? `<g:size><![CDATA[${sizes.join(", ")}]]></g:size>` : ""}
    ${colors.length > 0 ? `<g:color><![CDATA[${colors.join(", ")}]]></g:color>` : ""}
</item>\n`;
        });

        xml += '</channel>\n</rss>';

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'text/xml',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate'
            }
        });
    } catch (error) {
        console.error("Catalog Feed Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

