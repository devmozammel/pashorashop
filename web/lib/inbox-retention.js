import path from "path";
import { unlink } from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

export const INBOX_RETENTION_DAYS = 30;
const CLEANUP_STATS_KEY = "social_last_cleanup_stats";
const SWEEP_INTERVAL_MS = 12 * 60 * 60 * 1000; // Run automatic sweep at most once every 12 hours

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HAS_CLOUDINARY = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
);

let lastMemoryCheckMs = 0;
let isCleanupRunning = false;

async function removeStoredMediaForMessages(messages) {
    let deletedMediaFiles = 0;
    const inboxUploadRoot = path.resolve(process.cwd(), "public", "uploads", "inbox");

    for (const msg of messages) {
        const meta = msg.metadata && typeof msg.metadata === "object" ? msg.metadata : {};

        // 1) Delete Cloudinary asset if tracked in metadata
        if (HAS_CLOUDINARY && meta.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(meta.cloudinaryPublicId, {
                    resource_type: meta.cloudinaryResourceType || "image",
                });
                deletedMediaFiles++;
            } catch {
                // Continue even if remote asset was already deleted
            }
        }

        // 2) Delete local fallback file strictly inside public/uploads/inbox
        if (typeof msg.mediaUrl === "string" && msg.mediaUrl.startsWith("/uploads/inbox/")) {
            const filename = msg.mediaUrl.replace(/^\/uploads\/inbox\//, "");
            if (filename && !filename.includes("..") && !filename.includes("/") && !filename.includes("\\")) {
                const candidate = path.resolve(inboxUploadRoot, filename);
                if (candidate.startsWith(inboxUploadRoot + path.sep)) {
                    try {
                        await unlink(candidate);
                        deletedMediaFiles++;
                    } catch {
                        // File already removed or missing
                    }
                }
            }
        }
    }

    return deletedMediaFiles;
}

/**
 * Deletes SocialMessage rows (and associated uploaded media) older than `retentionDays` (default 30 days),
 * plus inactive empty SocialConversation rows older than `retentionDays`.
 * Customer Orders are untouched (`Order.conversationId` has `onDelete: SetNull`).
 */
export async function cleanupExpiredInboxData({ force = false, retentionDays = INBOX_RETENTION_DAYS } = {}) {
    if (isCleanupRunning) {
        return { skipped: true, reason: "already_running" };
    }

    isCleanupRunning = true;
    try {
        if (!force) {
            const existingStatsRow = await prisma.siteSetting.findUnique({
                where: { key: CLEANUP_STATS_KEY },
            });
            if (existingStatsRow?.value) {
                try {
                    const parsed = JSON.parse(existingStatsRow.value);
                    const lastRunMs = parsed?.lastRunAt ? new Date(parsed.lastRunAt).getTime() : 0;
                    if (lastRunMs && Date.now() - lastRunMs < SWEEP_INTERVAL_MS) {
                        return { skipped: true, reason: "recent_run", stats: parsed };
                    }
                } catch {
                    // Proceed if stats JSON malformed
                }
            }
        }

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        const expiredMessages = await prisma.socialMessage.findMany({
            where: { createdAt: { lt: cutoffDate } },
            select: {
                id: true,
                mediaUrl: true,
                metadata: true,
            },
            take: 500,
        });

        let deletedMessages = 0;
        let deletedMediaFiles = 0;

        if (expiredMessages.length > 0) {
            deletedMediaFiles = await removeStoredMediaForMessages(expiredMessages);
            const delRes = await prisma.socialMessage.deleteMany({
                where: { id: { in: expiredMessages.map((m) => m.id) } },
            });
            deletedMessages = delRes.count || 0;
        }

        // Remove conversations with no remaining messages and no recent activity in the past 30 days
        const convDelRes = await prisma.socialConversation.deleteMany({
            where: {
                lastMessageAt: { lt: cutoffDate },
                messages: { none: {} },
            },
        });
        const deletedConversations = convDelRes.count || 0;

        const stats = {
            lastRunAt: new Date().toISOString(),
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
            deletedMessages,
            deletedConversations,
            deletedMediaFiles,
        };

        await prisma.siteSetting.upsert({
            where: { key: CLEANUP_STATS_KEY },
            update: { value: JSON.stringify(stats), type: "json", isPublic: false },
            create: {
                key: CLEANUP_STATS_KEY,
                value: JSON.stringify(stats),
                type: "json",
                isPublic: false,
            },
        });

        return { ok: true, skipped: false, stats };
    } catch (error) {
        console.error("[Inbox Retention Cleanup Error]:", error);
        return { ok: false, error: error.message };
    } finally {
        isCleanupRunning = false;
    }
}

/**
 * Non-blocking throttle trigger so retention cleanup runs automatically
 * without needing external cron setup.
 */
export function maybeRunInboxRetentionCleanup() {
    const now = Date.now();
    if (isCleanupRunning || now - lastMemoryCheckMs < 60 * 60 * 1000) {
        return;
    }
    lastMemoryCheckMs = now;
    cleanupExpiredInboxData({ force: false }).catch(() => {});
}

export async function getInboxRetentionStats() {
    try {
        const row = await prisma.siteSetting.findUnique({
            where: { key: CLEANUP_STATS_KEY },
        });
        return row?.value ? JSON.parse(row.value) : null;
    } catch {
        return null;
    }
}
