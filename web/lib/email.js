// lib/email.js
// Modern, Premium Email Utility for Authentic Bazar
// Designed for High Deliverability & Luxury Brand Experience

import nodemailer from "nodemailer";
import { decrypt } from "./security";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 465,
  secure: Number(process.env.MAIL_PORT) === 465,
  pool: true,              // Reuse connections for speed
  maxConnections: 3,       // Allow parallel sends
  connectionTimeout: 10000, // 10s timeout
  greetingTimeout: 8000,
  socketTimeout: 10000,
  auth: {
    user: process.env.MAIL_USER,
    pass: decrypt(process.env.MAIL_PASS),
  },
});

const FROM = process.env.EMAIL_FROM || "Authentic Bazar <authenticbazarshop@gmail.com>";
const SITE = "Authentic Bazar";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";

// ── Master CSS & Layout Parts
const COLORS = {
  primary: "#000000",
  secondary: "#6b7280",
  accent: "#f5f5f5",
  success: "#10b981",
  border: "#efefef",
  bg: "#ffffff"
};

const MASTER_HTML = (content, previewText = "") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <title>${SITE}</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    img { outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: none; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 50px rgba(0,0,0,0.05); }
    .header { padding: 48px 40px; text-align: center; }
    .content { padding: 0 40px 48px; color: #1f2937; line-height: 1.6; }
    .footer { padding: 32px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #f3f4f6; }
    .btn { display: inline-block; background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0; margin: 0; }
      .header, .content, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <div class="container">
          <!-- Logo Section -->
          <div class="header">
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px; color: #000;">${SITE.toUpperCase()}</h1>
            <div style="width: 40px; height: 2px; background: #000; margin: 12px auto;"></div>
          </div>
          
          <!-- Content Section -->
          <div class="content">
            ${content}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
              Authentic Bazar • Premium Quality Guaranteed
            </p>
            <div style="margin-top: 16px; color: #d1d5db; font-size: 11px;">
              © ${new Date().getFullYear()} ${SITE}. Bangladesh. <br/>
              Exclusive Member of the Premium Fashion Network.
            </div>
          </div>
        </div>
        
        <div style="padding: 24px 0; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af;">
            You are receiving this email because you have a premium account with us.<br/>
            Security Tip: Always check the sender's email address.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Helper: format price in BDT
function fmt(n) {
  return `BDT ${Number(n).toLocaleString("en-BD")}`;
}

// ── PASSWORD RESET EMAIL (Improved design & deliverability)
export async function sendPasswordResetEmail({ user, resetUrl }) {
  if (!user.email) return;

  const preview = "Security Alert: Reset access to your premium account.";
  const html = MASTER_HTML(`
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800;">🔑 Secure Reset Requested</h2>
    <p style="margin: 0 0 24px; color: #4b5563;">Hi <strong>${user.name || "there"}</strong>,</p>
    <p style="margin: 0 0 32px; color: #4b5563;">
      We received a request to reset the password for your premium account. Click the button below to choose a new secure identifier.
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${resetUrl}" class="btn">Reset Password Now</a>
    </div>

    <table role="presentation" width="100%" style="background: #fafafa; border-radius: 12px; border: 1px solid #f3f4f6;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
            <strong>Security Warning:</strong> This link will expire in 1 hour. If you did not request this, please secure your account by ignoring this email or contacting our 24/7 surveillance team.
          </p>
        </td>
      </tr>
    </table>
  `, preview);

  const text = `Hi ${user.name || "there"},\n\nWe received a request to reset your password. Click the link below to select a new secure password:\n\n${resetUrl}\n\nNote: This link is valid for 1 hour. If you didn't request this, you can ignore this email.\n\nAuthentic Bazar Team`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject: `🗝️ Secure Identity: Password Reset Request — ${SITE}`,
      text,
      html,
      headers: {
        "X-Priority": "1",
        "X-Entity-Ref-ID": `reset-${Date.now()}`
      }
    });
  } catch (err) {
    console.error("[Email] Failed to send reset email:", err.message);
  }
}

