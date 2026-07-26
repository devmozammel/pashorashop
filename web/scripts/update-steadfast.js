import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    const salt = process.env.ENCRYPTION_SALT;
    if (!key || !salt) {
        return Buffer.alloc(32);
    }
    return crypto.pbkdf2Sync(key, Buffer.from(salt, 'hex'), 310000, 32, 'sha256');
}

function encrypt(text) {
    if (!text) return text;
    const key = getEncryptionKey();
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function main() {
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
        console.log('STEADFAST_API_KEY or STEADFAST_SECRET_KEY not set in environment.');
        return;
    }

    const existing = await prisma.siteSetting.findUnique({ where: { key: 'store_settings' } });
    let current = existing ? JSON.parse(existing.value) : {};

    current.steadfastApiKey = encrypt(apiKey);
    current.steadfastSecretKey = encrypt(secretKey);

    await prisma.siteSetting.upsert({
        where: { key: 'store_settings' },
        update: { value: JSON.stringify(current), type: 'json' },
        create: { key: 'store_settings', value: JSON.stringify(current), type: 'json' }
    });

    console.log('Successfully updated Steadfast credentials in DB store_settings.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
