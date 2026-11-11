import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HAS_CLOUDINARY = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
);

const IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

const AUDIO_MIME_PREFIXES = ["audio/"];
const VIDEO_MIME_PREFIXES = ["video/mp4", "video/webm"];

function classifyMimeType(rawType = "") {
    const baseType = rawType.split(";")[0].trim().toLowerCase();
    if (IMAGE_MIME_TYPES.has(baseType)) {
        return { mediaType: "IMAGE", resourceType: "image", baseType };
    }
    if (AUDIO_MIME_PREFIXES.some((p) => baseType.startsWith(p))) {
        return { mediaType: "AUDIO", resourceType: "video", baseType };
    }
    // Browsers sometimes label recorded audio blobs as video/webm when MediaRecorder runs
    if (VIDEO_MIME_PREFIXES.some((p) => baseType === p)) {
        return { mediaType: "AUDIO", resourceType: "video", baseType };
    }
    return null;
}

export async function POST(request) {
    const staff = await requireStaff();
    if (!staff) return unauthorizedResponse();

    try {
        const data = await request.formData();
        const file = data.get("file");
        const explicitKind = String(data.get("kind") || "").toUpperCase();

        if (!file || typeof file === "string") {
            return NextResponse.json({ ok: false, message: "কোনো ফাইল পাওয়া যায়নি" }, { status: 400 });
        }

        const classified = classifyMimeType(file.type);
        if (!classified) {
            return NextResponse.json(
                { ok: false, message: "শুধুমাত্র ইমেজ বা অডিও/ভয়েস ফাইল আপলোড করা যাবে" },
                { status: 400 }
            );
        }

        const finalMediaType =
            explicitKind === "AUDIO" || explicitKind === "IMAGE"
                ? explicitKind
                : classified.mediaType;
        const maxSizeBytes = finalMediaType === "AUDIO" ? 12 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        finalMediaType === "AUDIO"
                            ? "ভয়েস ফাইল সর্বোচ্চ 12MB হতে পারবে"
                            : "ইমেজ সর্বোচ্চ 5MB হতে পারবে",
                },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (HAS_CLOUDINARY) {
            const uploadOptions =
                finalMediaType === "AUDIO"
                    ? {
                          folder: "pashora-shop/inbox-media",
                          resource_type: "video",
                          format: "mp3",
                      }
                    : {
                          folder: "pashora-shop/inbox-media",
                          resource_type: "image",
                      };

            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, uploaded) => {
                    if (err) reject(err);
                    else resolve(uploaded);
                });
                stream.end(buffer);
            });

            return NextResponse.json({
                ok: true,
                url: result.secure_url,
                mediaType: finalMediaType,
                publicId: result.public_id,
                resourceType: uploadOptions.resource_type,
            });
        }

        // Local development fallback (stores inside public/uploads/inbox for 30-day auto-cleanup)
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");
        const uploadDir = path.join(process.cwd(), "public", "uploads", "inbox");
        await mkdir(uploadDir, { recursive: true });

        const extMap = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "image/avif": ".avif",
            "audio/webm": ".webm",
            "audio/ogg": ".ogg",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/wav": ".wav",
            "video/webm": ".webm",
        };
        const ext = extMap[classified.baseType] || (finalMediaType === "AUDIO" ? ".webm" : ".jpg");
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return NextResponse.json({
            ok: true,
            url: `/uploads/inbox/${filename}`,
            mediaType: finalMediaType,
            publicId: null,
            resourceType: null,
        });
    } catch (error) {
        console.error("[Inbox Media Upload Error]:", error);
        return NextResponse.json(
            { ok: false, message: error.message || "মিডিয়া আপলোড ব্যর্থ হয়েছে" },
            { status: 500 }
        );
    }
}
