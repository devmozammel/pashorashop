/**
 * Shared product image utilities.
 * Single source of truth for resolving display images from both
 * ProductImage table (primary) and legacy Product.images JSON (fallback).
 */

/**
 * Returns a clean array of valid image URLs for display.
 * Priority: productImages relation → legacy images JSON field.
 * Filters out null, undefined, empty strings, and whitespace-only values.
 *
 * @param {Object} product - Product object (may have .productImages and .images)
 * @returns {string[]} Array of valid image URL strings
 */
export function getProductDisplayImages(product) {
    if (!product) return [];

    const isValidUrl = (url) => typeof url === 'string' && url.trim().length > 0;

    // 1. Try ProductImage relation (primary source)
    if (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0) {
        const filtered = product.productImages
            .map(img => img.url)
            .filter(isValidUrl)
            .map(url => url.trim());
        if (filtered.length > 0) return filtered;
    }

    // 2. Fallback to legacy images JSON array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const filtered = product.images
            .filter(isValidUrl)
            .map(url => url.trim());
        if (filtered.length > 0) return filtered;
    }

    return [];
}

/**
 * Returns the first valid display image URL, or null.
 * Safe to use directly in <Image src={...} />.
 *
 * @param {Object} product
 * @returns {string|null}
 */
export function getProductThumbnail(product) {
    const images = getProductDisplayImages(product);
    return images.length > 0 ? images[0] : null;
}

/**
 * Sanitizes an array of image URL strings:
 * - Trims whitespace
 * - Removes empty / null / undefined entries
 *
 * Use this in admin forms (client) and API routes (server) before saving.
 *
 * @param {string[]} urls - Raw image URLs from form input
 * @returns {string[]} Cleaned URLs
 */
export function sanitizeImageUrls(urls) {
    if (!Array.isArray(urls)) return [];
    return urls
        .map(url => (typeof url === 'string' ? url.trim() : ''))
        .filter(url => url.length > 0);
}
