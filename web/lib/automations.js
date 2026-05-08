
import { prisma } from "@/lib/prisma";
import { sendPriceDropEmail, sendRestockEmail, sendAbandonedCartEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils/format";

export async function createNotification(userId, type, title, message, link) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link
            }
        });
    } catch (error) {
        console.error("Failed to create notification", error);
    }
}

export async function checkPriceDrop(productId, newPrice, oldPrice) {
    if (newPrice >= oldPrice) return;

    // Find all users who have this product in wishlist
    const wishlists = await prisma.wishlist.findMany({
        where: { productId },
        include: { user: true, product: true }
    });

    for (const entry of wishlists) {
        // Create in-app notification
        await createNotification(
            entry.userId,
            "PRICE_DROP",
            "Price Drop Alert!",
            `Great news! ${entry.product.name} is now cheaper. Buy it now for ${formatCurrency(newPrice)}!`,
            `/product/${entry.product.slug}`
        );

        // Send Real Email
        await sendPriceDropEmail({
            user: entry.user,
            product: entry.product,
            oldPrice,
            newPrice
        });
    }
}

export async function checkBackInStock(productId, newStock, oldStock) {
    if (oldStock > 0 || newStock <= 0) return;

    const wishlists = await prisma.wishlist.findMany({
        where: { productId },
        include: { user: true, product: true }
    });

    for (const entry of wishlists) {
        // Create in-app notification
        await createNotification(
            entry.userId,
            "RESTOCK",
            "Back in Stock!",
            `${entry.product.name} is back in stock. Grab it before it's gone!`,
            `/product/${entry.product.slug}`
        );

        // Send Real Email
        await sendRestockEmail({
            user: entry.user,
            product: entry.product
        });
    }
}

export async function checkAbandonedCheckouts() {
    // Find orders pending for more than 1 hour but less than 24 hours
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedOrders = await prisma.order.findMany({
        where: {
            status: "PENDING",
            createdAt: {
                lt: oneHourAgo,
                gt: twentyFourHoursAgo
            },
            userId: { not: null } // Only for logged in users we can notify
        },
        include: { user: true }
    });

    for (const order of abandonedOrders) {
        // Check if we already notified
        const existingNotif = await prisma.notification.findFirst({
            where: {
                userId: order.userId,
                type: "ABANDONED_CART",
                link: `/checkout/${order.id}`
            }
        });

        if (!existingNotif) {
            // Create in-app notification
            await createNotification(
                order.userId,
                "ABANDONED_CART",
                "Did you forget something?",
                "You have items waiting in your cart. Complete your purchase now!",
                `/checkout/${order.id}`
            );

            // Send Real Email
            await sendAbandonedCartEmail({
                user: order.user,
                orderUrl: `/checkout/${order.id}`
            });
        }
    }
    return abandonedOrders.length;
}
