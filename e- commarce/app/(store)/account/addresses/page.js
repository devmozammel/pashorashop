"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AddressesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        areaType: "inside_dhaka",
        city: "Dhaka",
        address: "",
        phone: "",
        note: "",
        isDefault: false
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login?callbackUrl=/account/addresses");
            return;
        }
        if (status === "authenticated") {
            fetch("/api/user/addresses")
                .then(res => res.ok ? res.json() : [])
                .then(data => setAddresses(data))
                .catch(() => { })
                .finally(() => setPageLoading(false));
        }
    }, [status, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setShowForm(false);
        setEditId(null);
        setFormData({ areaType: "inside_dhaka", city: "Dhaka", address: "", phone: "", note: "", isDefault: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editId) {
                const res = await fetch(`/api/user/addresses/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    const updated = await res.json();
                    setAddresses(prev => prev.map(a => a.id === updated.id ? updated : a));
                    toast.success("Address updated!");
                } else throw new Error("Update failed");
            } else {
                const res = await fetch("/api/user/addresses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...formData, isDefault: addresses.length === 0 })
                });
                if (res.ok) {
                    const added = await res.json();
                    setAddresses(prev => [...prev, added]);
                    toast.success("Address added!");
                } else throw new Error("Create failed");
            }
            resetForm();
        } catch (error) {
            toast.error("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
            if (res.ok) {
                setAddresses(prev => prev.filter(a => a.id !== id));
                toast.success("Address deleted.");
            } else throw new Error("Delete failed");
        } catch {
            toast.error("Failed to delete address");
        }
    };

    const handleSetDefault = async (addr) => {
        try {
            const res = await fetch(`/api/user/addresses/${addr.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...addr, isDefault: true })
            });
            if (res.ok) {
                setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })));
                toast.success("Default address updated.");
            } else throw new Error();
        } catch {
            toast.error("Failed to set default address");
        }
    };

    const handleEdit = (addr) => {
        setFormData(addr);
        setEditId(addr.id);
        setShowForm(true);
    };

    if (status === "loading" || pageLoading) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="container max-w-4xl mx-auto py-10 px-4">
            <Link href="/account" className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Addresses</h1>
                {!showForm && (
                    <button onClick={() => setShowForm(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        Add New Address
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="bg-white p-8 rounded-xl border shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-lg font-semibold">{editId ? "Edit Address" : "Add New Address"}</h2>
                        <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Delivery Area</label>
                                <div className="flex gap-4">
                                    {["inside_dhaka", "outside_dhaka"].map(val => (
                                        <label key={val} className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 w-full transition-colors">
                                            <input type="radio" name="areaType" value={val}
                                                checked={formData.areaType === val} onChange={handleChange} className="text-primary" />
                                            <span className="text-sm">{val === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">City / District</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Address Details</label>
                            <textarea name="address" value={formData.address} onChange={handleChange}
                                placeholder="House #, Road #, Area, etc." required
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Phone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Delivery Note (Optional)</label>
                                <input type="text" name="note" value={formData.note} onChange={handleChange}
                                    placeholder="Near famous landmark..."
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button type="submit" disabled={loading}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Address
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {addresses.length === 0 ? (
                        <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                            <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-muted-foreground">No addresses saved yet.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className={`relative p-6 rounded-xl border transition-all ${addr.isDefault ? 'border-primary bg-primary/5' : 'bg-white hover:border-gray-400'}`}>
                                {addr.isDefault && (
                                    <span className="absolute top-4 right-4 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">DEFAULT</span>
                                )}
                                <div className="mb-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        {addr.areaType === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
                                    </h3>
                                    <p className="text-sm leading-relaxed mt-2 text-gray-700">
                                        {addr.address}<br />{addr.city}<br />Ph: {addr.phone}
                                    </p>
                                    {addr.note && <p className="text-xs text-muted-foreground mt-2 italic">Note: {addr.note}</p>}
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t mt-4">
                                    <button onClick={() => handleEdit(addr)} className="text-sm font-medium hover:text-primary">Edit</button>
                                    <button onClick={() => handleDelete(addr.id)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
                                    {!addr.isDefault && (
                                        <button onClick={() => handleSetDefault(addr)} className="text-sm font-medium text-muted-foreground hover:text-foreground ml-auto">Set as Default</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
