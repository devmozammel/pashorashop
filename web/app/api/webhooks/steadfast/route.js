import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { mapSteadfastStatus } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

const HARDCODED_WEBHOOK_TOKEN = "WCXVFMhsm48guAesjsG3a5Si5kUuz8dBbMW_FKuE7KE";

/**
 * Helper to get the secret webhook token from DB or env or fallback.
 */
async function getWebhookToken() {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });
        if (setting?.value) {
            const parsed = JSON.parse(setting.value);
            if (parsed.steadfastWebhookToken) return parsed.steadfastWebhookToken.trim();
        }
    } catch {}
    return (process.env.STEADFAST_WEBHOOK_TOKEN || HARDCODED_WEBHOOK_TOKEN).trim();
}

/**
 * Verify Steadfast Webhook HMAC-SHA256 signature and/or Bearer token.
 */
function verifySignature(rawBody, givenSignature, authHeader, token) {
    if (!token) return true; // If no token configured, pass

    // 1. Check Bearer token in Authorization header
    if (authHeader) {
        const cleanHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (cleanHeader === token) return true;
    }

    // 2. Check HMAC-SHA256 X-Signature
    if (givenSignature) {
        try {
            const expected = crypto.createHmac("sha256", token).update(rawBody).digest("hex");
            if (givenSignature.length === expected.length) {
                if (crypto.timingSafeEqual(Buffer.from(givenSignature), Buffer.from(expected))) {
                    return true;
                }
            }
        } catch (e) {
            console.error("[Steadfast Webhook] Signature verification error:", e.message);
        }
    }

    return false;
}

/**
 * Steadfast Courier Webhook Handler
 * Endpoint: POST /api/webhooks/steadfast
 */
export async function POST(req) {
    try {
        const rawBody = await req.text();
        if (!rawBody) {
            return NextResponse.json({ status: 400, message: "Empty request body" }, { status: 400 });
        }

        const token = await getWebhookToken();
        const givenSignature = req.headers.get("x-signature") || "";
        const authHeader = req.headers.get("authorization") || "";

        // Verify authenticity if headers are provided
        if (givenSignature || authHeader) {
            const isValid = verifySignature(rawBody, givenSignature, authHeader, token);
            if (!isValid) {
                console.warn("[Steadfast Webhook] Unauthorized request signature rejected.");
                return NextResponse.json({ status: 401, message: "Invalid webhook signature or token" }, { status: 401 });
            }
        }

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ status: 400, message: "Malformed JSON payload" }, { status: 400 });
        }

        const notificationType = body.notification_type || body.type || "delivery_status";
        const consignmentId = body.consignment_id ? String(body.consignment_id).trim() : null;
        const invoice = body.invoice ? String(body.invoice).trim() : null;
        const rawStatus = body.status || body.delivery_status;
        const trackingMessage = body.tracking_message || body.message || "";

        if (!invoice && !consignmentId) {
            return NextResponse.json({ status: 200, message: "Acknowledged (no invoice or consignment ID)" });
        }

        // Find the matching order
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    ...(invoice ? [{ orderNumber: invoice }] : []),
                    ...(consignmentId ? [{ trackingNumber: consignmentId }] : []),
                ]
            }
        });

        if (!order) {
            console.warn(`[Steadfast Webhook] No matching order found for invoice: "${invoice}", CID: "${consignmentId}"`);
            // Steadfast expects 2xx answer within 5 seconds so return 200 to acknowledge
            return NextResponse.json({ status: 200, message: "Order not found in database, acknowledged." });
        }

        // Handle delivery_status events
        if (notificationType === "delivery_status" && rawStatus) {
            const mapped = mapSteadfastStatus(rawStatus);
            if (mapped) {
                const targetOrderStatus = mapped.orderStatus;
                const targetPaymentStatus = mapped.paymentStatus;

                // Only update if something changed
                if (order.status !== targetOrderStatus || (targetPaymentStatus && order.paymentStatus !== targetPaymentStatus)) {
                    await prisma.$transaction(async (tx) => {
                        await tx.order.update({
                            where: { id: order.id },
                            data: {
                                status: targetOrderStatus,
                                ...(targetPaymentStatus && { paymentStatus: targetPaymentStatus })
                            }
                        });

                        await tx.orderStatusHistory.create({
                            data: {
                                orderId: order.id,
                                status: targetOrderStatus,
                                note: `[Steadfast Auto-Webhook] ${rawStatus}: ${trackingMessage || mapped.label}`.slice(0, 255)
                            }
                        });

                        // Affiliate automated commission management
                        if (targetOrderStatus === "DELIVERED") {
                            const affiliateTx = await tx.affiliateTransaction.findUnique({
                                where: { orderId: order.id }
                            }).catch(() => null);

                            if (affiliateTx && affiliateTx.status === "PENDING") {
                                await tx.affiliateTransaction.update({
                                    where: { id: affiliateTx.id },
                                    data: { status: "APPROVED" }
                                });
                                await tx.affiliateProfile.update({
                                    where: { id: affiliateTx.affiliateId },
                                    data: { totalEarnings: { increment: affiliateTx.commissionAmount } }
                                });
                            }
                        }

                        if (targetOrderStatus === "CANCELLED") {
                            const affiliateTx = await tx.affiliateTransaction.findUnique({
                                where: { orderId: order.id }
                            }).catch(() => null);

                            if (affiliateTx && affiliateTx.status === "PENDING") {
                                await tx.affiliateTransaction.update({
                                    where: { id: affiliateTx.id },
                                    data: { status: "REJECTED" }
                                });
                                await tx.affiliateProfile.update({
                                    where: { id: affiliateTx.affiliateId },
                                    data: { pendingEarnings: { decrement: affiliateTx.commissionAmount } }
                                });
                            }
                        }
                    });

                    console.log(`[Steadfast Webhook] Order #${order.orderNumber} successfully auto-updated to ${targetOrderStatus} (${rawStatus})`);
                }
            }
        } else if (notificationType === "tracking_update" && trackingMessage) {
            // Log tracking event into order status history
            await prisma.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    status: order.status,
                    note: `[Steadfast Tracking Update] ${trackingMessage}`.slice(0, 255)
                }
            }).catch(e => console.error("Error logging tracking update:", e.message));
        }

        return NextResponse.json({
            status: 200,
            message: "Webhook processed successfully",
            orderNumber: order.orderNumber,
            event: notificationType
        });
    } catch (err) {
        console.error("[Steadfast Webhook Error]:", err);
        // Steadfast retry policy: return 500 if server error so Steadfast retries
        return NextResponse.json({ status: 500, message: err.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: 200,
        message: "Steadfast Webhook Endpoint is online and ready to receive POST events.",
        signatureVerification: "HMAC-SHA256 enabled"
    });
}
