const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function prepareCPanel() {
    const rootDir = process.cwd();
    const buildDir = path.join(rootDir, '.next');
    const standaloneDir = path.join(buildDir, 'standalone');
    const deployDir = path.join(rootDir, 'CPANEL_READY');

    console.log('🚀 Starting cPanel Deployment Preparation (Native FS)...');

    // 1. Check if build exists, if not run it
    if (!fs.existsSync(standaloneDir)) {
        console.log('❌ Error: .next/standalone not found. Running build first...');
        try {
            execSync('npm run build', { stdio: 'inherit' });
        } catch (error) {
            console.error('❌ Build failed!', error);
            process.exit(1);
        }
    }

    // 2. Clear/Create deploy folder
    if (fs.existsSync(deployDir)) {
        console.log('🧹 Cleaning old CPANEL_READY folder...');
        fs.rmSync(deployDir, { recursive: true, force: true });
    }
    fs.mkdirSync(deployDir, { recursive: true });

    // 3. Copy standalone contents
    console.log('📦 Copying standalone server...');
    fs.cpSync(standaloneDir, deployDir, { recursive: true });

    // 4. Copy static assets
    const staticDir = path.join(buildDir, 'static');
    const deployStaticDir = path.join(deployDir, '.next', 'static');
    
    if (fs.existsSync(staticDir)) {
        console.log('📂 Copying static assets...');
        fs.mkdirSync(deployStaticDir, { recursive: true });
        fs.cpSync(staticDir, deployStaticDir, { recursive: true });
    }

    // 5. Copy public folder
    const publicDir = path.join(rootDir, 'public');
    const deployPublicDir = path.join(deployDir, 'public');

    if (fs.existsSync(publicDir)) {
        console.log('🖼️  Copying public folder...');
        fs.cpSync(publicDir, deployPublicDir, { recursive: true });
    }

    // 6. Create custom cpanel-entry.js
    console.log('⚙️  Creating cpanel-entry.js...');
    const serverJsContent = `const path = require('path');
process.env.NODE_ENV = 'production';

// Get port from cPanel environment
// cPanel Node.js selector defaults to 'PASS_ANY_PORT' or similar
const port = process.env.PORT || 3000;

console.log('Starting Authentic Bazar on port:', port);

// Load the standalone server
require('./server.js');
`;
    fs.writeFileSync(path.join(deployDir, 'cpanel-entry.js'), serverJsContent);

    // 7. Create a clean .env.example template
    console.log('📄 Creating .env.example template...');
    const envExampleContent = `# Database
DATABASE_URL="mysql://username:password@host:port/database"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"

# Public Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Encryption Key
ENCRYPTION_KEY="your_encryption_key_here"

# Payment Gateway
PAYMENT_API_KEY="your_payment_api_key_here"
PAYMENT_BASE_URL="your_payment_base_url_here"

# Email Configuration (SMTP)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=465
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_encrypted_or_raw_mail_password_here"
ADMIN_PROMO_SECRET="your_admin_promo_secret_here"
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="your_admin_password_here"

# WhatsApp Configuration
NEXT_PUBLIC_WHATSAPP_NUMBER="880XXXXXXXXXX"

# Cloudinary Config
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
`;
    fs.writeFileSync(path.join(deployDir, '.env.example'), envExampleContent);

    console.log('✅ Preparation Complete!');
    console.log(`📂 Folder ready at: ${deployDir}`);
    console.log('\n--- NEXT STEPS FOR CPANEL ---');
    console.log('1. Zip all files inside the CPANEL_READY folder.');
    console.log('2. Upload zip to cPanel and extract.');
    console.log('3. In "Setup Node.js App", use "cpanel-entry.js" as the startup file.');
    console.log('4. Set Application URL and Port.');
}

prepareCPanel();
