const { decrypt } = require('./lib/security');
require('dotenv').config();

const mailPass = process.env.MAIL_PASS;
console.log('Encrypted MAIL_PASS:', mailPass);
try {
    const decrypted = decrypt(mailPass);
    console.log('Decrypted MAIL_PASS length:', decrypted.length);
    console.log('Decrypted MAIL_PASS (first 2 chars):', decrypted.substring(0, 2));
} catch (e) {
    console.error('Decryption failed:', e);
}
