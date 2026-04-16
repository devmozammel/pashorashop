
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: true }
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://yourdomain.com';

        let xml = '<?xml version="1.0"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n<title>Fashion House Catalog</title>\n<link>' + baseUrl + '</link>\n<description>Fashion House Product Feed</description>\n';

        products.forEach(product => {
            const image = product.images?.[0] || '';
            const price = `${product.discountPrice || product.price} BDT`;

            xml += `<item>
    <g:id>${product.id}</g:id>
    <g:title><![CDATA[${product.name}]]></g:title>
    <g:description><![CDATA[${product.description || product.name}]]></g:description>
    <g:link>${baseUrl}/product/${product.slug}</g:link>
    <g:image_link>${image}</g:image_link>
    <g:brand>Fashion House</g:brand>
    <g:condition>new</g:condition>
    <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
    <g:price>${price}</g:price>
    <g:google_product_category>Apparel &amp; Accessories</g:google_product_category>
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
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
