"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { 
    Users, Plus, Trash2, ArrowLeft, Loader2, Info, Search, Coins, ShoppingBag, CheckCircle2, Truck
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
    const [orderSource, setOrderSource] = useState("WA"); // WA, FB, PH, MAN

    // Financial override states
    const [deliveryFee, setDeliveryFee] = useState(70);
    const [discount, setDiscount] = useState(0);
    const [advancePayment, setAdvancePayment] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [paymentStatus, setPaymentStatus] = useState("PENDING");
    const [adminNote, setAdminNote] = useState("");
    const [dispatchToSteadfast, setDispatchToSteadfast] = useState(true);

    // Selected items state
    const [selectedItems, setSelectedItems] = useState([]);

    // Product search / selector states
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemPriceOverride, setItemPriceOverride] = useState("");

    const [shippingFees, setShippingFees] = useState({ inside: 70, outside: 130 });

    useEffect(() => {
        fetchProducts();
        fetchShippingSettings();
    }, []);

    const fetchShippingSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            const inside = Number(data.shipping_fee_inside || 70);
            const outside = Number(data.shipping_fee_outside || 130);
            setShippingFees({ inside, outside });
            setDeliveryFee(inside);
        } catch (_) {}
    };

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

    // Auto-detect outside Dhaka when address is typed
    const handleAddressChange = (val) => {
        setAddress(val);
        const lower = val.toLowerCase();
        const outsideKeywords = [
            "নরসিংদী", "narsingdi", "চট্টগ্রাম", "chittagong", "chattogram", 
            "সিলেট", "sylhet", "রাজশাহী", "rajshahi", "খুলনা", "khulna", 
            "বরিশাল", "barisal", "রংপুর", "rangpur", "ময়মনসিংহ", "mymensingh", 
            "কুমিল্লা", "comilla", "বগুড়া", "bogra", "যশোর", "jessore", 
            "ফেনী", "feni", "নোয়াখালী", "noakhali", "কক্সবাজার", "cox", 
            "টাঙ্গাইল", "tangail", "পাবনা", "pabna", "সিরাজগঞ্জ", "sirajganj",
            "গোপালগঞ্জ", "জামালপুর", "ব্রাহ্মণবাড়িয়া", "কুষ্টিয়া", "দিনাজপুর"
        ];

        const isOutside = outsideKeywords.some(k => lower.includes(k));
        if (isOutside && deliveryArea === "INSIDE_DHAKA") {
            setDeliveryArea("OUTSIDE_DHAKA");
            setDeliveryFee(shippingFees.outside);
            // Detect City
            const matchedKeyword = outsideKeywords.find(k => lower.includes(k));
            if (matchedKeyword) {
                const capitalized = matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
                setCity(capitalized);
            }
        }
    };

    // Auto-update delivery fee when delivery area changes
    const handleDeliveryAreaChange = (val) => {
        setDeliveryArea(val);
        if (val === "INSIDE_DHAKA") {
            setDeliveryFee(shippingFees.inside);
        } else {
            setDeliveryFee(shippingFees.outside);
        }
    };

    // When product changes, reset variant selection and default price
    const handleProductSelect = (pId) => {
        const prod = products.find(p => p.id === pId);
        setSelectedProduct(prod || null);
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
        const v = (selectedProduct.variants || []).find(varnt => varnt.id === vId);
        setSelectedVariant(v || null);
        if (v) {
            setItemPriceOverride(v.salePrice || v.price || selectedProduct.salePrice || selectedProduct.price);
        }
    };

    // Helper: Build item object from current selector state
    const getCurrentSelectorItem = () => {
        if (!selectedProduct) return null;
        if (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant) {
            return null; // Variant required
        }
        const price = Number(itemPriceOverride) || selectedProduct.salePrice || selectedProduct.price;
        const quantity = Number(itemQty) || 1;
        return {
            productId: selectedProduct.id,
            variantId: selectedVariant ? selectedVariant.id : null,
            name: selectedProduct.name,
            variantName: selectedVariant ? `${selectedVariant.size || ""} ${selectedVariant.color || ""}`.trim() : "",
            quantity,
            unitPrice: price,
            productPrice: selectedProduct.price,
            image: selectedProduct.productImages?.[0]?.url || ""
        };
    };

    // Add item to shopping list
    const handleAddItem = (e) => {
        if (e) e.preventDefault();
        if (!selectedProduct) {
            toast.error("Please select a product first");
            return;
        }

        if (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant) {
            toast.error("This product has sizes/colors. Please select a variant.");
            return;
        }

        const newItem = getCurrentSelectorItem();
        if (!newItem) return;

        // Check duplicate
        const isDuplicate = selectedItems.some(item => 
            item.productId === newItem.productId && 
            item.variantId === newItem.variantId
        );

        if (isDuplicate) {
            toast.error("This item is already in the list. You can adjust the quantity below.");
            return;
        }

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

    // Math summaries (including preview if product is chosen but not yet clicked add)
    const pendingItem = selectedItems.length === 0 ? getCurrentSelectorItem() : null;
    const pendingSubtotal = pendingItem ? (pendingItem.unitPrice * pendingItem.quantity) : 0;
    
    const itemsSubtotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const subtotal = selectedItems.length > 0 ? itemsSubtotal : pendingSubtotal;

    const rawTotal = subtotal + Number(deliveryFee) - Number(discount);
    const total = Math.max(0, rawTotal);
    const dueAmount = Math.max(0, total - Number(advancePayment));

    // Submit order creation
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!customerName || !phone || !address) {
            toast.error("Customer details (Name, Phone, Address) are required");
            return;
        }

        let finalItems = [...selectedItems];

        // Auto-include currently selected product if user forgot to click "+ Add to Order List"
        if (finalItems.length === 0) {
            if (selectedProduct) {
                const autoItem = getCurrentSelectorItem();
                if (!autoItem) {
                    toast.error("Please select a variant (size/color) for this product.");
                    return;
                }
                finalItems = [autoItem];
            } else {
                toast.error("দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন বা সিলেক্ট করুন");
                return;
            }
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
                    items: finalItems,
                    source: orderSource
                })
            });

            const json = await res.json();
            if (json.ok && json.data) {
                const orderId = json.data.id;
                toast.success("Order created successfully!");

                // Automatic Steadfast Dispatch if checked
                if (dispatchToSteadfast) {
                    try {
                        const dispatchRes = await fetch(`/api/admin/orders/${orderId}/steadfast`, {
                            method: "POST"
                        });
                        const dispatchJson = await dispatchRes.json();
                        if (dispatchJson.ok) {
                            toast.success(`Steadfast Courier-এ বুকিং সফল! ট্র্যাকিং: ${dispatchJson.trackingCode}`);
                        } else {
                            toast.warning(dispatchJson.message || "Order created, but courier booking can be completed from order details.");
                        }
                    } catch {
                        toast.warning("Order created. Steadfast booking can be retried from order details.");
                    }
                }

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

    const hasAnyProduct = selectedItems.length > 0 || Boolean(selectedProduct);

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
                                        placeholder="e.g. ফাতেমা জামান"
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
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Delivery Address *</label>
                                <textarea
                                    required
                                    value={address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                    placeholder="e.g. পলাশ থানা পারুলিয়া মোড় নরসিংদী"
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
                                        placeholder="e.g. Dhaka, Narsingdi"
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
                                        <option value="INSIDE_DHAKA">Inside Dhaka (৳{shippingFees.inside})</option>
                                        <option value="OUTSIDE_DHAKA">Outside Dhaka (৳{shippingFees.outside})</option>
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
                                        onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount (BDT)</label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Advance Paid (BDT)</label>
                                    <input
                                        type="number"
                                        value={advancePayment}
                                        onChange={(e) => setAdvancePayment(Number(e.target.value) || 0)}
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
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600" /> Products Added to Order
                                </h3>
                                {selectedItems.length > 0 && (
                                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        {selectedItems.length} items added
                                    </span>
                                )}
                            </div>

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

                                        {/* Preview of selected product if not yet clicked Add */}
                                        {selectedItems.length === 0 && selectedProduct && (
                                            <tr className="bg-amber-50/50 border border-amber-200">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                        {selectedProduct.name}
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">সিলেক্টেড (অটো যোগ হবে)</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-500">
                                                    {selectedVariant ? `${selectedVariant.size || ""} ${selectedVariant.color || ""}` : "None"}
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-bold text-sm">
                                                    {itemQty}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-semibold text-sm">
                                                    ৳{itemPriceOverride || selectedProduct.salePrice || selectedProduct.price}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                                                    {formatCurrency(pendingSubtotal)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddItem}
                                                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700"
                                                    >
                                                        Add
                                                    </button>
                                                </td>
                                            </tr>
                                        )}

                                        {selectedItems.length === 0 && !selectedProduct && (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                                                    ডানপাশের মেনু থেকে প্রোডাক্ট সিলেক্ট করে যোগ করুন।
                                                </td>
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
                                                className="w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
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
                                                    onChange={(e) => setItemQty(Number(e.target.value) || 1)}
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
                                                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!selectedProduct}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                                    <span className="text-blue-600 font-bold">{formatCurrency(dueAmount)}</span>
                                </div>
                            </div>

                            {/* Steadfast Direct Booking Option */}
                            <div className="pt-3 border-t">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer p-2 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-lg transition">
                                    <input
                                        type="checkbox"
                                        checked={dispatchToSteadfast}
                                        onChange={(e) => setDispatchToSteadfast(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>সরাসরি Steadfast Courier-এ বুকিং করুন</span>
                                </label>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !hasAnyProduct}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-md mt-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> অর্ডার তৈরি হচ্ছে...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" /> Place Order / এন্ট্রি সম্পন্ন করুন
                                    </>
                                )}
                            </button>
                        </div>
                        
                    </div>

                </div>

            </div>
        </AdminShell>
    );
}
