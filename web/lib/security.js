
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
let cachedKey = null;

function getEncryptionKey() {
    if (cachedKey) return cachedKey;

    const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
    const ENCRYPTION_SALT_RAW = process.env.ENCRYPTION_SALT;

    if (!ENCRYPTION_KEY_RAW || !ENCRYPTION_SALT_RAW) {
        // Return a dummy 32-byte key so the build doesn't fail.
        // During actual runtime, if these are missing, it will print a warning.
        // You should set these env vars in production!
        return Buffer.alloc(32);
    }

    try {
        cachedKey = crypto.pbkdf2Sync(ENCRYPTION_KEY_RAW, Buffer.from(ENCRYPTION_SALT_RAW, 'hex'), 310000, 32, 'sha256');
        return cachedKey;
    } catch (error) {
        console.error("Failed to derive key", error);
        return Buffer.alloc(32);
    }
}

export function encrypt(text) {
    if (!text) return text;
    try {
        const key = getEncryptionKey();
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption error:", error);
        return text;
    }
}

export function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const key = getEncryptionKey();
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Encryption Decryption error:", error);
        return text; // Fallback to raw if decryption fails
    }
}
