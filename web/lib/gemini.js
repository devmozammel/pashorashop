import { prisma } from "@/lib/prisma";
import { getSocialSettings, getStoreBasicConfig } from "@/lib/social-settings";
import { formatBangladeshiPhone } from "@/lib/steadfast";

/**
 * Regex fallback to extract Bangladeshi phone numbers, Dhaka/Outside Dhaka hint, and name/address.
 */
export function extractCustomerInfoFallback(messages = [], fallbackName = "") {
    const combinedText = messages
        .filter((m) => m.direction === "INBOUND")
        .map((m) => m.body || "")
        .join("\n");

    const phoneMatch = combinedText.match(/(?:\+?88)?(01[3-9]\d{8}|\b1[3-9]\d{8}\b)/);
    const phone = phoneMatch ? formatBangladeshiPhone(phoneMatch[0]) : "";

    const lower = combinedText.toLowerCase();
    const isDhaka =
        lower.includes("dhaka") ||
        lower.includes("ঢাকা") ||
        lower.includes("mirpur") ||
        lower.includes("uttara") ||
        lower.includes("dhanmondi") ||
        lower.includes("gulshan") ||
        lower.includes("banani") ||
        lower.includes("mohammadpur") ||
        lower.includes("badda") ||
        lower.includes("motijheel");

    // Heuristic: pick longest line containing address-like words or road/house/district
    const lines = combinedText
        .split(/\r?\n|,/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5);

    let address = "";
    const addressLine = lines.find((l) =>
        /(road|rd|house|flat|sector|block|mirpur|uttara|dhaka|thana|zilla|জেলা|থানা|রোড|বাসা|বাড়ি|ঢাকা|গ্রাম)/i.test(l)
    );
    if (addressLine) {
        address = addressLine;
    }

    return {
        customerName: fallbackName || "",
        phone,
        address,
        city: isDhaka ? "Dhaka" : "",
        deliveryArea: isDhaka ? "INSIDE_DHAKA" : "OUTSIDE_DHAKA",
        productHints: "",
    };
}

/**
 * Build compact live catalog context for Gemini from Prisma.
 */
async function getCatalogContext(queryHint = "") {
    const [products, store] = await Promise.all([
        prisma.product.findMany({
            where: { isActive: true },
            take: 35,
            orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                salePrice: true,
                discountPrice: true,
                stock: true,
                variants: {
                    where: { isActive: true },
                    select: { size: true, color: true, stock: true, price: true, salePrice: true },
                },
            },
        }),
        getStoreBasicConfig(),
    ]);

    const catalogLines = products.map((p) => {
        const effectivePrice = p.salePrice || p.discountPrice || p.price;
        const variantSummary = p.variants?.length
            ? ` | Variants: ${p.variants
                  .slice(0, 6)
                  .map((v) => `${v.size || ""}${v.color ? `/${v.color}` : ""}(Stock:${v.stock})`)
                  .join(", ")}`
            : ` | Stock: ${p.stock}`;
        return `- ${p.name} | Price: ${store.currencySymbol}${effectivePrice}${
            p.price > effectivePrice ? ` (Regular ${store.currencySymbol}${p.price})` : ""
        }${variantSummary}`;
    });

    return { store, products, catalogText: catalogLines.join("\n") };
}

/**
 * Call Google Gemini API to generate a Bengali/Banglish Co-pilot reply draft
 * AND extract structured customer order info from the conversation.
 */
