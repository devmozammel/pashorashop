export const initialAdminData = {
    categories: [
        { id: 'cat_1', name: 'Men', slug: 'men', parentId: null, sortOrder: 1, isActive: true, showInMegaMenu: true },
        { id: 'cat_2', name: 'Women', slug: 'women', parentId: null, sortOrder: 2, isActive: true, showInMegaMenu: true },
        { id: 'cat_3', name: 'Kids', slug: 'kids', parentId: null, sortOrder: 3, isActive: true, showInMegaMenu: false },
        { id: 'cat_4', name: 'Shirts', slug: 'men-shirts', parentId: 'cat_1', sortOrder: 1, isActive: true, showInMegaMenu: true },
        { id: 'cat_5', name: 'Dresses', slug: 'women-dresses', parentId: 'cat_2', sortOrder: 1, isActive: true, showInMegaMenu: true },
    ],
    products: [
        {
            id: 'prod_1', name: 'Classic T-Shirt', slug: 'classic-t-shirt',
            description: 'A timeless classic.', categoryId: 'cat_4',
            price: 1500, salePrice: 1200, discountPrice: null,
            isActive: true, isFeatured: true, isNewArrival: false,
            stock: 50, images: ['https://placehold.co/400x600?text=T-Shirt'],
            createdAt: '2023-01-01T10:00:00Z'
        },
        {
            id: 'prod_2', name: 'Summer Dress', slug: 'summer-dress',
            description: 'Perfect for warm days.', categoryId: 'cat_5',
            price: 2500, salePrice: null, discountPrice: null,
            isActive: true, isFeatured: false, isNewArrival: true,
            stock: 20, images: ['https://placehold.co/400x600?text=Dress'],
            createdAt: '2023-02-15T10:00:00Z'
        },
        {
            id: 'prod_3', name: 'Kids Denim', slug: 'kids-denim',
            description: 'Durable and stylish.', categoryId: 'cat_3',
            price: 1800, salePrice: 1600, discountPrice: null,
            isActive: true, isFeatured: false, isNewArrival: false,
            stock: 5, images: ['https://placehold.co/400x600?text=Jeans'],
            createdAt: '2023-03-10T10:00:00Z'
        }
    ],
    variants: [
        { id: 'var_1', productId: 'prod_1', size: 'M', color: 'White', stock: 20, priceOverride: null },
        { id: 'var_2', productId: 'prod_1', size: 'L', color: 'White', stock: 15, priceOverride: null },
        { id: 'var_3', productId: 'prod_2', size: 'S', color: 'Red', stock: 10, priceOverride: null }
    ],
    orders: [
        {
            id: 'ord_1', customerName: 'John Doe', phone: '01700000000',
            total: 1270, status: 'PENDING', paymentMethod: 'COD',
            items: [{ productId: 'prod_1', qty: 1, price: 1200 }],
            createdAt: '2023-10-25T10:00:00Z', deliveryArea: 'INSIDE_DHAKA', deliveryFee: 70
        },
        {
            id: 'ord_2', customerName: 'Jane Smith', phone: '01800000000',
            total: 2630, status: 'DELIVERED', paymentMethod: 'ONLINE',
            items: [{ productId: 'prod_2', qty: 1, price: 2500 }],
            createdAt: '2023-10-20T10:00:00Z', deliveryArea: 'OUTSIDE_DHAKA', deliveryFee: 130
        }
    ],
    coupons: [
        { id: 'coup_1', code: 'WELCOME10', amount: 10, type: 'PERCENT', isActive: true, usageLimit: 100 },
        { id: 'coup_2', code: 'FLAT50', amount: 50, type: 'FLAT', isActive: false, usageLimit: 50 }
    ],
    users: [
        { id: 'user_1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'user_2', name: 'Customer One', email: 'cust1@example.com', role: 'USER', status: 'ACTIVE' }
    ],
    settings: {
        siteName: 'Fashion House',
        currencySymbol: '৳',
        supportEmail: 'support@fashionhouse.com',
        supportPhone: '+8801700000000',
        address: '123 Fashion Street, Dhaka',
        deliveryFeeInside: 70,
        deliveryFeeOutside: 130
    },
    featureToggles: {
        coupons: true,
        flashSale: true,
        reviews: true,
        wishlist: true
    }
};

export function getFinalPrice(product) {
    return product.discountPrice ?? product.salePrice ?? product.price;
}
