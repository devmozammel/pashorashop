
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getProductThumbnail } from "@/lib/productImages";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: true }
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://www.authenticbazar.shop';

        let xml = '<?xml version="1.0"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n<title>Authentic Bazar Catalog</title>\n<link>' + baseUrl + '</link>\n<description>Authentic Bazar Product Feed</description>\n';

        products.forEach(product => {
            const image = getProductThumbnail(product) || '';
            const finalPrice = product.discountPrice || product.salePrice || product.price || 0;
            const price = `${finalPrice} BDT`;
            const categoryName = product.category?.name || "Shopping";

            xml += `<item>
    <g:id>${product.id}</g:id>
    <g:title><![CDATA[${product.name}]]></g:title>
    <g:description><![CDATA[${product.shortDesc || product.description || product.name}]]></g:description>
    <g:link>${baseUrl}/product/${product.slug}</g:link>
    <g:image_link>${image}</g:image_link>
    <g:brand>Authentic Bazar</g:brand>
    <g:condition>new</g:condition>
    <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
    <g:price>${price}</g:price>
    <g:google_product_category><![CDATA[${categoryName}]]></g:google_product_category>
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
