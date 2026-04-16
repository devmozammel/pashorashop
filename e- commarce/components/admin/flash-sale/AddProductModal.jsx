"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { flashSaleItemSchema } from "@/lib/zod-schemas";

export default function AddProductModal({ isOpen, onClose, onSuccess, flashSaleId }) {
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [salePrice, setSalePrice] = useState("");
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        setIsFetchingProducts(true);
        try {
            const res = await fetch("/api/admin/products");
            const data = await res.json();

            // Check if response is an array (directly) or wrapped in {ok, data}
            if (Array.isArray(data)) {
                setProducts(data);
            } else if (data.ok && data.data) {
                setProducts(data.data);
            } else {
                setProducts([]);
            }
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setIsFetchingProducts(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return toast.error("Please select a product");

        setIsLoading(true);
        try {
            const payload = {
                flashSaleId,
                productId: selectedProduct.id,
                salePrice: Number(salePrice),
                isActive: true
            };

            const result = flashSaleItemSchema.safeParse(payload);
            if (!result.success) {
                toast.error(result.error.errors[0].message);
                setIsLoading(false);
                return;
            }

            const res = await fetch("/api/admin/flash-sale/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to add product");
            } else {
                toast.success("Product added to flash sale");
                onSuccess();
                onClose();
                setSelectedProduct(null);
                setSalePrice("");
                setSearchQuery("");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">Add Product to Sale</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                    {!selectedProduct ? (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-lg min-h-[300px] flex flex-col">
                                {isFetchingProducts ? (
                                    <div className="flex-1 flex items-center justify-center p-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                        <Search className="w-12 h-12 text-gray-200 mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No products found</p>
                                        <p className="text-sm mt-1">Try adjusting your search query</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredProducts.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => setSelectedProduct(product)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                                    {product.images && product.images[0] ? (
                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                                                    <p className="text-xs text-gray-500">Price: ৳{product.price}</p>
                                                </div>
                                                <Plus className="w-4 h-4 ml-auto text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                                <div className="w-12 h-12 bg-white rounded flex-shrink-0 overflow-hidden border">
                                    {selectedProduct.images && selectedProduct.images[0] ? (
                                        <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{selectedProduct.name}</p>
                                    <p className="text-sm text-gray-500">Regular Price: ৳{selectedProduct.price}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="ml-auto text-sm text-blue-600 hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label className="block text-sm font-medium mb-1">Sale Price (৳)</label>
                                <input
                                    type="number"
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 mb-4"
                                    placeholder="Enter discounted price"
                                    autoFocus
                                />
                                {salePrice && Number(salePrice) >= selectedProduct.price && (
                                    <p className="text-red-500 text-xs mb-4">Must be lower than ৳{selectedProduct.price}</p>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProduct(null)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || (salePrice && Number(salePrice) >= selectedProduct.price)}
                                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Add to Sale
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