// ── ORDER CONFIRMATION EMAIL
export async function sendOrderConfirmationEmail({ order, email }) {
  if (!email) return;

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:16px 0; border-bottom:1px solid #f3f4f6;">
          <div style="font-weight: 700; font-size: 14px; color: #111;">${item.name}</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Qty: ${item.quantity} × ${fmt(item.unitPrice)}</div>
        </td>
        <td style="padding:16px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight: 800; font-size: 14px; color: #111;">
          ${fmt(item.total)}
        </td>
      </tr>`
    )
    .join("");

  const html = MASTER_HTML(`
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800;">🛍️ Order Confirmed!</h2>
    <p style="margin: 0 0 32px; color: #4b5563;">Thank you for your trust, <strong>${order.customerName}</strong>. Your premium selection has been secured. Order ID: <strong>${order.orderNumber}</strong></p>

    <table role="presentation" width="100%" style="margin-bottom: 24px;">
      ${itemsHtml}
    </table>

    <div style="background: #fafafa; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
      <div style="display:flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #6b7280;">
        <span>Subtotal</span><span>${fmt(order.subtotal)}</span>
      </div>
      <div style="display:flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 12px; margin-top: 4px; font-weight: 900; font-size: 16px;">
        <span>Final Total</span><span>${fmt(order.total)}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${SITE_URL}/my-orders" class="btn">Track My Premium Shipment</a>
    </div>
  `, `Great news ${order.customerName}! Your order ${order.orderNumber} is confirmed.`);

  const text = `Order Confirmed! Hi ${order.customerName}, your order ${order.orderNumber} has been successfully placed. Order Total: ${fmt(order.total)}. View more at ${SITE_URL}/my-orders`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `✅ Order Confirmed: ${order.orderNumber} — ${SITE}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[Email] Failed to send order confirmation:", err.message);
  }
}

// ── NEW ORDER ALERT (to admin)
export async function sendAdminNewOrderAlert({ order }) {
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) return;

  const html = MASTER_HTML(`
    <h2 style="margin:0 0 16px; color:#111;">💰 New Revenue Detected</h2>
    <div style="background:#fefce8; padding:20px; border-radius:12px; border:1px solid #fef08a;">
      <p style="margin:0; font-size:16px; font-weight:800;">Order: ${order.orderNumber}</p>
      <p style="margin:8px 0 0; color:#854d0e;">Total Value: <strong>${fmt(order.total)}</strong></p>
    </div>
    <div style="margin-top:24px; font-size:14px; color:#4b5563;">
      <p>Customer: ${order.customerName}</p>
      <p>Phone: ${order.phone}</p>
    </div>
    <div style="text-align:center; margin-top:32px;">
      <a href="${SITE_URL}/admin/orders" class="btn">Open Admin Dash</a>
    </div>
  `, `New Order Alert: ${order.orderNumber} for ${fmt(order.total)}`);

  const text = `New Order: ${order.orderNumber} from ${order.customerName}. Total: ${fmt(order.total)}`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: adminEmail,
      subject: `🛒 Revenue Alert: ${order.orderNumber} — ${fmt(order.total)}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[Email] Admin alert failed:", err.message);
  }
}

// ── ORDER STATUS UPDATE EMAIL
export async function sendOrderStatusEmail({ order, email, newStatus }) {
  if (!email) return;

  const statusMessages = {
    CONFIRMED: { emoji: "✅", text: "Your order has been confirmed and is being prepared." },
    PACKED: { emoji: "📦", text: "Your selection has been packed with care and is ready for transit." },
    SHIPPED: { emoji: "🚚", text: "Your premium shipment is in transit. Expect delivery soon." },
    DELIVERED: { emoji: "✨", text: "Your order has been delivered. Enjoy your premium experience!" },
    CANCELLED: { emoji: "❌", text: "Your order session has been closed/cancelled." },
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  const html = MASTER_HTML(`
    <h2 style="margin:0 0 12px; font-size:20px; font-weight:800;">${msg.emoji} Shipment Update</h2>
    <p style="margin:0 0 24px; color:#4b5563;">${msg.text}</p>
    <div style="background:#fafafa; padding:16px; border-radius:12px; text-align:center; margin-bottom:32px;">
       <span style="font-size:12px; text-transform:uppercase; color:#9ca3af; letter-spacing:1px;">New Status</span>
       <div style="font-weight:900; font-size:18px; color:#111; margin-top:4px;">${newStatus}</div>
    </div>
    <div style="text-align:center;">
       <a href="${SITE_URL}/my-orders" class="btn">View Order Details</a>
    </div>
  `, `Order ${order.orderNumber} is now ${newStatus}.`);

  const text = `Status Update: Order ${order.orderNumber} is ${newStatus}. ${msg.text}`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `${msg.emoji} Status Alert: Order ${newStatus} — ${SITE}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[Email] Status update failed:", err.message);
  }
}

