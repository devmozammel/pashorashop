
import { prisma } from "@/lib/prisma";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function LowStockAlert() {
    const lowStockProducts = await prisma.product.findMany({
        where: {
            isActive: true,
            stock: { lte: 5 } // Threshold: 5
        },
        select: { id: true, name: true, stock: true, slug: true },
        take: 5
    });

    if (lowStockProducts.length === 0) return null;

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Low Stock Alert</h3>
            </div>
            <div className="space-y-3">
                {lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700 truncate max-w-[200px]">{p.name}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-red-600 font-bold">{p.stock} left</span>
                            <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline text-xs">
                                Restock
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-orange-200">
                <Link href="/admin/products?filter=low_stock" className="text-sm font-medium text-orange-800 hover:text-orange-900">
                    View all low stock items &rarr;
                </Link>
            </div>
        </div>
    );
}
