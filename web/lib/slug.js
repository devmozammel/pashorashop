const slugify = require("slugify");

const BN_TO_EN = {
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
    '্': '', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', '০': '0'
};

function transliterateBengali(str) {
    if (!str) return "";
    return str.split("").map(c => BN_TO_EN[c] || c).join("");
}

function cleanSlug(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

/**
 * Generates a clean, SEO-friendly, non-empty slug from product details
 * Handles English, Bengali, mixed, and manual slug inputs.
 */
function generateProductSlug({ slug, name, metaTitle, id }) {
    // 1. If explicit slug is provided and non-empty
    if (slug && typeof slug === "string") {
        const cleaned = cleanSlug(slug);
        if (cleaned) return cleaned;
    }

    // 2. Check if name has English letters/numbers
    if (name) {
        const cleanedName = cleanSlug(name);
        if (cleanedName && cleanedName.length >= 3) {
            return cleanedName;
        }
    }

    // 3. Check if metaTitle contains English text
    if (metaTitle) {
        // Extract English parts (e.g., "Foldable Electric Kettle | Portable Water Heater")
        const englishOnly = metaTitle.replace(/[^\x00-\x7F]+/g, " ");
        const cleanedMeta = cleanSlug(englishOnly);
        if (cleanedMeta && cleanedMeta.length >= 3) {
            return cleanedMeta;
        }
    }

    // 4. Transliterate Bengali name to Latin
    if (name) {
        const transliterated = transliterateBengali(name);
        const cleanedTrans = cleanSlug(transliterated);
        if (cleanedTrans && cleanedTrans.length >= 2) {
            return cleanedTrans;
        }
    }

    // 5. Fallback using id or timestamp
    if (id) {
        return `product-${cleanSlug(id)}`;
    }

    return `product-${Date.now().toString(36)}`;
}

module.exports = {
    cleanSlug,
    transliterateBengali,
    generateProductSlug
};