export async function generateGeminiCopilot({ conversation, messages = [] }) {
    const settings = await getSocialSettings();
    const { store, products, catalogText } = await getCatalogContext();
    const fallbackExtract = extractCustomerInfoFallback(messages, conversation?.customerName);

    const latestInbound = [...messages].reverse().find((m) => m.direction === "INBOUND")?.body || "";
    const lowerInbound = latestInbound.toLowerCase();

    // Smart local fallback when Gemini API key is not configured
    const buildFallbackReply = () => {
        const matchedProduct = products.find((p) =>
            lowerInbound.includes(p.name.toLowerCase().slice(0, 8))
        );

        if (/(dam|price|koto|দাম|কত|টাকা|প্রাইস)/i.test(latestInbound)) {
            if (matchedProduct) {
                const eff = matchedProduct.salePrice || matchedProduct.discountPrice || matchedProduct.price;
                return `আসসালামু আলাইকুম ${conversation?.customerName || "ভাইয়া/আপু"}! আমাদের **${matchedProduct.name}**-এর বর্তমান দাম ${store.currencySymbol}${eff}। ডেলিভারি চার্জ ঢাকার ভেতরে ${store.currencySymbol}${store.deliveryFeeInside} এবং ঢাকার বাইরে ${store.currencySymbol}${store.deliveryFeeOutside}। অর্ডার করতে আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন প্লিজ।`;
            }
            return `আসসালামু আলাইকুম ${conversation?.customerName || "ভাইয়া/আপু"}! প্রোডাক্টটির দাম জানতে চাইলে অনুগ্রহ করে প্রোডাক্টের নাম বা ছবি দিন। আমাদের ডেলিভারি চার্জ ঢাকার ভেতরে ${store.currencySymbol}${store.deliveryFeeInside} ও ঢাকার বাইরে ${store.currencySymbol}${store.deliveryFeeOutside}। অর্ডার করতে চাইলে নাম, ঠিকানা ও ফোন নম্বর দিলে এখনি কনফার্ম করে দিচ্ছি।`;
        }

        if (/(delivery|charge|shipping|ডেলিভারি|চার্জ|কুরিয়ার|ঢাকা)/i.test(latestInbound)) {
            return `হ্যালো ${conversation?.customerName || "ভাইয়া/আপু"}! আমাদের ডেলিভারি চার্জ ঢাকার ভেতরে ${store.currencySymbol}${store.deliveryFeeInside} (১-২ দিন) এবং ঢাকার বাইরে ${store.currencySymbol}${store.deliveryFeeOutside} (২-৩ দিন)। ক্যাশ অন ডেলিভারিতে অর্ডার করতে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন।`;
        }

        if (fallbackExtract.phone && fallbackExtract.address) {
            return `ধন্যবাদ ${conversation?.customerName || "ভাইয়া/আপু"}! আপনার তথ্য (${fallbackExtract.phone}) পেয়েছি। অনুগ্রহ করে জানাবেন কোন প্রোডাক্ট ও সাইজ অর্ডার করতে চাচ্ছেন, আমি এখনি অর্ডার এন্ট্রি করে দিচ্ছি।`;
        }

        return `আসসালামু আলাইকুম ${conversation?.customerName || "ভাইয়া/আপু"}! ${store.siteName}-এ যোগাযোগ করার জন্য ধন্যবাদ। আপনার কোন প্রোডাক্টটি পছন্দ হয়েছে জানাবেন প্লিজ?`;
    };

    if (!settings.geminiApiKey) {
        return {
            ok: true,
            provider: "FALLBACK_CATALOG",
            suggestedReply: buildFallbackReply(),
            extractedData: fallbackExtract,
            isSimpleFaq: /(dam|price|koto|delivery|charge|দাম|কত|ডেলিভারি|চার্জ)/i.test(latestInbound),
        };
    }

    const model = settings.geminiModel || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
    )}:generateContent?key=${encodeURIComponent(settings.geminiApiKey)}`;

    const historyLines = messages
        .slice(-15)
        .map((m) => `${m.direction === "INBOUND" ? "Customer" : "Shop"}: ${m.body}`)
        .join("\n");

    const prompt = `You are a smart F-commerce sales co-pilot for "${store.siteName}" in Bangladesh.
Write polite, concise, natural Bengali (or match customer's Banglish/English tone) replies ready for a human moderator to send in 1 click.

Store Delivery Fees:
- Inside Dhaka: ${store.currencySymbol}${store.deliveryFeeInside}
- Outside Dhaka: ${store.currencySymbol}${store.deliveryFeeOutside}

Live Product Catalog:
${catalogText || "No active products listed."}

Conversation Context:
Channel: ${conversation?.channel || "MESSENGER"}
Customer Name: ${conversation?.customerName || "Customer"}
${conversation?.postTitle ? `Post: ${conversation.postTitle}` : ""}
${conversation?.adName ? `Came from Ad: ${conversation.adName}` : ""}

Messages:
${historyLines}

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "suggestedReply": "Polite concise Bengali reply answering price/delivery/stock accurately from catalog and asking for Name, Address, Phone if ordering",
  "isSimpleFaq": true or false (true ONLY if customer asked a simple price/delivery charge question answered directly by the catalog),
  "extractedData": {
    "customerName": "string or empty",
    "phone": "11-digit BD number 01XXXXXXXXX or empty",
    "address": "full delivery address found in chat or empty",
    "city": "city/district or empty",
    "deliveryArea": "INSIDE_DHAKA or OUTSIDE_DHAKA",
    "productHints": "product name/size/color mentioned by customer or empty"
  }
}`;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                    responseMimeType: "application/json",
                },
            }),
        });
        clearTimeout(timer);

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!res.ok || !rawText) {
            throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
        }

        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        const extractedPhone = parsed?.extractedData?.phone
            ? formatBangladeshiPhone(parsed.extractedData.phone)
            : fallbackExtract.phone;

        return {
            ok: true,
            provider: "GEMINI",
            model,
            suggestedReply: parsed?.suggestedReply || buildFallbackReply(),
            isSimpleFaq: Boolean(parsed?.isSimpleFaq),
            extractedData: {
                customerName: parsed?.extractedData?.customerName || fallbackExtract.customerName,
                phone: extractedPhone.length === 11 ? extractedPhone : fallbackExtract.phone,
                address: parsed?.extractedData?.address || fallbackExtract.address,
                city: parsed?.extractedData?.city || fallbackExtract.city,
                deliveryArea:
                    parsed?.extractedData?.deliveryArea === "INSIDE_DHAKA" ||
                    parsed?.extractedData?.deliveryArea === "OUTSIDE_DHAKA"
                        ? parsed.extractedData.deliveryArea
                        : fallbackExtract.deliveryArea,
                productHints: parsed?.extractedData?.productHints || "",
            },
        };
    } catch (err) {
        console.warn("[Gemini Copilot] Falling back to catalog rule engine:", err.message);
        return {
            ok: true,
            provider: "FALLBACK_CATALOG",
            error: err.message,
            suggestedReply: buildFallbackReply(),
            extractedData: fallbackExtract,
            isSimpleFaq: /(dam|price|koto|delivery|charge|দাম|কত|ডেলিভারি|চার্জ)/i.test(latestInbound),
        };
    }
}
