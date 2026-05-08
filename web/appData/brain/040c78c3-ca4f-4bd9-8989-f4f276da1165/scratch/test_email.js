require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Minimal decrypt for test
function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const key = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest();
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
  console.log('--- Email Diagnostic Test ---');
  console.log('Host:', process.env.MAIL_HOST);
  console.log('Port:', process.env.MAIL_PORT);
  console.log('User:', process.env.MAIL_USER);
  
  const decryptedPass = decrypt(process.env.MAIL_PASS);
  if (!decryptedPass) {
    console.error('❌ Decryption of MAIL_PASS failed. Check ENCRYPTION_KEY.');
    return;
  }
  console.log('Password Decrypted: Success');

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: decryptedPass,
    },
    debug: true,
    logger: true
  });

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Diagnostic Test" <${process.env.MAIL_USER}>`,
      to: 'authenticbazarshop@gmail.com', // Sending to self for test
      subject: 'Diagnostic Email Test',
      text: 'If you see this, email sending is WORKING.',
      html: '<b>If you see this, email sending is WORKING.</b>'
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full Error:', error);
  }
}

testEmail();
