
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import ProductCard from "@/components/product/ProductCard";

// Server Component
export default async function ProductRecommendations({ currentProductId, categoryId }) {
    if (!categoryId) return null;

    const relatedProducts = await prisma.product.findMany({
        where: {
            categoryId,
            id: { not: currentProductId },
            stock: { gt: 0 }
        },
        take: 4,
        include: { category: true } // just in case
    });

    if (relatedProducts.length === 0) return null;

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
