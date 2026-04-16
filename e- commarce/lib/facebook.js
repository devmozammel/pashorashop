
import { createHash } from 'crypto';

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

export async function sendEvent(eventName, eventData, userData = {}, eventId = null) {
    if (!PIXEL_ID || !ACCESS_TOKEN) return;

    const currentTimestamp = Math.floor(new Date() / 1000);

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: currentTimestamp,
                event_id: eventId,
                action_source: "website",
                user_data: {
                    em: userData.email ? hash(userData.email) : undefined,
                    ph: userData.phone ? hash(userData.phone) : undefined,
                    client_ip_address: userData.ip,
                    client_user_agent: userData.userAgent,
                    fbp: userData.fbp,
                    fbc: userData.fbc,
                },
                custom_data: eventData
            }
        ]
    };

    try {
        await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Facebook CAPI Error:', error);
    }
}

function hash(string) {
    if (!string) return undefined;
    return createHash('sha256').update(string.trim().toLowerCase()).digest('hex');
}
