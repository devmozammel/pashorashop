"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, ShieldCheck, Truck, RotateCcw, Banknote, Sparkles, Phone, MessageSquare } from "lucide-react";

export default function WhatsAppOrderForm({
    product,
    productName,
    productPrice = 0,
    originalPrice = 0,
    productImage,
    waNumber = "8801620778044",
    variants = [],
    theme = "light"
}) {
    const productVariants = variants && variants.length > 0 ? variants : (product?.variants || []);
    const [selectedVariant, setSelectedVariant] = useState(productVariants?.[0] || null);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        area: "inside",
        qty: 1,
        note: ""
    });

    const [settings, setSettings] = useState({
        shipping_fee_inside: "70",
        shipping_fee_outside: "130"
    });

    const [step, setStep] = useState("form"); // "form" | "sending" | "done"
    const [createdOrderNumber, setCreatedOrderNumber] = useState(null);
    const [whatsappLink, setWhatsappLink] = useState("");
    const [errors, setErrors] = useState({});
    const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);

    // Calculate effective unit price with variant adjustment if any
    const baseUnit = Number(productPrice || product?.salePrice || product?.price || 0);
    const variantAdj = Number(selectedVariant?.priceAdjustment || 0);
    const unitPrice = Math.max(0, baseUnit + variantAdj);

    const handleFormFocus = () => {
        if (!hasInitiatedCheckout) {
            setHasInitiatedCheckout(true);
            const priceVal = unitPrice;
            import("@/lib/ttpixel").then(tt => {
                tt.event("InitiateCheckout", {
                    contents: [{
                        content_id: product?.id || "product",
                        content_type: "product",
                        content_name: productName || product?.name,
                        quantity: form.qty,
                        price: priceVal
                    }],
                    value: priceVal,
                    currency: "BDT"
                });
            }).catch(() => {});

            import("@/lib/fpixel").then(fb => {
                fb.event("InitiateCheckout", {
                    content_name: productName || product?.name,
                    content_ids: [product?.id || "product"],
                    content_type: "product",
                    value: priceVal,
                    currency: "BDT"
                });
            }).catch(() => {});
        }
    };

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.shipping_fee_inside || data.shipping_fee_outside) {
                    setSettings((prev) => ({ ...prev, ...data }));
                }
            })
            .catch((err) => console.error("Failed to load delivery settings", err));
    }, []);

    const insideFee = Number(settings.shipping_fee_inside || "70");
    const outsideFee = Number(settings.shipping_fee_outside || "130");
    const deliveryFee = form.area === "inside" ? insideFee : outsideFee;
    const subtotal = unitPrice * form.qty;
    const grandTotal = subtotal + deliveryFee;

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "আপনার সম্পূর্ণ নাম লিখুন";
        const cleanPhone = form.phone.replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
            e.phone = "সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)";
        }
        if (!form.address.trim()) e.address = "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (রোড, বাড়ি বা এলাকা)";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setStep("sending");

        const cleanPhone = form.phone.replace(/\D/g, "");
        let orderNumber = null;

        try {
            const nameParts = form.name.trim().split(" ");
            const firstName = nameParts[0] || "Customer";
            const lastName = nameParts.slice(1).join(" ") || ".";

            let targetProductId = product?.id;
            let targetProductName = product?.name || productName;
            let targetPrice = Math.round(Number(unitPrice || product?.salePrice || product?.price || 1));

            // Fallback product resolution if not bound directly
            if (!targetProductId) {
                try {
                    const pRes = await fetch("/api/products?limit=1");
                    const pData = await pRes.json();
                    const firstProd = Array.isArray(pData) ? pData[0] : (pData?.products?.[0] || null);
                    if (firstProd?.id) {
                        targetProductId = firstProd.id;
                        if (!targetPrice) targetPrice = Math.round(Number(firstProd.salePrice || firstProd.price || 1));
                    }
                } catch (_) {}
            }

            if (targetProductId) {
                const checkoutPayload = {
                    items: [
                        {
                            product: {
                                id: targetProductId,
                                name: targetProductName,
                                price: targetPrice > 0 ? targetPrice : 1,
                                salePrice: targetPrice > 0 ? targetPrice : null
                            },
                            variant: selectedVariant ? {
                                id: selectedVariant.id,
                                size: selectedVariant.size || null,
                                color: selectedVariant.color || null,
                                priceAdjustment: selectedVariant.priceAdjustment || 0
                            } : null,
                            quantity: Math.max(1, Math.round(Number(form.qty || 1)))
                        }
                    ],
                    customer: {
                        firstName,
                        lastName,
                        phone: cleanPhone,
                        address: form.address.trim(),
                        city: form.area === "inside" ? "Dhaka" : "Outside Dhaka",
                        shippingArea: form.area,
                        paymentMethod: "COD"
                    },
                    shippingCost: Math.round(Number(deliveryFee || 70))
                };

                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(checkoutPayload)
                });

                const data = await res.json();
                if (data?.success && data?.orderNumber) {
                    orderNumber = data.orderNumber;
                    setCreatedOrderNumber(orderNumber);
                } else {
                    console.error("[LandingPageWhatsApp] Checkout API Error:", data);
                }
            }
        } catch (err) {
            console.error("[LandingPageWhatsApp] Failed to create order in admin database:", err);
        }

        // Conversion Tracking Events
        try {
            const targetProdId = product?.id || "product";
            const targetProdName = productName || product?.name;
            import("@/lib/ttpixel").then(tt => {
                const ttPayload = {
                    value: Number(grandTotal),
                    currency: "BDT",
                    content_type: "product",
                    contents: [
                        {
                            content_id: targetProdId,
                            content_type: "product",
                            content_name: targetProdName,
                            quantity: Number(form.qty || 1),
                            price: Number(unitPrice || 0)
                        }
                    ]
                };
                tt.event("CompletePayment", ttPayload);
                tt.event("PlaceAnOrder", ttPayload);
            }).catch(() => {});

            import("@/lib/fpixel").then(fb => {
                fb.event("Purchase", {
                    value: Number(grandTotal),
                    currency: "BDT",
                    content_type: "product",
                    content_ids: [targetProdId]
                }, orderNumber || undefined);
            }).catch(() => {});
        } catch (trackErr) {
            console.error("LP Tracking error:", trackErr);
        }

        const areaLabel = form.area === "inside" ? "ঢাকার ভেতরে (৳৭০)" : "ঢাকার বাইরে (৳১৩০)";
        const totalText = `৳${grandTotal.toLocaleString()}`;
        const variantText = selectedVariant
            ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ")
            : null;

        const msg =
