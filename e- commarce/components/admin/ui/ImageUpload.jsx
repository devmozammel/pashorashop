"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageUpload({ onUploadComplete, value = [] }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(10); // Start progress

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const data = await res.json();
                if (data.url) {
                    onUploadComplete(data.url);
                }
            }
            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed: " + error.message);
            setIsUploading(false);
            setUploadProgress(0);
        }

        // Clear input so same file can be uploaded again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center justify-center transition-all cursor-pointer group",
                    isUploading ? "bg-blue-50/30 border-blue-200 cursor-not-allowed" : "hover:bg-gray-50 hover:border-blue-400 bg-gray-50/50"
                )}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                        <p className="text-sm font-bold text-blue-600">Uploading...</p>
                        <p className="text-[10px] text-blue-400 mt-1 uppercase tracking-widest">{uploadProgress}% Complete</p>
                    </div>
                ) : (
                    <>
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">ফাইল সিলেক্ট করতে এখানে ক্লিক করুন</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG or WebP (Max 5MB)</p>
                        </div>
                        
                        {/* Fake progress bar track */}
                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 rounded-b-2xl" style={{ width: `${uploadProgress}%` }} />
                    </>
                )}
            </div>
            
            {uploadProgress === 100 && (
                <div className="flex items-center justify-center gap-2 text-green-600 text-xs font-bold animate-bounce">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>আপলোড সফল হয়েছে!</span>
                </div>
            )}
        </div>
    );
}
