import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as fpixel from '@/lib/fpixel';
import * as ttpixel from '@/lib/ttpixel';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            toggleDrawer: () => set({ isOpen: !get().isOpen }),
            openDrawer: () => set({ isOpen: true }),
            closeDrawer: () => set({ isOpen: false }),

            addItem: (product, variant = null, quantity = 1) => {
                const currentItems = get().items;
                // Unique key: product ID + variant ID (if exists)
                const uniqueKey = variant ? `${product.id}-${variant.id}` : product.id;

                const existingItemIndex = currentItems.findIndex(item => item.uniqueKey === uniqueKey);

                // Calculate unit price (Int)
                const basePrice = Number(product.salePrice ?? product.price);
                const hasVariantPrices = variant && (variant.price !== null && variant.price !== undefined || variant.salePrice !== null && variant.salePrice !== undefined);
                const unitPrice = hasVariantPrices
                    ? (variant.salePrice !== null && variant.salePrice !== undefined && variant.salePrice !== "" ? Number(variant.salePrice) : Number(variant.price))
                    : basePrice + (variant ? Number(variant.priceAdjustment || 0) : 0);

                if (existingItemIndex > -1) {
                    const newItems = [...currentItems];
                    newItems[existingItemIndex].quantity += quantity;
                    set({ items: newItems });
                } else {
                    set({
                        items: [
                            ...currentItems,
                            {
                                uniqueKey,
                                product: {
                                    id: product.id,
                                    name: product.name,
                                    slug: product.slug,
                                    price: Number(product.price),
                                    salePrice: product.salePrice ? Number(product.salePrice) : null,
                                    images: product.images,
                                    productImages: product.productImages,
                                },
                                variant: variant ? {
                                    id: variant.id,
                                    size: variant.size || null,
                                    color: variant.color || null,
                                    priceAdjustment: Number(variant.priceAdjustment || 0),
                                    price: variant.price !== undefined && variant.price !== null ? Number(variant.price) : null,
                                    salePrice: variant.salePrice !== undefined && variant.salePrice !== null ? Number(variant.salePrice) : null,
                                    stock: Number(variant.stock || 0),
                                } : null,
                                quantity,
                                price: unitPrice
                            }
                        ]
                    });
                }

                try {
                    fpixel.event('AddToCart', {
                        content_ids: [product.id],
                        content_type: 'product',
                        content_name: product.name,
                        value: Number(unitPrice * quantity),
                        currency: 'BDT'
                    });
                } catch (e) {
                    console.error("Facebook Pixel AddToCart error:", e);
                }

                try {
                    ttpixel.event('AddToCart', {
                        contents: [
                            {
                                content_id: product.id,
                                content_type: 'product',
                                content_name: product.name,
                                quantity: quantity,
                                price: Number(unitPrice)
                            }
                        ],
                        value: Number(unitPrice * quantity),
                        currency: 'BDT'
                    });
                } catch (e) {
                    console.error("TikTok Pixel AddToCart error:", e);
                }

                // Note: Drawer is NOT auto-opened here — caller decides (openDrawer vs router.push)
            },

            removeItem: (uniqueKey) => {
                set({ items: get().items.filter(item => item.uniqueKey !== uniqueKey) });
            },

            updateQuantity: (uniqueKey, quantity) => {
                if (quantity < 1) return;
                const newItems = get().items.map(item =>
                    item.uniqueKey === uniqueKey ? { ...item, quantity } : item
                );
                set({ items: newItems });
            },

            clearCart: () => set({ items: [] }),

            syncWithServer: async () => {
                const localItems = get().items;
                // 1. Sync local items to server
                if (localItems.length > 0) {
                    try {
                        await fetch('/api/cart/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                items: localItems.map(i => ({
                                    productId: i.product.id,
                                    variantId: i.variant?.id,
                                    quantity: i.quantity
                                }))
                            })
                        });
                    } catch (error) {
                        console.error("Sync failed", error);
                    }
                }

                // 2. Fetch merged cart from server and update local
                try {
                    const res = await fetch('/api/cart');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.items) {
                            // Map server items to store format
                            const mappedItems = data.items.map(item => {
                                const product = item.product;
                                const variant = item.variant;
                                const uniqueKey = variant ? `${product.id}-${variant.id}` : product.id;

                                // Calculate price (similar to addItem logic)
                                const basePrice = Number(product.salePrice ?? product.price);
                                const hasVariantPrices = variant && (variant.price !== null && variant.price !== undefined || variant.salePrice !== null && variant.salePrice !== undefined);
                                const unitPrice = hasVariantPrices
                                    ? (variant.salePrice !== null && variant.salePrice !== undefined && variant.salePrice !== "" ? Number(variant.salePrice) : Number(variant.price))
                                    : basePrice + (variant ? Number(variant.priceAdjustment || 0) : 0);

                                return {
                                    uniqueKey,
                                    product: {
                                        id: product.id,
                                        name: product.name,
                                        slug: product.slug,
                                        price: Number(product.price),
                                        salePrice: product.salePrice ? Number(product.salePrice) : null,
                                        images: product.images,
                                        productImages: product.productImages || [], // robust check
                                    },
                                    variant: variant ? {
                                        id: variant.id,
                                        size: variant.size || null,
                                        color: variant.color || null,
                                        priceAdjustment: Number(variant.priceAdjustment || 0),
                                        price: variant.price !== undefined && variant.price !== null ? Number(variant.price) : null,
                                        salePrice: variant.salePrice !== undefined && variant.salePrice !== null ? Number(variant.salePrice) : null,
                                        stock: Number(variant.stock || 0),
                                    } : null,
                                    quantity: item.quantity,
                                    price: unitPrice
                                };
                            });
                            set({ items: mappedItems });
                        }
                    }
                } catch (err) {
                    console.error("Fetch cart failed", err);
                }
            },

            getCartTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            }
        }),
        {
            name: 'shopping-cart',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') return localStorage;
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
            // skipHydration removed — store will auto-hydrate from localStorage on mount
        }
    )
);
