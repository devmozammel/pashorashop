"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { 
    Users, Plus, Trash2, ArrowLeft, Loader2, Info, Search, Coins, ShoppingBag, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminCreateOrderPage() {
    const router = useRouter();
    
    // Page states
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Customer / Shipping states
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("Dhaka");
    const [deliveryArea, setDeliveryArea] = useState("INSIDE_DHAKA");
    const [orderSource, setOrderSource] = useState("WA"); // WA (WhatsApp), FB (Facebook), PH (Phone), MAN (Manual)

    // Financial override states
    const [deliveryFee, setDeliveryFee] = useState(60); // Default inside Dhaka
    const [discount, setDiscount] = useState(0);
    const [advancePayment, setAdvancePayment] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [paymentStatus, setPaymentStatus] = useState("PENDING");
    const [adminNote, setAdminNote] = useState("");

    // Selected items state
    const [selectedItems, setSelectedItems] = useState([]);

    // Product search / selector states
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemPriceOverride, setItemPriceOverride] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoadingProducts(true);
            const res = await fetch("/api/admin/products");
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            }
        } catch (error) {
            toast.error("Failed to load products registry");
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Auto-update delivery fee when delivery area changes
    const handleDeliveryAreaChange = (val) => {
        setDeliveryArea(val);
        if (val === "INSIDE_DHAKA") {
            setDeliveryFee(60);
        } else {
            setDeliveryFee(120);
        }
    };

    // Filter products list based on search term
    const filteredProducts = products.filter(p => 
        p.isActive && (
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
        )
    );

    // When product changes, reset variant selection and default price
    const handleProductSelect = (pId) => {
        const prod = products.find(p => p.id === pId);
        setSelectedProduct(prod);
        setSelectedVariant(null);
        setItemQty(1);
        if (prod) {
            setItemPriceOverride(prod.salePrice || prod.price);
        } else {
            setItemPriceOverride("");
        }
    };

    // When variant changes, adjust pricing
    const handleVariantSelect = (vId) => {
        if (!selectedProduct) return;
        const v = selectedProduct.variants.find(varnt => varnt.id === vId);
        setSelectedVariant(v);
        if (v) {
            setItemPriceOverride(v.salePrice || v.price || selectedProduct.salePrice || selectedProduct.price);
        }
    };

    // Add item to shopping list
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            toast.error("Please select a product first");
            return;
        }

        if (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant) {
            toast.error("This product has sizes/colors. Please select a variant.");
            return;
        }

        const price = Number(itemPriceOverride) || selectedProduct.salePrice || selectedProduct.price;
        const quantity = Number(itemQty);

        // Check duplicate
        const isDuplicate = selectedItems.some(item => 
            item.productId === selectedProduct.id && 
            item.variantId === (selectedVariant ? selectedVariant.id : null)
        );

        if (isDuplicate) {
            toast.error("Product item is already added. You can adjust the quantity in the list below.");
            return;
        }

        const newItem = {
            productId: selectedProduct.id,
            variantId: selectedVariant ? selectedVariant.id : null,
            name: selectedProduct.name,
            variantName: selectedVariant ? `${selectedVariant.size || ""} ${selectedVariant.color || ""}`.trim() : "",
            quantity,
            unitPrice: price,
            productPrice: selectedProduct.price,
            image: selectedProduct.productImages?.[0]?.url || ""
        };

        setSelectedItems([...selectedItems, newItem]);
        
        // Reset selections
        setSelectedProduct(null);
        setSelectedVariant(null);
        setProductSearch("");
        setItemQty(1);
        setItemPriceOverride("");
        toast.success("Product added to list!");
    };

    // Remove item from list
    const handleRemoveItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    // Edit item quantity
    const handleQtyChange = (index, newQty) => {
        if (newQty < 1) return;
        const updated = selectedItems.map((item, i) => {
            if (i === index) {
                return { ...item, quantity: Number(newQty) };
            }
            return item;
        });
        setSelectedItems(updated);
    };

    // Edit item unit price override
    const handlePriceChange = (index, newPrice) => {
        const updated = selectedItems.map((item, i) => {
            if (i === index) {
                return { ...item, unitPrice: Number(newPrice) };
            }
            return item;
        });
        setSelectedItems(updated);
    };

    // Math summaries
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const total = subtotal + Number(deliveryFee) - Number(discount);
    const dueAmount = total - Number(advancePayment);

    // Submit order creation
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName || !phone || !address) {
            toast.error("Customer details (Name, Phone, Address) are required");
            return;
        }

        if (selectedItems.length === 0) {
            toast.error("Please add at least one product to the order");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName,
                    phone,
                    address,
                    city,
                    deliveryArea,
                    deliveryFee: Number(deliveryFee),
                    discount: Number(discount),
                    advancePayment: Number(advancePayment),
                    paymentMethod,
                    paymentStatus,
                    adminNote,
                    items: selectedItems,
                    source: orderSource
                })
            });

            const json = await res.json();
            if (json.ok) {
                toast.success("Order created successfully!");
                router.push("/admin/orders");
            } else {
                toast.error(json.message || "Failed to create order");
            }
        } catch (error) {
            toast.error("Server connection error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AdminShell title="Create Manual Order">
            <div className="space-y-6">
                
                {/* Back Link Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="p-2 bg-white border hover:bg-gray-50 rounded-lg text-gray-700 transition">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Manual Order / এন্ট্রি ফরম</h2>
                        <p className="text-xs text-gray-500">Log customer orders coming from WhatsApp, Facebook Page, or Phone Calls here.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Customer Form & Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Customer Information Card */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" /> Customer & Shipping Info
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="e.g. Rahim Uddin"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. 017XXXXXXXX"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Delivery Address *</label>
                                <textarea
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. House 12, Road 4, Sector 7, Uttara"
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="e.g. Dhaka"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shipping Area</label>
                                    <select
                                        value={deliveryArea}
                                        onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="INSIDE_DHAKA">Inside Dhaka (৳৬০)</option>
                                        <option value="OUTSIDE_DHAKA">Outside Dhaka (৳১২০)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Source / চ্যানেল</label>
                                    <select
                                        value={orderSource}
                                        onChange={(e) => setOrderSource(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-blue-700"
                                    >
                                        <option value="WA">WhatsApp (WA-)</option>
                                        <option value="FB">Facebook Page (FB-)</option>
                                        <option value="PH">Phone Call (PH-)</option>
                                        <option value="MAN">Other Manual (MAN-)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Order Options Card */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-500" /> Payment & Extra Charges
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Fee (BDT)</label>
                                    <input
                                        type="number"
                                        value={deliveryFee}
                                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount (BDT)</label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Advance Paid (BDT)</label>
                                    <input
                                        type="number"
                                        value={advancePayment}
                                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Status</label>
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="PARTIAL_PAID">Partial Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="COD">Cash On Delivery (COD)</option>
                                        <option value="BKASH">bKash</option>
                                        <option value="NAGAD">Nagad</option>
                                        <option value="BANK">Bank Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Private Note</label>
                                    <input
                                        type="text"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="e.g. Customer requested call before delivery."
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Added Items List */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Products Added to Order
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 border-b text-xs font-semibold uppercase tracking-wider bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Product Name</th>
                                            <th className="px-4 py-3">Variant</th>
                                            <th className="px-4 py-3 text-center w-24">Qty</th>
                                            <th className="px-4 py-3 text-right w-32">Price Override</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3 text-center w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.variantName ? (
                                                        <span className="bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded font-medium border border-blue-100">{item.variantName}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">None</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQtyChange(index, e.target.value)}
                                                        className="w-16 p-1 border rounded text-center text-sm font-semibold bg-white"
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1 text-xs text-gray-400">৳</span>
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                                            className="w-24 p-1 pl-5 border rounded text-right text-sm font-semibold bg-white"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                                                    {formatCurrency(item.unitPrice * item.quantity)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedItems.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">Use the right column selector to search and add products to this order list!</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Product Selector & Bill Summary */}
                    <div className="space-y-6">
                        
                        {/* Search & Add Products Form */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Select Product / প্রোডাক্ট যোগ করুন</h3>
                            
                            {isLoadingProducts ? (
                                <div className="flex justify-center items-center py-6 gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    <span className="text-xs text-gray-400">Loading products...</span>
                                </div>
                            ) : (
                                <form onSubmit={handleAddItem} className="space-y-4">
                                    
                                    {/* Product Dropdown Selector */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Search & Select Product</label>
                                        <div className="relative">
                                            <select
                                                onChange={(e) => handleProductSelect(e.target.value)}
                                                value={selectedProduct ? selectedProduct.id : ""}
                                                className="w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">-- Choose Product --</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ""} - {formatCurrency(p.salePrice || p.price)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Variant selector (Visible only if product has variants) */}
                                    {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Select Variant (Size / Color) *</label>
                                            <select
                                                required
                                                onChange={(e) => handleVariantSelect(e.target.value)}
                                                value={selectedVariant ? selectedVariant.id : ""}
                                                className="w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">-- Select Size / Color --</option>
                                                {selectedProduct.variants
                                                    .filter(v => v.isActive)
                                                    .map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.size || ""} {v.color || ""} (Stock: {v.stock}) {v.priceAdjustment ? `(+৳${v.priceAdjustment})` : ""}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}

                                    {/* Display Stock status */}
                                    {selectedProduct && (
                                        <div className="bg-gray-50 border p-3 rounded-lg flex justify-between text-xs font-semibold text-gray-600">
                                            <span>Base Stock: {selectedProduct.stock}</span>
                                            {selectedVariant && (
                                                <span className="text-blue-600">Variant Stock: {selectedVariant.stock}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Qty & Price Override input */}
                                    {selectedProduct && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Qty</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={itemQty}
                                                    onChange={(e) => setItemQty(Number(e.target.value))}
                                                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Price (Override)</label>
                                                <input
                                                    type="number"
                                                    value={itemPriceOverride}
                                                    onChange={(e) => setItemPriceOverride(e.target.value)}
                                                    placeholder="BDT"
                                                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!selectedProduct}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-150 disabled:text-gray-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add to Order List
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Bill Breakdown Summary Card */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Order Calculations</h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal (আইটেম মূল্য)</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Delivery Fee (+)</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Discount (-)</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(discount)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 border-t pt-3 font-bold text-base">
                                    <span className="text-gray-900">Total Bill</span>
                                    <span className="text-gray-900">{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Advance Paid (-)</span>
                                    <span className="font-semibold text-green-600">-{formatCurrency(advancePayment)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-3 font-bold text-base">
                                    <span className="text-blue-600">Net Due (কুরিয়ার ক্যাশ)</span>
                                    <span className="text-blue-600">{formatCurrency(dueAmount)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedItems.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-md mt-6"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5" />
                                )}
                                Place Order / এন্ট্রি সম্পন্ন করুন
                            </button>
                        </div>
                        
                    </div>

                </div>

            </div>
        </AdminShell>
    );
}
