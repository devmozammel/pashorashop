import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
let cachedKey = null;

function getEncryptionKey() {
    if (cachedKey) return cachedKey;
    const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
    const ENCRYPTION_SALT_RAW = process.env.ENCRYPTION_SALT;
    if (!ENCRYPTION_KEY_RAW || !ENCRYPTION_SALT_RAW) {
        return Buffer.alloc(32);
    }
    cachedKey = crypto.pbkdf2Sync(ENCRYPTION_KEY_RAW, Buffer.from(ENCRYPTION_SALT_RAW, 'hex'), 310000, 32, 'sha256');
    return cachedKey;
}

function decrypt(text) {
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
        return text;
    }
}

async function check() {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'store_settings' } });
    if (setting) {
        const storeSettings = JSON.parse(setting.value);
        console.log('raw steadfastApiKey:', storeSettings.steadfastApiKey);
        console.log('decrypted steadfastApiKey:', decrypt(storeSettings.steadfastApiKey));
        console.log('raw steadfastSecretKey:', storeSettings.steadfastSecretKey);
        console.log('decrypted steadfastSecretKey:', decrypt(storeSettings.steadfastSecretKey));
    } else {
        console.log('No store_settings record found!');
    }
}

check()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
    });
