
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductReviews from "@/components/product/ProductReviews";
import Link from "next/link";
import { getProductDisplayImages } from "@/lib/productImages";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 60; // Cache product page on Edge CDN for 60 seconds

// 1. Dynamic Metadata for SEO
export async function generateMetadata(props) {
    const params = await props.params;
    const { slug } = params;

    const product = await prisma.product.findUnique({
        where: { slug },
        select: {
            name: true,
            shortDesc: true,
            description: true,
            price: true,
            metaTitle: true,
            metaDescription: true,
            metaKeywords: true,
            images: true,
            productImages: {
                orderBy: { sortOrder: 'asc' },
                take: 1
            }
        }
    });

    if (!product) return {};

    const title = product.metaTitle || `${product.name} | Pashora Shop`;
    const description = product.metaDescription || product.shortDesc || product.description?.substring(0, 160) || `Buy ${product.name} at Pashora Shop`;
    const image = product.productImages[0]?.url || (typeof product.images === 'string' ? JSON.parse(product.images)[0] : product.images?.[0]) || "/logo.png";
    const keywords = product.metaKeywords || "";
    const siteUrl = getSiteUrl();

    return {
        title: title,
        description: description,
        keywords: keywords,
        alternates: {
            canonical: `${siteUrl}/product/${slug}`,
        },
        openGraph: {
            title: product.name,
            description: description,
            images: [{ url: image, width: 1200, height: 630, alt: product.name }],
            type: "website",
            siteName: "Pashora Shop",
            locale: "bn_BD",
        },
        twitter: {
            card: "summary_large_image",
            title: product.name,
            description: description,
            images: [image],
        }
    };
}

export default async function ProductPage(props) {
    const params = await props.params;

    if (!params || !params.slug) {
        notFound();
    }

    const { slug } = params;

    const productRaw = await prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            subcategoryGroup: true,
            subcategoryItem: true,
            variants: {
                include: { images: true }
            },
            productImages: {
                orderBy: { sortOrder: 'asc' }
            },
            reviews: {
                where: { isApproved: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: { select: { name: true } } }
            }
        }
    });

    if (!productRaw || (productRaw.isActive === false)) {
        notFound();
    }

    // Calculate Aggregate Rating
    const totalReviews = await prisma.review.count({ where: { productId: productRaw.id, isApproved: true } });
    const avgRatingRaw = await prisma.review.aggregate({
        where: { productId: productRaw.id, isApproved: true },
        _avg: { rating: true }
    });
    const avgRating = avgRatingRaw._avg.rating || 5;

    // Filter variants safely in JS (handling case where isActive might be missing or false)
    if (productRaw.variants) {
        productRaw.variants = productRaw.variants.filter(v => v.isActive !== false);
    }

    // Check for Active Flash Sale Pricing
    const now = new Date();
    const activeFlashSaleItem = await prisma.flashSaleItem.findFirst({
        where: {
            productId: productRaw.id,
            isActive: true,
            flashSale: {
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gte: now }
            }
        }
    });

    if (activeFlashSaleItem) {
        productRaw.salePrice = activeFlashSaleItem.salePrice;
        productRaw.discountPrice = activeFlashSaleItem.salePrice; // For frontend display
    }

    // Serialize to be safe for any client components inside
    const product = serializePrisma(productRaw);

    // Prepare images using shared helper (filters empty/null URLs, fallback to legacy JSON)
    product.displayImages = getProductDisplayImages(product);

    const siteUrl = getSiteUrl();

    // JSON-LD Structured Data for Google
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.displayImages,
        "description": product.shortDesc || product.name,
        "sku": product.sku || product.id,
        "brand": {
            "@type": "Brand",
            "name": "Pashora Shop"
        },
        "aggregateRating": totalReviews > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": totalReviews
        } : undefined,
        "review": product.reviews?.map(r => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": r.user?.name || "Customer" },
            "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
            "reviewBody": r.comment
        })),
        "offers": {
            "@type": "Offer",
            "url": `${siteUrl}/product/${product.slug}`,
            "priceCurrency": "BDT",
            "price": product.salePrice || product.price,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    // Breadcrumb JSON-LD
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
            product.category && { "@type": "ListItem", "position": 2, "name": product.category.name, "item": `${siteUrl}/category/${product.category.slug}` },
            { "@type": "ListItem", "position": 3, "name": product.name, "item": `${siteUrl}/product/${product.slug}` }
        ].filter(Boolean)
    };

    return (
        <div className="container px-4 py-4 md:px-6 md:py-8 pb-24 md:pb-12 max-w-7xl mx-auto">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />

            {/* Breadcrumb Navigation (Shobkichu Style) */}
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto no-scrollbar py-1">
                <Link href="/" className="hover:text-emerald-700 transition-colors shrink-0">হোম</Link>
                <span>/</span>
                {product.category && (
                    <>
                        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-emerald-700 transition-colors shrink-0">
                            {product.category.name}
                        </Link>
                        <span>/</span>
                        </>
                )}
                <span className="text-gray-900 font-medium truncate max-w-xs sm:max-w-md">{product.name}</span>
            </nav>
            <ProductView product={product} />

            <ProductReviews productId={product.id} />

            <RelatedProducts
                categoryId={product.categoryId}
                currentProductId={product.id}
            />
        </div>
    );
}
