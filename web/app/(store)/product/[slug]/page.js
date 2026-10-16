
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductReviews from "@/components/product/ProductReviews";
import Link from "next/link";
import { getProductDisplayImages } from "@/lib/productImages";

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

    const title = product.metaTitle || `${product.name} | Authentic Bazar`;
    const description = product.metaDescription || product.shortDesc || product.description?.substring(0, 160) || `Buy ${product.name} at Authentic Bazar`;
    const image = product.productImages[0]?.url || (typeof product.images === 'string' ? JSON.parse(product.images)[0] : product.images?.[0]) || "/logo.png";
    const keywords = product.metaKeywords || "";

    return {
        title: title,
        description: description,
        keywords: keywords,
        alternates: {
            canonical: `/product/${slug}`,
        },
        openGraph: {
            title: product.name,
            description: description,
            images: [image],
            type: "website",
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";

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
            "name": "Authentic Bazar Shop"
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

    // Check if landing page exists for this slug
    const landingPage = await prisma.landingPage.findUnique({
        where: { slug: product.slug, isActive: true }
    });

    return (
        <div className="container px-4 py-8 md:px-6 md:py-12 pb-24 md:pb-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            {landingPage && (
                <div className="mb-8 p-5 md:p-6 bg-gradient-to-r from-zinc-950 via-emerald-950 to-zinc-950 text-white rounded-3xl shadow-xl border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shrink-0 font-bold">
                            ⚡
                        </div>
                        <div>
                            <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full mb-1">স্পেশাল অফার সক্রিয়</span>
                            <h3 className="font-black text-base md:text-lg text-white">{landingPage.heroTitle || product.name}</h3>
                            <p className="text-zinc-300 text-xs md:text-sm">বিশেষ অফার, বিস্তারিত ফিচার রিভিউ ও ১-ক্লিক ডেলিভারি অর্ডার সহ আকর্ষণীয় ল্যান্ডিং পেজ দেখুন।</p>
                        </div>
                    </div>
                    <Link href={`/lp/${product.slug}`} className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2">
                        🚀 ল্যান্ডিং পেজ দেখুন →
                    </Link>
                </div>
            )}
            <ProductView product={product} />

            <ProductReviews productId={product.id} />

            <RelatedProducts
                categoryId={product.categoryId}
                currentProductId={product.id}
            />
        </div>
    );
}
