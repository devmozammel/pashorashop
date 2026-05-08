
import { prisma } from "@/lib/prisma";

/**
 * Logs an activity to the database.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - The action performed (e.g., "CREATE", "UPDATE", "DELETE").
 * @param {string} resource - The resource affected (e.g., "Product", "Order").
 * @param {object} details - Additional details about the action (optional).
 */
export async function logActivity(userId, action, resource, details = null) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                resource,
                details
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
