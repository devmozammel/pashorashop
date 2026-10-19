"use client";
import { useState, useEffect } from "react";

export default function WhatsAppOrderForm({
    product,
    productName,
    productPrice = 0,
    productImage,
    waNumber = "8801613134043",
    theme = "dark"
}) {
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
    const [step, setStep] = useState("form");
    const [errors, setErrors] = useState({});
    const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);

    const isLight = theme === "light";

    const handleFormFocus = () => {
        if (!hasInitiatedCheckout) {
            setHasInitiatedCheckout(true);
            const priceVal = Number(productPrice || product?.salePrice || product?.price || 0);
            import("@/lib/ttpixel").then(tt => {
                tt.event("InitiateCheckout", {
                    contents: [{
                        content_id: product?.id || "product",
                        content_type: "product",
                        content_name: productName || product?.name,
                        quantity: 1,
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
    const subtotal = (productPrice || 0) * form.qty;
    const grandTotal = subtotal + deliveryFee;

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "আপনার নাম লিখুন";
        const cleanPhone = form.phone.replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
            e.phone = "সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)";
        }
        if (!form.address.trim()) e.address = "সম্পূর্ণ ডেলিভারি ঠিকানা দিন";
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
            let targetPrice = Math.round(Number(productPrice || product?.salePrice || product?.price || 0));

            // If product ID is not directly passed on landing page, fetch fallback product
            if (!targetProductId) {
                try {
                    const pRes = await fetch("/api/products?limit=1");
                    const pData = await pRes.json();
                    const firstProd = Array.isArray(pData) ? pData[0] : (pData?.products?.[0] || null);
                    if (firstProd?.id) {
                        targetProductId = firstProd.id;
                        if (!targetPrice) targetPrice = Math.round(Number(firstProd.salePrice || firstProd.price || 0));
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
                                price: targetPrice,
                                salePrice: targetPrice > 0 ? targetPrice : null
                            },
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
                } else {
                    console.error("[LandingPageWhatsApp] Checkout API Error:", data);
                }
            }
        } catch (err) {
            console.error("[LandingPageWhatsApp] Failed to create order:", err);
        }

        // Track Conversion Events for TikTok & Facebook
        try {
            const targetProdId = targetProductId || product?.id || "product";
            const targetProdName = targetProductName || product?.name || productName;
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
                            price: Number(targetPrice || productPrice || 0)
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

        const areaLabel = form.area === "inside" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে";
        const totalText = productPrice > 0
            ? `৳${grandTotal.toLocaleString()}`
            : "মূল্য নিশ্চিত করুন";

        const msg =
`🛒 *নতুন অর্ডার : Pashora Shop*
━━━━━━━━━━━━━━━━━━━━
${orderNumber ? `🆔 *অর্ডার নম্বর:* ${orderNumber}\n` : ""}📦 *পণ্য:* ${productName}
🔢 *পরিমাণ:* ${form.qty} টি
💰 *পণ্যের দাম:* ৳${subtotal.toLocaleString()}
🚚 *ডেলিভারি চার্জ:* ৳${deliveryFee} (${areaLabel})
💳 *সর্বমোট:* ${totalText}
━━━━━━━━━━━━━━━━━━━━
👤 *নাম:* ${form.name.trim()}
📱 *ফোন:* ${cleanPhone}
📍 *ঠিকানা:* ${form.address.trim()}${form.note.trim() ? `\n📝 *নোট:* ${form.note.trim()}` : ""}
━━━━━━━━━━━━━━━━━━━━
✅ ক্যাশ অন ডেলিভারি | Pashora Shop`;

        setTimeout(() => {
            window.open(`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(msg)}`, "_blank");
            setStep("done");
        }, 600);
    };

    const border = (field) => errors[field]
        ? "border-rose-500 ring-1 ring-rose-500"
        : isLight ? "border-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" : "border-white/10 focus:border-green-400/60";

    const inputBase = isLight
        ? "w-full bg-zinc-50 text-zinc-900 placeholder-zinc-400 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all duration-200 border"
        : "w-full bg-white/5 text-white placeholder-white/30 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all duration-200 border";

    const labelClass = isLight ? "text-zinc-600 text-xs font-black mb-1.5 block tracking-wider uppercase" : "text-white/70 text-xs font-black mb-1.5 block tracking-wider uppercase";
    const errorClass = "text-rose-500 text-xs mt-1 font-medium";

    if (step === "done") {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-4xl mb-5 animate-bounce">
                    ✅
                </div>
                <h3 className={`text-xl font-black mb-2 ${isLight ? "text-zinc-900" : "text-white"}`}>WhatsApp খুলছে!</h3>
                <p className={`text-sm max-w-xs ${isLight ? "text-zinc-500" : "text-white/60"}`}>আপনার অর্ডার বার্তা প্রস্তুত — অনুগ্রহ করে WhatsApp মেসেজটি Send করুন।</p>
                <button
                    onClick={() => { setStep("form"); setForm({ name: "", phone: "", address: "", area: "inside", qty: 1, note: "" }); }}
                    className="mt-7 text-sm border px-6 py-2.5 rounded-xl transition-colors font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                    নতুন অর্ডার করুন
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} onFocus={handleFormFocus} className="space-y-4">
            {/* Name */}
            <div>
                <label className={labelClass}>আপনার নাম *</label>
                <input
                    type="text"
                    placeholder="যেমন: মোহাম্মদ আলী"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                    className={`${inputBase} ${border("name")}`}
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
                <label className={labelClass}>মোবাইল নম্বর *</label>
                <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                    className={`${inputBase} ${border("phone")}`}
                />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
                <label className={labelClass}>ঠিকানা *</label>
                <textarea
                    rows={2}
                    placeholder="জেলা, উপজেলা, বাড়ি নং/রোড নং..."
                    value={form.address}
                    onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors({ ...errors, address: "" }); }}
                    className={`${inputBase} ${border("address")} resize-none`}
                />
                {errors.address && <p className={errorClass}>{errors.address}</p>}
            </div>

            {/* Delivery Area Options */}
            <div>
                <label className={labelClass}>ডেলিভারি এলাকা *</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, area: "inside" })}
                        className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all duration-200 text-left select-none outline-none ${
                            form.area === "inside"
                                ? isLight
                                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600 shadow-sm"
                                    : "border-emerald-400 bg-emerald-950/40 text-white ring-1 ring-emerald-400 shadow-sm"
                                : isLight
                                    ? "border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-700"
                                    : "border-white/10 bg-white/5 hover:border-white/20 text-white/80"
                        }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">📍 ঢাকার ভেতরে</span>
                            <span className={`font-black text-xs ${form.area === "inside" ? (isLight ? "text-emerald-700" : "text-emerald-400") : ""}`}>
                                ৳{insideFee}
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setForm({ ...form, area: "outside" })}
                        className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all duration-200 text-left select-none outline-none ${
                            form.area === "outside"
                                ? isLight
                                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600 shadow-sm"
                                    : "border-emerald-400 bg-emerald-950/40 text-white ring-1 ring-emerald-400 shadow-sm"
                                : isLight
                                    ? "border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-700"
                                    : "border-white/10 bg-white/5 hover:border-white/20 text-white/80"
                        }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">🚚 ঢাকার বাইরে</span>
                            <span className={`font-black text-xs ${form.area === "outside" ? (isLight ? "text-emerald-700" : "text-emerald-400") : ""}`}>
                                ৳{outsideFee}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Qty */}
            <div>
                <label className={labelClass}>পরিমাণ</label>
                <div className={`inline-flex items-center rounded-2xl overflow-hidden border ${isLight ? "border-zinc-200 bg-zinc-50" : "border-white/10 bg-white/5"}`}>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })}
                        className={`w-12 h-12 flex items-center justify-center text-lg font-black transition-colors ${isLight ? "text-zinc-500 hover:bg-zinc-100" : "text-white/60 hover:bg-white/10"}`}
                    >
                        −
                    </button>
                    <span className={`w-12 text-center font-black text-base ${isLight ? "text-zinc-900" : "text-white"}`}>{form.qty}</span>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, qty: form.qty + 1 })}
                        className={`w-12 h-12 flex items-center justify-center text-lg font-black transition-colors ${isLight ? "text-zinc-500 hover:bg-zinc-100" : "text-white/60 hover:bg-white/10"}`}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Note */}
            <div>
                <label className={labelClass}>বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                <input
                    type="text"
                    placeholder="রঙ, সাইজ বা যেকোনো নোট..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className={`${inputBase} ${border("note")}`}
                />
            </div>

            {/* Price Breakdown Card */}
            {productPrice > 0 && (
                <div className={`p-4 rounded-2xl border space-y-1.5 text-xs ${isLight ? "bg-emerald-50/40 border-emerald-100 text-zinc-700" : "bg-white/5 border-white/10 text-white/80"}`}>
                    <div className="flex justify-between">
                        <span>পণ্যের দাম ({form.qty} টি):</span>
                        <span className="font-semibold">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ডেলিভারি চার্জ ({form.area === "inside" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"}):</span>
                        <span className="font-semibold">৳{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between pt-2 border-t font-black text-sm ${isLight ? "border-emerald-200 text-emerald-950" : "border-white/10 text-white"}`}>
                        <span>সর্বমোট মূল্য:</span>
                        <span className={isLight ? "text-emerald-600 font-extrabold" : "text-emerald-400 font-extrabold"}>৳{grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={step === "sending"}
                className="w-full flex items-center justify-center gap-3 text-white font-black text-base py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-2 shadow-lg cursor-pointer"
                style={{
                    background: step === "sending" ? "#1a7a38" : "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
                    boxShadow: "0 8px 30px rgba(37,211,102,0.25)"
                }}
            >
                {step === "sending" ? (
                    <><span className="animate-spin">⏳</span><span>প্রসেস করা হচ্ছে...</span></>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp এ অর্ডার করুন</span>
                    </>
                )}
            </button>

            <p className={`text-center text-xs pt-1 ${isLight ? "text-zinc-400" : "text-white/30"}`}>
                🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ • পণ্য পেয়ে পেমেন্ট করুন
            </p>
        </form>
    );
}
