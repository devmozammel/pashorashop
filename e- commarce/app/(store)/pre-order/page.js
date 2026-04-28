"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle2, UploadCloud, FileImage, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ShoppingBag, MessageSquareText } from "lucide-react";

export default function PreOrderPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        details: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [preOrderProducts, setPreOrderProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("products"); // "products" or "request"

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/pre-order-products");
                if (res.ok) {
                    const data = await res.json();
                    setPreOrderProducts(data);
                }
            } catch (err) {
                console.error("Failed to fetch pre-order products:", err);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5MB");
            return;
        }
        
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("phone", formData.phone);
            data.append("details", formData.details);
            if (selectedFile) {
                data.append("file", selectedFile);
            }

            const res = await fetch("/api/pre-order", {
                method: "POST",
                body: data,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to submit request.");
            }

            setSuccess(true);
            setFormData({ name: "", phone: "", details: "" });
            handleRemoveFile();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
                    <p className="text-gray-600 mb-8 max-w-md">
                        Thank you for your pre-order request. Our team will review the details and get back to you shortly regarding availability and pricing.
                    </p>
                    <Button onClick={() => setSuccess(false)} className="rounded-full px-8 bg-black text-white hover:bg-gray-800">
                        Submit Another Request
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Product Sourcing & Pre-Order</h1>
                <p className="text-gray-500 max-w-xl mx-auto text-lg">
                    Discover exclusive products available for pre-order or request something unique just for you.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-10">
                <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
                    <button 
                        onClick={() => setActiveTab("products")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === "products" 
                            ? "bg-white text-black shadow-sm" 
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Available for Pre-Order
                    </button>
                    <button 
                        onClick={() => setActiveTab("request")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === "request" 
                            ? "bg-white text-black shadow-sm" 
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <MessageSquareText className="w-4 h-4" />
                        Custom Request
                    </button>
                </div>
            </div>

            {activeTab === "products" ? (
                <div className="space-y-12">
                    {productsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-3xl" />
                            ))}
                        </div>
                    ) : preOrderProducts.length > 0 ? (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                                {preOrderProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            
                            <div className="mt-16 bg-blue-50 rounded-3xl p-8 border border-blue-100">
                                <div className="max-w-3xl mx-auto text-center">
                                    <h3 className="text-xl font-bold text-blue-900 mb-3">Pre-Order Policy</h3>
                                    <p className="text-blue-700/80 text-sm leading-relaxed">
                                        For all pre-order items, a minimum advance payment of <span className="font-bold">৳100</span> is required to confirm your order. 
                                        Once the product arrives, we will call you for final confirmation. 
                                        If for any reason you decide not to take the product, your ৳100 will be <span className="font-bold underline">fully refunded</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No pre-order products currently available</h3>
                            <p className="text-gray-500">Check back later or submit a custom request below!</p>
                            <Button 
                                onClick={() => setActiveTab("request")}
                                className="mt-6 rounded-full bg-black text-white hover:bg-gray-800"
                            >
                                Submit Custom Request
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 md:p-10 border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <input
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. 017XXXXXXXX"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Details *</label>
                                <textarea
                                    required
                                    name="details"
                                    value={formData.details}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe the product you are looking for (Brand, Color, Size, specific features, etc.)"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Product Image (Optional)</label>
                                
                                {!previewUrl ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-2xl py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-black transition-all group"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                                            <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-black" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-1">Click to upload image</h3>
                                        <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                                    </div>
                                ) : (
                                    <div className="relative border border-gray-200 rounded-2xl p-4 flex items-center gap-4 bg-gray-50">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleRemoveFile}
                                            className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 shadow-sm transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp, image/gif"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full h-14 text-base rounded-xl bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/10 transition-all font-bold"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Request"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
