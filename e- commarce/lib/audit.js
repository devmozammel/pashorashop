
import { prisma } from "@/lib/prisma";

/**
 * Creates an audit log entry for admin actions.
 * @param {Object} params
 * @param {string} params.adminId - Admin ID or Email
 * @param {string} params.action - CREATE, UPDATE, DELETE, LOGIN, etc.
 * @param {string} params.entityType - Product, Category, Order, etc.
 * @param {string} [params.entityId] - ID of the affected entity
 * @param {Object} [params.meta] - Additional JSON metadata
 * @param {string} [params.ip] - IP address of the requester
 */
export async function createAuditLog({ adminId, action, entityType, entityId, meta, ip }) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId: String(adminId),
                action,
                entityType,
                entityId: entityId ? String(entityId) : null,
                meta: meta || {},
                // Note: If you add an 'ip' field to the schema, use it here. 
                // For now, we'll store IP in meta if no field exists.
                ...(ip && { meta: { ...(meta || {}), ip } })
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
