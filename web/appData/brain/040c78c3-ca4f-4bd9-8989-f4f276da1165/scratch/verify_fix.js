const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Standalone verification with the NEW hash
const ENCRYPTION_KEY = "0d592c330e927f0fd744bdd6486eb048c4a9eb49e125ce6ed917c395a9f7d23c";
const MAIL_HOST = "smtp.gmail.com";
const MAIL_PORT = 465;
const MAIL_USER = "authenticbazarshop@gmail.com";
const MAIL_PASS = "029271dc2a9bd0166d1a4d8ea7498fb6:ae5cde9684ac0075e8d5ff8089765b2f71db0524b54abaf44e5e15a0b29fd38b";

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, 'salt', 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

async function verifyFix() {
  console.log('--- Final Email Verification ---');
  const decryptedPass = decrypt(MAIL_PASS);
  if (!decryptedPass) {
    console.error('❌ Decryption STILL failed.');
    return;
  }
  console.log('Password Decrypted: SUCCESS ✅');

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: true,
    auth: {
      user: MAIL_USER,
      pass: decryptedPass,
    }
  });

  try {
    console.log('Sending verification email to user (kalini001a@gmail.com)...');
    await transporter.sendMail({
      from: `"Authentic Bazar Support" <${MAIL_USER}>`,
      to: 'kalini001a@gmail.com',
      subject: 'Email System FIXED — Authentic Bazar',
      text: 'The email delivery system is now working correctly. Please try your Forgot Password request again.',
      html: '<h1>Email System Fixed!</h1><p>You can now use the Forgot Password feature on Authentic Bazar.</p>'
    });
    console.log('✅ verification Email Sent Successfully!');
  } catch (error) {
    console.error('❌ Final Test Failed:', error.message);
  }
}

verifyFix();