// ── SECURITY ALERT EMAIL
export async function sendSecurityAlertEmail({ user, action, details, ip }) {
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) return;

  const html = MASTER_HTML(`
    <h2 style="margin:0 0 16px; color:#dc2626;">🛡️ Surveillance Alert</h2>
    <p style="color:#4b5563; margin-bottom:24px;">A critical security action was detected on the platform:</p>
    <div style="background:#fef2f2; padding:20px; border-radius:16px; border:1px solid #fee2e2; font-size:13px; font-family:monospace;">
        <p><strong>ACTION:</strong> ${action}</p>
        <p><strong>USER ID:</strong> ${user.email || 'SYSTEM'}</p>
        <p><strong>SOURCE IP:</strong> ${ip || 'HIDDEN'}</p>
        ${details ? `<p><strong>META:</strong> ${details}</p>` : ""}
    </div>
    <div style="text-align:center; margin-top:32px;">
      <a href="${SITE_URL}/admin/activity-logs" class="btn" style="background:#dc2626;">Review Logs</a>
    </div>
  `, `PLATFORM ALERT: ${action} detected.`);

  const text = `SECURITY: ${action} detected for user ${user.email}. Source: ${ip}`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: adminEmail,
      subject: `🛡️ SECURITY ALERT: ${action} — ${SITE}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[Email] Security alert failed:", err.message);
  }
}

// ── PRICE DROP EMAIL
export async function sendPriceDropEmail({ user, product, oldPrice, newPrice }) {
  if (!user.email) return;

  const html = MASTER_HTML(`
    <h2 style="margin: 0 0 12px; font-size:20px; font-weight:800;">📉 Price Drop Alert</h2>
    <p style="margin: 0 0 24px; color:#4b5563;">Great news! A product you like has a new lower price.</p>
    <div style="background:#f9fafb; padding:24px; border-radius:16px; text-align:center; margin-bottom:32px;">
        <p style="font-weight:700; color:#111; margin-bottom:8px;">${product.name}</p>
        <p style="font-size:24px; font-weight:900; color:#10b981;">${fmt(newPrice)} <span style="font-size:14px; text-decoration:line-through; color:#9ca3af; margin-left:8px;">${fmt(oldPrice)}</span></p>
    </div>
    <div style="text-align:center;">
       <a href="${SITE_URL}/product/${product.slug}" class="btn">Luxury Deal: Buy Now</a>
    </div>
  `, `The price of ${product.name} just dropped!`);

  const text = `Price Drop! ${product.name} is now ${fmt(newPrice)}. View at ${SITE_URL}/product/${product.slug}`;

  try {
    await transporter.sendMail({ from: FROM, to: user.email, subject: `📉 Price Alert: ${product.name} — ${SITE}`, text, html });
  } catch (err) { console.error("[Email] Price drop failed:", err.message); }
}

// ── RESTOCK EMAIL
export async function sendRestockEmail({ user, product }) {
  if (!user.email) return;

  const html = MASTER_HTML(`
    <h2 style="margin: 0 0 12px; font-size:20px; font-weight:800;">✨ Back in Stock</h2>
    <p style="margin: 0 0 24px; color:#4b5563;">Your selection is available again for a limited time.</p>
    <div style="background:#fafafa; padding:20px; border-radius:12px; text-align:center; margin-bottom:32px;">
        <p style="font-weight:700; color:#111;">${product.name}</p>
    </div>
    <div style="text-align:center;">
       <a href="${SITE_URL}/product/${product.slug}" class="btn">Secure Yours Now</a>
    </div>
  `, `${product.name} is now available!`);

  const text = `Restock Alert: ${product.name} is back in stock. Shop now: ${SITE_URL}/product/${product.slug}`;

  try {
    await transporter.sendMail({ from: FROM, to: user.email, subject: `✨ Back in Stock: ${product.name} — ${SITE}`, text, html });
  } catch (err) { console.error("[Email] Restock email failed:", err.message); }
}

// ── ABANDONED CART EMAIL
export async function sendAbandonedCartEmail({ user, orderUrl }) {
  if (!user.email) return;

  const html = MASTER_HTML(`
    <h2 style="margin: 0 0 12px; font-size:20px; font-weight:800;">🛒 Still Thinking?</h2>
    <p style="margin: 0 0 24px; color:#4b5563;">Hi ${user.name || 'there'}, your premium selection is still waiting in your cart.</p>
    <div style="text-align:center; margin-bottom:32px;">
       <a href="${SITE_URL}${orderUrl}" class="btn">Finish Your Order</a>
    </div>
    <p style="font-size:11px; text-align:center; color:#9ca3af;">Free luxury delivery on all orders over BDT 5,000.</p>
  `, `Don't miss out on your premium selection!`);

  const text = `Hi ${user.name || 'there'}, your items are still in your cart. Complete your order here: ${SITE_URL}${orderUrl}`;

  try {
    await transporter.sendMail({ from: FROM, to: user.email, subject: `🛒 Your Cart is Waiting — ${SITE}`, text, html });
  } catch (err) { console.error("[Email] Abandoned cart failed:", err.message); }
}

// Exporting utility as default for cleaner imports if needed
export default {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
  sendOrderStatusEmail,
  sendSecurityAlertEmail,
  sendPriceDropEmail,
  sendRestockEmail,
  sendAbandonedCartEmail,
};