`🛒 *নতুন অর্ডার : Pashora Shop*
━━━━━━━━━━━━━━━━━━━━
${orderNumber ? `🆔 *অর্ডার আইডি:* #${orderNumber}\n` : ""}📦 *পণ্য:* ${productName}
${variantText ? `🎨 *ভ্যারিয়েন্ট:* ${variantText}\n` : ""}🔢 *পরিমাণ:* ${form.qty} টি
💰 *পণ্যের মূল্য:* ৳${subtotal.toLocaleString()}
🚚 *ডেলিভারি চার্জ:* ৳${deliveryFee} (${form.area === "inside" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"})
💳 *সর্বমোট বিল:* ${totalText}
━━━━━━━━━━━━━━━━━━━━
👤 *গ্রাহকের নাম:* ${form.name.trim()}
📱 *মোবাইল নম্বর:* ${cleanPhone}
📍 *ডেলিভারি ঠিকানা:* ${form.address.trim()}${form.note.trim() ? `\n📝 *বিশেষ নোট:* ${form.note.trim()}` : ""}
━━━━━━━━━━━━━━━━━━━━
✅ ক্যাশ অন ডেলিভারি | পশোরা শপ`;

        const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(msg)}`;
        setWhatsappLink(waUrl);

        // Immediate WhatsApp redirect & switch step
        setTimeout(() => {
            try {
                window.open(waUrl, "_blank");
            } catch (_) {}
            setStep("done");
        }, 500);
    };

    if (step === "done") {
        return (
            <div className="bg-white rounded-3xl p-6 md:p-10 border border-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.08)] text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="inline-block text-xs font-black tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase mb-2">
                    অর্ডার সফলভাবে গৃহীত হয়েছে
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">
                    ধন্যবাদ, {form.name.trim()}!
                </h3>
                <p className="text-slate-600 text-xs md:text-sm max-w-md mb-4 leading-relaxed">
                    আপনার অর্ডারটি আমাদের ডাটাবেজ ও অ্যাডমিন প্যানেলে সংরক্ষিত হয়েছে {createdOrderNumber ? `(#${createdOrderNumber})` : ""} এবং হোয়াটসঅ্যাপে পাঠানো হয়েছে।
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full max-w-sm text-left mb-6 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                        <span>পণ্য:</span>
                        <span className="font-bold text-slate-900 text-right">{productName}</span>
                    </div>
                    {selectedVariant && (
                        <div className="flex justify-between text-slate-600">
                            <span>ভ্যারিয়েন্ট:</span>
                            <span className="font-bold text-slate-900">{[selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ")}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                        <span>পরিমাণ:</span>
                        <span className="font-bold text-slate-900">{form.qty} টি</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>ডেলিভারি চার্জ:</span>
                        <span className="font-bold text-slate-900">৳{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-slate-900">
                        <span>সর্বমোট মূল্য:</span>
                        <span className="text-emerald-600">৳{grandTotal.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    {whatsappLink && (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-5 rounded-2xl transition-all shadow-md text-sm"
                        >
                            <MessageSquare className="w-4 h-4" />
                            হোয়াটসঅ্যাপে দেখুন
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setStep("form");
                            setForm({ name: "", phone: "", address: "", area: "inside", qty: 1, note: "" });
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl transition-all text-sm"
                    >
                        নতুন অর্ডার করুন
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} onFocus={handleFormFocus} className="space-y-4">
            {/* Color / Variant Selector if available */}
            {productVariants.length > 0 && (
                <div className="pb-2">
                    <label className="text-slate-700 text-xs font-bold mb-2 block uppercase tracking-wider">
                        কালার / ভ্যারিয়েন্ট নির্বাচন করুন:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {productVariants.map((v, i) => {
                            const isSelected = selectedVariant?.id === v.id;
                            const label = [v.color, v.size].filter(Boolean).join(" - ") || `ভ্যারিয়েন্ট ${i + 1}`;
                            return (
                                <button
                                    key={v.id || i}
                                    type="button"
                                    onClick={() => setSelectedVariant(v)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        isSelected
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                    }`}
                                >
                                    {label}
                                    {v.priceAdjustment ? ` (+৳${v.priceAdjustment})` : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Name Input */}
            <div>
                <label className="text-slate-700 text-xs font-bold mb-1.5 block">
                    আপনার সম্পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="যেমন: মোঃ সাকিব হোসেন"
                    value={form.name}
                    onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-all border ${
                        errors.name
                            ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                            : "border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                    }`}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Phone Input */}
            <div>
                <label className="text-slate-700 text-xs font-bold mb-1.5 block">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={form.phone}
                        onChange={(e) => {
                            setForm({ ...form, phone: e.target.value });
                            if (errors.phone) setErrors({ ...errors, phone: "" });
                        }}
                        className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-all border ${
                            errors.phone
                                ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                                : "border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                        }`}
                    />
                </div>
                {errors.phone && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phone}</p>}
            </div>

            {/* Address Input */}
            <div>
                <label className="text-slate-700 text-xs font-bold mb-1.5 block">
                    সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <textarea
                    rows={2}
                    placeholder="বাসা নং, রোড নং, এলাকা, থানা ও জেলা..."
                    value={form.address}
                    onChange={(e) => {
                        setForm({ ...form, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: "" });
                    }}
                    className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-all border resize-none ${
                        errors.address
                            ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                            : "border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                    }`}
                />
                {errors.address && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.address}</p>}
            </div>

            {/* Delivery Area Picker */}
            <div>
                <label className="text-slate-700 text-xs font-bold mb-1.5 block">
                    ডেলিভারি এলাকা নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, area: "inside" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            form.area === "inside"
                                ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-sm"
                                : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs">📍 ঢাকার ভেতরে</span>
                            <span className="text-xs font-black text-emerald-600">৳{insideFee}</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setForm({ ...form, area: "outside" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            form.area === "outside"
                                ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-sm"
                                : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs">🚚 ঢাকার বাইরে</span>
                            <span className="text-xs font-black text-emerald-600">৳{outsideFee}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 text-xs font-bold">পণ্যের পরিমাণ:</span>
                <div className="inline-flex items-center rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })}
                        className="w-9 h-9 flex items-center justify-center text-base font-bold text-slate-600 hover:bg-slate-200/80 transition-colors"
                    >
                        −
                    </button>
                    <span className="w-10 text-center font-black text-sm text-slate-900">{form.qty}</span>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, qty: form.qty + 1 })}
                        className="w-9 h-9 flex items-center justify-center text-base font-bold text-slate-600 hover:bg-slate-200/80 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                    <span>পণ্যের মূল্য ({form.qty} টি):</span>
                    <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ ({form.area === "inside" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"}):</span>
                    <span className="font-bold text-slate-900">৳{deliveryFee}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200/80 font-black text-sm text-slate-900">
                    <span>সর্বমোট প্রদেয় বিল:</span>
                    <span className="text-emerald-700 text-base">৳{grandTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={step === "sending"}
                className="w-full flex items-center justify-center gap-2.5 text-white font-black text-base py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                }}
            >
                {step === "sending" ? (
                    <>
                        <span className="animate-spin text-lg">⏳</span>
                        <span>অর্ডার সম্পন্ন হচ্ছে...</span>
                    </>
                ) : (
                    <>
                        {/* WhatsApp SVG Icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>অর্ডার কনফার্ম করুন (হোয়াটসঅ্যাপ ও ক্যাশ অন ডেলিভারি)</span>
                    </>
                )}
            </button>

            <p className="text-center text-[11px] text-slate-500 pt-1 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>পণ্য হাতে পেয়ে চেক করে টাকা পরিশোধ করুন • ১০০% ক্যাশ অন ডেলিভারি</span>
            </p>
        </form>
    );
}
