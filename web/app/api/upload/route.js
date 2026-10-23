import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";


export const dynamic = "force-dynamic";

// Configure Cloudinary from env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FALLBACK_TO_LOCAL = !process.env.CLOUDINARY_CLOUD_NAME;

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate MIME type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, WebP, or GIF." }, { status: 400 });
    }

    // Validate Size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── CLOUDINARY UPLOAD (production)
    if (!FALLBACK_TO_LOCAL) {
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "pashora-shop",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            return NextResponse.json({
                url: result.secure_url,
                publicId: result.public_id,
            });
        } catch (err) {
            console.error("[Upload] Cloudinary upload error:", {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            return NextResponse.json({ 
                error: "Cloudinary upload failed: " + err.message,
                details: err.name 
            }, { status: 500 });
        }
    }

    // ── LOCAL FALLBACK (development — no Cloudinary env vars set)
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const uploadDir = path.join(process.cwd(), "public/uploads");
    try { 
        await mkdir(uploadDir, { recursive: true }); 
    } catch (err) {
        console.error("[Upload] Local fallback directory error:", err);
    }

    const extensionMap = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/avif": ".avif"
    };
    const fileExtension = extensionMap[file.type] || ".jpg";
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "-")}${fileExtension}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ 
        url: `/uploads/${filename}`,
        success: true 
    });
}
