"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Badge } from "@/components/admin/ui/FormElements";
import { Star, Trash, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ui/ImageUpload";

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Form state
    const [productId, setProductId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerAvatar, setCustomerAvatar] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviewImages, setReviewImages] = useState([]);
    const [isVerified, setIsVerified] = useState(true);
    const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);

    const fetchReviews = async () => {
        try {
            const res = await fetch("/api/admin/reviews");
            const data = await res.json();
            if (Array.isArray(data)) {
                setReviews(data);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to fetch reviews");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/products");
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchProducts();
    }, []);

    const toggleApprove = async (id, currentVal) => {
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: !currentVal })
            });
            if (res.ok) {
                toast.success("Review status updated");
                fetchReviews();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete review?")) return;
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Review deleted");
                fetchReviews();
            } else {
                toast.error("Failed to delete review");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setCustomerAvatar(data.url);
                toast.success("Avatar uploaded successfully");
            } else {
                toast.error(data.error || "Avatar upload failed");
            }
        } catch (err) {
            toast.error("Avatar upload failed");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || !customerName || !rating) {
            toast.error("Please fill all required fields");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    customerName,
                    customerAvatar,
                    rating,
                    comment,
                    images: reviewImages,
                    isVerified,
                    createdAt
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Review created successfully!");
                setIsModalOpen(false);
                // reset form
                setProductId("");
                setCustomerName("");
                setCustomerAvatar("");
                setRating(5);
                setComment("");
                setReviewImages([]);
                setIsVerified(true);
                setCreatedAt(new Date().toISOString().split('T')[0]);
                // refetch reviews
                fetchReviews();
            } else {
                toast.error(data.error || "Failed to create review");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { header: "Product", cell: (row) => row.product?.name || "Unknown Product" },
        {
            header: "User",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-xs shrink-0 border border-gray-100">
                        {row.user?.image ? (
                            <img src={row.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            row.user?.name ? row.user.name[0].toUpperCase() : "U"
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{row.user?.name || "Anonymous"}</span>
                        <span className="text-[10px] text-gray-400">{row.user?.email || ""}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Rating",
            cell: (row) => (
                <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < row.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                </div>
            )
        },
        { header: "Comment", accessor: "comment" },
        { header: "Status", cell: (row) => <Badge variant={row.isApproved ? 'success' : 'warning'}>{row.isApproved ? 'Approved' : 'Pending'}</Badge> },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleApprove(row.id, row.isApproved)}>
                        {row.isApproved ? "Hide" : "Approve"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id)}>
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AdminShell
            title="Reviews Moderation"
            actions={
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 bg-gray-900 text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4" /> Add Review
                </Button>
            }
        >
            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable columns={columns} data={reviews} searchKey="comment" />
            )}

            {/* Add Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">Add Customer Review</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Product Select */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Select Product *</label>
                                <select
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">-- Choose a Product --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (৳{p.salePrice || p.price})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Customer Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. তানজিম আহমেদ"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    />
                                </div>

                                {/* Customer Avatar Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Customer Avatar</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden shrink-0">
                                            {customerAvatar ? (
                                                <img src={customerAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] text-gray-400">No Image</span>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="modal-avatar-upload"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            disabled={isUploadingAvatar}
                                            onClick={() => document.getElementById('modal-avatar-upload').click()}
                                        >
                                            {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                                        </Button>
                                        {customerAvatar && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomerAvatar("")}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Rating Select */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Rating *</label>
                                    <select
                                        value={rating}
                                        onChange={(e) => setRating(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value={5}>★★★★★ (5 Stars)</option>
                                        <option value={4}>★★★★☆ (4 Stars)</option>
                                        <option value={3}>★★★☆☆ (3 Stars)</option>
                                        <option value={2}>★★☆☆☆ (2 Stars)</option>
                                        <option value={1}>★☆☆☆☆ (1 Star)</option>
                                    </select>
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Review Date</label>
                                    <input
                                        type="date"
                                        value={createdAt}
                                        onChange={(e) => setCreatedAt(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    />
                                </div>
                            </div>

                            {/* Comment Textarea */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 font-medium">Review Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    placeholder="রিভিউ বিস্তারিত লিখুন..."
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                />
                            </div>

                            {/* Verified Buyer Switch */}
                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="isVerified"
                                    checked={isVerified}
                                    onChange={(e) => setIsVerified(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white"
                                />
                                <label htmlFor="isVerified" className="text-sm text-gray-700 cursor-pointer font-medium">
                                    Mark as "Verified Buyer"
                                </label>
                            </div>

                            {/* Review Product Images Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-medium">Review Photos (প্রোডাক্টের ছবি)</label>
                                <ImageUpload
                                    onUploadComplete={(url) => setReviewImages(prev => [...prev, url])}
                                    value={reviewImages}
                                />
                                {reviewImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {reviewImages.map((url, idx) => (
                                            <div key={idx} className="relative w-16 h-16 border rounded-lg overflow-hidden group">
                                                <img src={url} alt="Review attachment" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-1.5"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit Review
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
