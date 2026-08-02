const fs = require("fs");
const path = require("path");

const sourceDir = "C:\\Users\\MOJA\\.gemini\\antigravity\\brain\\fededa34-4835-43d5-ac93-edef81211b43";
const targetDir = path.join(__dirname, "..", "public", "images", "categories");

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const mappings = {
    "3d_kids_category": "kids.jpg",
    "3d_sports_category": "sports.jpg",
    "3d_phones_category": "phones-gadgets.jpg",
    "3d_gaming_category": "gaming-pc-gear.jpg",
    "3d_beauty_category": "beauty-skincare.jpg",
    "3d_bags_category": "bags-backpacks.jpg",
    "3d_perfumes_category": "perfumes-fragrances.jpg",
    "3d_pets_category": "pet-care-accessories.jpg",
    "3d_women_category": "women.jpg",
    "3d_men_category": "men.jpg",
    "3d_teens_category": "teens.jpg",
    "3d_home_category": "home-living.jpg",
    "3d_accessories_category": "accessories.jpg"
};

const files = fs.readdirSync(sourceDir);

for (const [prefix, targetName] of Object.entries(mappings)) {
    const matchedFile = files.find(f => f.startsWith(prefix) && f.endsWith(".jpg"));
    if (matchedFile) {
        const srcPath = path.join(sourceDir, matchedFile);
        const destPath = path.join(targetDir, targetName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${matchedFile} -> ${destPath}`);
    } else {
        console.error(`Missing source image for ${prefix}`);
    }
}

console.log("3D Icons Copy Completed!");
