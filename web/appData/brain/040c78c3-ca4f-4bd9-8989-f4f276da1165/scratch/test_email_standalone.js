const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Hardcoded values from .env for standalone test
const ENCRYPTION_KEY = "0d592c330e927f0fd744bdd6486eb048c4a9eb49e125ce6ed917c395a9f7d23c";
const MAIL_HOST = "smtp.gmail.com";
const MAIL_PORT = 465;
const MAIL_USER = "authenticbazarshop@gmail.com";
const MAIL_PASS = "4bd453e32a0fe7d94f989b576b3b387d:284cbf3a7233c0df7c6f3bbbca5d9f0352a12a5c28d644f1b0e88f64c4f4f616";

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

async function testEmail() {
  console.log('--- Email Diagnostic Test (Standalone) ---');
  console.log('Host:', MAIL_HOST);
  console.log('Port:', MAIL_PORT);
  console.log('User:', MAIL_USER);
  
  const decryptedPass = decrypt(MAIL_PASS);
  if (!decryptedPass) {
    console.error('❌ Decryption failed.');
    return;
  }
  console.log('Password Decrypted: Success');

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: Number(MAIL_PORT) === 465,
    auth: {
      user: MAIL_USER,
      pass: decryptedPass,
    },
    debug: true,
    logger: true
  });

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Diagnostic Test" <${MAIL_USER}>`,
      to: 'kalini001a@gmail.com', // User's email from screenshot
      subject: 'Diagnostic Email Test',
      text: 'If you see this, email sending is WORKING from the server side.',
      html: '<b>If you see this, email sending is WORKING from the server side.</b>'
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full Error:', error);
  }
}

testEmail();
