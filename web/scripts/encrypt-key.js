/**
 * Secure Credential Encryptor
 * Use this to encrypt your API keys before adding them to .env
 * Usage: node scripts/encrypt-key.js "your-api-key-here"
 */

const crypto = require('crypto');

// This must match the key derivation in lib/security.js
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'auth-bazar-ultra-secure-master-key-2026'; 
const IV_LENGTH = 16;
const salt = 'salt';

const key = crypto.pbkdf2Sync(ENCRYPTION_KEY_RAW, salt, 100000, 32, 'sha256');

function encrypt(text) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const rawText = process.argv[2];

if (!rawText) {
    console.log('\n❌ Error: No text provided.');
    console.log('Usage: node scripts/encrypt-key.js "your-api-key-here"\n');
    process.exit(1);
}

const encrypted = encrypt(rawText);

console.log('\n✅ Encryption Successful!');
console.log('---------------------------');
console.log('Original:', rawText);
console.log('Encrypted Value (Copy this to .env):');
console.log('\x1b[32m%s\x1b[0m', encrypted); 
console.log('---------------------------\n');
console.log('Note: Ensure your ENCRYPTION_KEY is set in .env before running this for production keys.\n');
