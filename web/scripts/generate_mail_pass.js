const { encrypt } = require('../lib/security');
const fs = require('fs');
const path = require('path');

// Load .env manually to avoid extra dependencies
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found!');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
        const match = line.match(/^\s*ENCRYPTION_KEY\s*=\s*(["'])(.+)\1\s*$/) || line.match(/^\s*ENCRYPTION_KEY\s*=\s*([^"'#\s]+)/);
        if (match) {
            process.env.ENCRYPTION_KEY = match[1] === '"' || match[1] === "'" ? match[2] : match[1];
            break;
        }
    }
}

async function main() {
    loadEnv();
    const rawPass = process.argv[2];
    if (!rawPass) {
        console.error('Usage: node generate_mail_pass.js <your_mail_password>');
        process.exit(1);
    }
    console.log('Using ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY);
    const encrypted = encrypt(rawPass);
    console.log('--- ENCRYPTED MAIL_PASS ---');
    console.log(encrypted);
    console.log('---------------------------');
}

main();
