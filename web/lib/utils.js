import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export function getProductDisplayName(productName, selectedVariant, variants = []) {
    if (!selectedVariant) return productName;

    let displayName = productName;
    let replaced = false;

    const variantSize = selectedVariant.size;
    const variantColor = selectedVariant.color;

    if (variantSize) {
        for (const v of variants) {
            if (v.size) {
                // Try exact match first
                const sizeStr = v.size.toLowerCase();
                const index = displayName.toLowerCase().indexOf(sizeStr);
                if (index !== -1) {
                    displayName = displayName.substring(0, index) + variantSize + displayName.substring(index + v.size.length);
                    replaced = true;
                    break;
                }
                // Try matching numbers and letters with optional spaces (e.g. "50ml" vs "50 ml")
                const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
                if (match) {
                    const [_, num, unit] = match;
                    const regex = new RegExp(`${num}\\s*${unit}`, "gi");
                    if (regex.test(displayName)) {
                        displayName = displayName.replace(regex, variantSize);
                        replaced = true;
                        break;
                    }
                }
            }
        }
    }

    if (variantColor) {
        for (const v of variants) {
            if (v.color) {
                const colorStr = v.color.toLowerCase();
                const index = displayName.toLowerCase().indexOf(colorStr);
                if (index !== -1) {
                    displayName = displayName.substring(0, index) + variantColor + displayName.substring(index + v.color.length);
                    replaced = true;
                    break;
                }
            }
        }
    }

    if (!replaced) {
        const details = [];
        if (variantSize) details.push(variantSize);
        if (variantColor) details.push(variantColor);
        if (details.length > 0) {
            displayName = `${displayName} (${details.join(" / ")})`;
        }
    }

    return displayName;
}

