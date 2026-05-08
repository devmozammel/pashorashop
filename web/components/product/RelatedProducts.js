import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/product/ProductCard";
import { serializePrisma } from "@/lib/serialize";
import { Sparkles } from "lucide-react";

export default async function RelatedProducts({ categoryId, currentProductId }) {
    if (!categoryId) return null;

    const relatedRaw = await prisma.product.findMany({
        where: {
            categoryId,
            id: { not: currentProductId },
            isActive: true
        },
        take: 4,
        include: { 
            variants: true,
            productImages: {
                orderBy: { sortOrder: 'asc' },
                take: 1
            }
        }
    });

    const related = serializePrisma(relatedRaw);

    if (related.length === 0) return null;

    return (
        <section className="mt-16 pt-16 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">You May Also Like</h2>
                    <p className="text-gray-400 text-sm">Handpicked products based on your interest</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {related.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            
            {/* Premium Divider */}
            <div className="mt-20 flex items-center justify-center gap-4 opacity-10">
                <div className="h-px w-20 bg-black" />
                <div className="w-2 h-2 rounded-full bg-black" />
                <div className="h-px w-20 bg-black" />
            </div>
        </section>
    );
}
