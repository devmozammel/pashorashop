const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/MOJA/.gemini/antigravity/brain/c1e91b60-052f-4ca9-84e1-d1ae5555641e/pashora_logo_demo1_1792421790463.jpg';

function buildIco(pngBuffers) {
    // pngBuffers: array of { width, height, buffer }
    const numImages = pngBuffers.length;
    const headerLen = 6;
    const dirEntryLen = 16;
    let dataOffset = headerLen + numImages * dirEntryLen;

    const header = Buffer.alloc(headerLen);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // 1 = ICO
    header.writeUInt16LE(numImages, 4); // number of images

    const entries = [];
    for (const img of pngBuffers) {
        const entry = Buffer.alloc(dirEntryLen);
        entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
        entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
        entry.writeUInt8(0, 2); // color palette count
        entry.writeUInt8(0, 3); // reserved
        entry.writeUInt16LE(1, 4); // color planes
        entry.writeUInt16LE(32, 6); // bits per pixel
        entry.writeUInt32LE(img.buffer.length, 8); // size of image
        entry.writeUInt32LE(dataOffset, 12); // offset
        entries.push(entry);
        dataOffset += img.buffer.length;
    }

    return Buffer.concat([header, ...entries, ...pngBuffers.map(img => img.buffer)]);
}

async function main() {
    console.log("Generating Logo and Favicon assets...");

    // 1. Full logo (1024x1024)
    await sharp(srcPath)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile('public/logo-full.png');
    console.log("Created public/logo-full.png");

    // 2. Icon crop (P emblem centered: left 258, top 160, 500x500)
    const basePBuffer = await sharp(srcPath)
        .extract({ left: 258, top: 160, width: 500, height: 500 })
        .toBuffer();

    // 3. Logo mark for navbar (512x512)
    await sharp(basePBuffer)
        .resize(512, 512)
        .png({ quality: 100 })
        .toFile('public/logo.png');
    console.log("Created public/logo.png");

    // 4. Next.js App Router icon (512x512)
    await sharp(basePBuffer)
        .resize(512, 512)
        .png({ quality: 100 })
        .toFile('app/icon.png');
    console.log("Created app/icon.png");

    // 5. Apple Touch Icon (180x180)
    const appleIconBuffer = await sharp(basePBuffer)
        .resize(180, 180)
        .png()
        .toBuffer();
    fs.writeFileSync('app/apple-icon.png', appleIconBuffer);
    fs.writeFileSync('public/favicon_io/apple-touch-icon.png', appleIconBuffer);
    console.log("Created app/apple-icon.png and public/favicon_io/apple-touch-icon.png");

    // 6. Favicon 32x32 & 16x16
    const png32 = await sharp(basePBuffer).resize(32, 32).png().toBuffer();
    const png16 = await sharp(basePBuffer).resize(16, 16).png().toBuffer();
    const png48 = await sharp(basePBuffer).resize(48, 48).png().toBuffer();

    fs.writeFileSync('public/favicon_io/favicon-32x32.png', png32);
    fs.writeFileSync('public/favicon_io/favicon-16x16.png', png16);
    console.log("Created favicon 32x32 and 16x16");

    // 7. Multi-resolution ICO
    const icoBuffer = buildIco([
        { width: 16, height: 16, buffer: png16 },
        { width: 32, height: 32, buffer: png32 },
        { width: 48, height: 48, buffer: png48 }
    ]);
    fs.writeFileSync('public/favicon_io/favicon.ico', icoBuffer);
    fs.writeFileSync('app/favicon.ico', icoBuffer);
    fs.writeFileSync('public/favicon.ico', icoBuffer);
    console.log("Created favicon.ico in app/ and public/");

    console.log("All logo and favicon assets created successfully!");
}

main().catch(console.error);
