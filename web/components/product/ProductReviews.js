"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2, Camera, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductReviews({ productId }) {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?productId=${productId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to load reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [...images];

        for (const file of files) {
            if (uploadedUrls.length >= 5) {
                toast.error("You can upload a maximum of 5 images");
                break;
            }

            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 5MB`);
                continue;
            }

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    uploadedUrls.push(data.url);
                } else {
                    toast.error(data.error || `Failed to upload ${file.name}`);
                }
            } catch (err) {
                console.error(err);
                toast.error(`Error uploading ${file.name}`);
            }
        }
        setImages(uploadedUrls);
        setUploading(false);
    };

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!session?.user) {
            toast.error("Please login to submit a review");
            return;
        }

        if (!comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    rating,
                    comment,
                    images
                })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to submit review");
            } else {
                toast.success("Review submitted successfully");
                setComment("");
                setRating(5);
                setImages([]);
                setShowForm(false);
                // Fetch reviews again to show the new one
                fetchReviews();
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="mt-16 bg-white rounded-xl border p-6 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Customer Reviews
            </h2>

            <div className="grid md:grid-cols-[1fr_2fr] gap-10">
                {/* Summary Section */}
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl font-bold">{averageRating}</div>
                        <div>
                            <div className="flex items-center text-amber-400 mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("w-5 h-5", i < Math.round(averageRating) ? "fill-current" : "text-gray-300")} />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{reviews.length} total reviews</p>
                        </div>
                    </div>

                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Write a Review
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowForm(false)}
                            className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel Review
                        </button>
                    )}
                </div>

                {/* Form & Reviews List */}
                <div>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-bold mb-4">Write your review</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="text-amber-400 focus:outline-none focus:scale-110 transition-transform"
                                        >
                                            <Star className={cn("w-8 h-8", star <= rating ? "fill-current" : "text-gray-300")} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Your Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="What did you like or dislike?"
                                    required
                                />
                            </div>


                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Submit Review"}
                            </button>
                        </form>
                    )}

                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
                                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="border-b pb-6 last:border-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                                {review.user?.image ? (
                                                    <img src={review.user.image} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    review.user?.name ? review.user.name[0].toUpperCase() : "U"
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    {review.user?.name || "Anonymous User"}
                                                    {review.isVerified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Verified Buyer</span>}
                                                </h4>
                                                <div className="flex text-amber-400 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={cn("w-3.5 h-3.5", i < review.rating ? "fill-current" : "text-gray-300")} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 text-sm mt-3 leading-relaxed break-words">
                                        {review.comment}
                                    </p>
                                    {review.images && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {(typeof review.images === "string" ? JSON.parse(review.images) : review.images).map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedImage(url)}
                                                    className="w-20 h-20 border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                                >
                                                    <img src={url} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg">
                        <img src={selectedImage} alt="Full screen preview" className="max-w-full max-h-[90vh] object-contain" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
