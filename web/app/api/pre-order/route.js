import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FALLBACK_TO_LOCAL = !process.env.CLOUDINARY_CLOUD_NAME;

export async function POST(request) {
    try {
        const data = await request.formData();
        
        const name = data.get("name");
        const phone = data.get("phone");
        const details = data.get("details");
        const file = data.get("file"); // Optional

        if (!name || !phone || !details) {
            return NextResponse.json({ error: "Name, phone, and details are required." }, { status: 400 });
        }

        let imageUrl = null;

        if (file && file.size > 0) {
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

            // ── CLOUDINARY UPLOAD ──
            if (!FALLBACK_TO_LOCAL) {
                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: "authentic-bazar/pre-orders",
                                resource_type: "image",
                                transformation: [{ quality: "auto:good", fetch_format: "auto" }],
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(buffer);
                    });
                    imageUrl = result.secure_url;
                } catch (err) {
                    console.error("[PreOrder] Cloudinary upload error:", err);
                    return NextResponse.json({ error: "Cloudinary upload failed." }, { status: 500 });
                }
            } else {
                // ── LOCAL FALLBACK ──
                const { writeFile, mkdir } = await import("fs/promises");
                const path = await import("path");

                const uploadDir = path.join(process.cwd(), "public/uploads/pre-orders");
                try { 
                    await mkdir(uploadDir, { recursive: true }); 
                } catch (err) {}

                const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "-")}${path.extname(file.name)}`;
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                imageUrl = `/uploads/pre-orders/${filename}`;
            }
        }

        const preOrder = await prisma.preOrderRequest.create({
            data: {
                name,
                phone,
                details,
                imageUrl,
            }
        });

        return NextResponse.json({ success: true, preOrder });
    } catch (error) {
        console.error("Pre-order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
