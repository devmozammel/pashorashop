import { prisma } from "@/lib/prisma";

async function getSiteName() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: "store_settings" } });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            return parsed.siteName || "Authentic Bazar";
        }
    } catch (_) { }
    return "Authentic Bazar";
}

export async function generateMetadata() {
    const siteName = await getSiteName();
    return {
        title: `Return & Replacement Policy | ${siteName}`,
        description: "Everything you need to know about returning or exchanging items.",
    };
}

export default async function ReturnPolicyPage() {
    const siteName = await getSiteName();

    return (
        <div className="min-h-screen bg-gray-50 py-12 md:py-20">
            <div className="container px-4 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Return & Replacement Policy
                    </h1>
                    <p className="text-gray-500">
                        Information on how to return or exchange items purchased from us.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">

                    {/* BENGALI SECTION */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold tracking-widest uppercase">বাংলা</span>
                            <h2 className="text-2xl font-bold text-gray-900">রিটার্ন ও রিপ্লেসমেন্ট নীতি ({siteName})</h2>
                        </div>

                        <div className="prose max-w-none text-gray-600 space-y-6 text-[15px] leading-relaxed">
                            <p className="text-gray-800 font-medium text-lg border-l-4 border-red-500 pl-4 bg-gray-50 py-3 pr-4 rounded-r-xl">
                                {siteName} সবসময় চেষ্টা করে আপনার হাতে নির্ভুল ও ভালো মানের পণ্য পৌঁছে দিতে। তারপরও কোনো কারণে পণ্য ক্ষতিগ্রস্ত হলে বা আপনার প্রত্যাশার সঙ্গে না মিললে চিন্তার কিছু নেই। আমাদের রয়েছে সহজ ও ঝামেলাহীন রিটার্ন ও রিপ্লেসমেন্ট নীতি।
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">রিটার্ন/রিপ্লেসমেন্ট করতে হলে যা যা শর্ত মানতে হবে:</h3>
                            <ul className="space-y-3 list-none pl-0">
                                {["ডেলিভারি পাওয়ার ৩ দিনের মধ্যে আমাদের জানাতে হবে।",
                                    "পণ্য অবশ্যই ব্যবহার না করা থাকতে হবে এবং ট্যাগ/প্যাকেজিং অক্ষত থাকতে হবে।",
                                    "পণ্যের সাথে ফ্রি গিফট/প্রোমো আইটেম থাকলে সেটিও ফেরত দিতে হবে।",
                                    `রিটার্ন/রিপ্লেসমেন্ট ${siteName} টিমের যাচাই/ইন্সপেকশন সাপেক্ষে গ্রহণ করা হবে।`,
                                    "স্টকে থাকলে রিপ্লেসমেন্ট দেওয়া হবে, স্টকে না থাকলে রিফান্ড করা হবে।",
                                    "ডেলিভারি চার্জ ও COD চার্জ রিফান্ডের আওতায় পড়বে না (নন-রিফান্ডেবল)।"].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">কোন কোন কারণে রিটার্ন/রিপ্লেসমেন্ট করা যাবে:</h3>
                            <ul className="space-y-3 list-none pl-0">
                                {[
                                    "পণ্য ক্ষতিগ্রস্ত/ত্রুটিপূর্ণ হলে।",
                                    "ভুল সাইজ পাঠানো হলে (শুধু ইনভয়েসে উল্লেখিত সাইজের সাথে ডেলিভারির সাইজ না মিললে)।",
                                    "রঙে পার্থক্য হলে।",
                                    "প্রিন্টে ভুল হলে (ডিজাইন মিসম্যাচ, ভুল প্লেসমেন্ট ইত্যাদি)।",
                                    "ভুল পণ্য পাঠানো হলে।"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">রিটার্ন প্রক্রিয়া (How to Return):</h3>
                            <p>ডেলিভারি পাওয়ার ৩ দিনের মধ্যে আমাদের সাথে যোগাযোগ করুন:</p>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                                <p className="font-semibold text-gray-800">ফোন: <a href="tel:01600995299" className="text-red-600 hover:underline">01600995299</a></p>
                                <p className="font-semibold text-gray-800">ইমেইল: <a href="mailto:authenticbazarshop@gmail.com" className="text-red-600 hover:underline">authenticbazarshop@gmail.com</a></p>
                            </div>
                            <p>আমরা পণ্য সংগ্রহ/গ্রহণ করার পর যাচাই করব এবং কারণ সঠিক হলে আপনাকে নতুন পণ্য দেওয়া হবে অথবা রিফান্ড দেওয়া হবে।</p>

                            <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 pt-4 border-t border-gray-100">রিফান্ড নীতি ({siteName})</h3>
                            <ul className="space-y-3 list-none pl-0">
                                {[
                                    "রিটার্ন যাচাই শেষ হওয়ার পর রিফান্ড প্রক্রিয়া শুরু হবে।",
                                    "স্টকে রিপ্লেসমেন্ট না থাকলে পূর্ণ টাকা রিফান্ড করা হবে।",
                                    "ডেলিভারি চার্জ ও COD চার্জ ফেরতযোগ্য নয়।",
                                    "COD অর্ডারের ক্ষেত্রে সাধারণত রিফান্ড প্রযোজ্য নয়, কারণ টাকা আগে পরিশোধ করা হয়নি।",
                                    "অনলাইন পেমেন্ট (কার্ড/মোবাইল ব্যাংকিং/ব্যাংক ট্রান্সফার) হলে সেই মাধ্যমেই রিফান্ড দেওয়া হবে।",
                                    "প্রযুক্তিগত সমস্যায় যদি দ্বিগুণ চার্জ কেটে যায়, অতিরিক্ত টাকা ফেরত দেওয়া হবে।",
                                    "রিফান্ড সাধারণত ৭–১০ কর্মদিবসের মধ্যে সম্পন্ন হয়। বিলম্ব হলে আমাদের ইমেইল করুন: authenticbazarshop@gmail.com"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="block w-full h-px bg-gray-200 my-12 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-gray-400">♦</span>
                    </div>

                    {/* ENGLISH SECTION */}
                    <div>
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-bold tracking-widest uppercase">English</span>
                            <h2 className="text-2xl font-bold text-gray-900">Return & Replacement Policy ({siteName})</h2>
                        </div>

                        <div className="prose max-w-none text-gray-600 space-y-6 text-[15px] leading-relaxed">
                            <p className="text-gray-800 font-medium text-lg border-l-4 border-gray-900 pl-4 bg-gray-50 py-3 pr-4 rounded-r-xl">
                                It’s rare that our customers receive damaged or incorrect products. However, if something goes wrong, {siteName} offers a simple return & replacement option to ensure customer trust.
                            </p>

                            <p>If you are unsatisfied with your order, you may return or exchange it as long as your item meets the following criteria:</p>

                            <ul className="space-y-3 list-none pl-0">
                                {[
                                    "The request is made within 03 days from the delivery date.",
                                    "Items must be unused, in original condition, with all original tags and packaging intact (not broken or tampered).",
                                    "If your order included any free promotional item, it must also be returned.",
                                    `Refund/replacement requests are subject to inspection by the ${siteName} team.`,
                                    "Replacement depends on stock availability. If out of stock, you will receive a full refund.",
                                    "Shipping charge and Cash on Delivery (COD) charge are non-refundable."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-black shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Reasons for Return & Replacement:</h3>
                            <ul className="space-y-3 list-none pl-0">
                                {[
                                    "Product is damaged, defective, or not as described.",
                                    "Size mismatch (only if delivered size does not match the size mentioned in the invoice).",
                                    "Color mismatch.",
                                    "Wrong print/design issue (wrong placement, mismatch, etc.).",
                                    "Wrong product sent."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-black shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">How to Return:</h3>
                            <p>Contact us within 03 days after receiving your order:</p>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                                <p className="font-semibold text-gray-800">Phone: <a href="tel:01600995299" className="text-gray-900 hover:underline">01600995299</a></p>
                                <p className="font-semibold text-gray-800">Email: <a href="mailto:authenticbazarshop@gmail.com" className="text-gray-900 hover:underline">authenticbazarshop@gmail.com</a></p>
                            </div>
                            <p>After we receive/pick up your return, we will perform a quality check and if valid, we will replace the item or proceed with a refund.</p>

                            <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 pt-4 border-t border-gray-100">Refund Policy ({siteName})</h3>
                            <ul className="space-y-3 list-none pl-0">
                                {[
                                    "Refunds are processed after the returned item passes inspection.",
                                    "If replacement stock is unavailable, a full refund will be issued.",
                                    "Shipping and COD convenience charges are non-refundable.",
                                    "If you selected Cash on Delivery (COD), there may be no refund since payment wasn’t made in advance.",
                                    "For online payments (Card/Mobile Banking/Bank Transfer), refunds will be issued to the same payment method.",
                                    "If you are charged twice due to a technical error, the extra amount will be refunded.",
                                    "Refunds are usually completed within 7–10 working days. If you don’t receive your refund within this time, contact: authenticbazarshop@gmail.com"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-black shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
