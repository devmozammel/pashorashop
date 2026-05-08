import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Designed for rich-text editor content like React Quill.
 * 
 * @param {string} html - The raw HTML string to sanitize.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitizeHtml(html) {
    if (!html) return html;

    return purify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'span',
            'blockquote', 'code', 'pre', 'u', 'strike', 'sub', 'sup',
            'div', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'
        ],
        ALLOWED_ATTR: ['href', 'target', 'style', 'class', 'rel'],
    });
}
