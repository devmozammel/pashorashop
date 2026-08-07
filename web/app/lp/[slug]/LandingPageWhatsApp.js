"use client";
import { useState } from "react";

export default function WhatsAppOrderForm({ productName, productPrice, productImage, waNumber = "8801613134043" }) {
    const [form, setForm] = useState({ name: "", phone: "", address: "", qty: 1, note: "" });
    const [step, setStep] = useState("form"); // form | sending | done
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "নাম দিন";
        if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 11) e.phone = "সঠিক ফোন নম্বর দিন";
        if (!form.address.trim()) e.address = "ঠিকানা দিন";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setStep("sending");

        const totalPrice = productPrice > 0 ? `৳${productPrice.toLocaleString()} × ${form.qty} = ৳${(productPrice * form.qty).toLocaleString()}` : "মূল্য নিশ্চিত করুন";

        const msg =
`🛒 *নতুন অর্ডার — Authentic Bazar*
━━━━━━━━━━━━━━━━━━━━
📦 *পণ্য:* ${productName}
💰 *মূল্য:* ${totalPrice}
🔢 *পরিমাণ:* ${form.qty}টি
━━━━━━━━━━━━━━━━━━━━
👤 *নাম:* ${form.name}
📱 *ফোন:* ${form.phone}
📍 *ঠিকানা:* ${form.address}${form.note ? `\n📝 *নোট:* ${form.note}` : ""}
━━━━━━━━━━━━━━━━━━━━
✅ ক্যাশ অন ডেলিভারি
🚚 দ্রুত ডেলিভারি নিশ্চিত`;

        setTimeout(() => {
            const url = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(msg)}`;
            window.open(url, "_blank");
            setStep("done");
        }, 800);
    };

    const inputClass = (field) =>
        `w-full bg-white/5 border ${errors[field] ? "border-red-400/60" : "border-white/10"} rounded-2xl px-4 py-3.5 text-white placeholder-white/30 text-sm outline-none focus:border-green-400/60 focus:bg-white/10 transition-all duration-200`;

    if (step === "done") {
        return (
            <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center text-4xl mb-5 animate-bounce">
                    ✅
                </div>
                <h3 className="text-2xl font-black text-white mb-2">WhatsApp খুলছে!</h3>
                <p className="text-white/50 text-sm max-w-xs">আপনার অর্ডার বার্তা রেডি। WhatsApp-এ পাঠিয়ে দিন।</p>
                <button
                    onClick={() => { setStep("form"); setForm({ name: "", phone: "", address: "", qty: 1, note: "" }); }}
                    className="mt-8 text-green-400 text-sm border border-green-400/30 px-6 py-2.5 rounded-xl hover:bg-green-400/10 transition-colors"
                >
                    নতুন অর্ডার করুন
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block tracking-wider uppercase">আপনার নাম *</label>
                <input
                    type="text"
                    placeholder="যেমন: মোহাম্মদ আলী"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                    className={inputClass("name")}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block tracking-wider uppercase">মোবাইল নম্বর *</label>
                <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                    className={inputClass("phone")}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block tracking-wider uppercase">ঠিকানা (জেলা ও বিস্তারিত) *</label>
                <textarea
                    rows={2}
                    placeholder="যেমন: ঢাকা, মিরপুর ১০, বাসা নং ১২..."
                    value={form.address}
                    onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors({ ...errors, address: "" }); }}
                    className={`${inputClass("address")} resize-none`}
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Qty */}
            <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block tracking-wider uppercase">পরিমাণ</label>
                <div className="flex items-center gap-0 border border-white/10 rounded-2xl overflow-hidden w-36 bg-white/5">
                    <button type="button" onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })}
                        className="w-11 h-11 flex items-center justify-center text-white/70 hover:bg-white/10 text-lg transition-colors font-bold">−</button>
                    <span className="flex-1 text-center text-white font-black text-base">{form.qty}</span>
                    <button type="button" onClick={() => setForm({ ...form, qty: form.qty + 1 })}
                        className="w-11 h-11 flex items-center justify-center text-white/70 hover:bg-white/10 text-lg transition-colors font-bold">+</button>
                </div>
            </div>

            {/* Note (optional) */}
            <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block tracking-wider uppercase">অতিরিক্ত নোট (ঐচ্ছিক)</label>
                <input
                    type="text"
                    placeholder="যেমন: রঙ, সাইজ বা বিশেষ নির্দেশনা..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className={inputClass("note")}
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={step === "sending"}
                className="w-full flex items-center justify-center gap-3 text-white font-black text-base py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70"
                style={{ background: step === "sending" ? "#1a7a38" : "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 8px 30px rgba(37, 211, 102, 0.3)" }}
            >
                {step === "sending" ? (
                    <>
                        <span className="animate-spin text-xl">⏳</span>
                        <span>WhatsApp-এ পাঠানো হচ্ছে...</span>
                    </>
                ) : (
                    <>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp-এ অর্ডার করুন</span>
                    </>
                )}
            </button>

            <p className="text-center text-white/30 text-xs pt-1">
                🔒 আপনার তথ্য সম্পূর্ণ সুরক্ষিত • ক্যাশ অন ডেলিভারিতে পে করুন
            </p>
        </form>
    );
}
