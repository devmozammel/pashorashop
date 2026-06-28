
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SALT_RAW = process.env.ENCRYPTION_SALT;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY_RAW || !ENCRYPTION_SALT_RAW) {
    throw new Error("FATAL: ENCRYPTION_KEY or ENCRYPTION_SALT is missing from environment variables");
}

// Derive a 32-byte key from the raw string and salt
const key = crypto.pbkdf2Sync(ENCRYPTION_KEY_RAW, Buffer.from(ENCRYPTION_SALT_RAW, 'hex'), 310000, 32, 'sha256');

export function encrypt(text) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
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
