"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Input } from "@/components/admin/ui/FormElements";

export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [edits, setEdits] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/products");
            if (!res.ok) throw new Error("Failed to load products");
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleChange = (id, val) => {
        setEdits((prev) => ({ ...prev, [id]: Number(val) }));
    };

    const saveChanges = async () => {
        setSaving(true);
        setError(null);
        const entries = Object.entries(edits);
        try {
            const results = await Promise.all(
                entries.map(([id, stock]) =>
                    fetch(`/api/admin/products/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ stock }),
                    }).then((r) => {
                        if (!r.ok) throw new Error(`Failed to update product ${id}`);
                        return r.json();
                    })
                )
            );

            // Reflect saved values in product list
            setProducts((prev) =>
                prev.map((p) => {
                    const savedIdx = entries.findIndex(([id]) => id === p.id);
                    if (savedIdx !== -1) {
                        return { ...p, stock: entries[savedIdx][1] };
                    }
                    return p;
                })
            );
            setEdits({});
            alert(`✅ Inventory updated! (${results.length} product${results.length !== 1 ? "s" : ""} saved)`);
        } catch (err) {
            setError(err.message);
            alert(`❌ Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { header: "Name", accessor: "name" },
        {
            header: "SKU / Slug",
            cell: (row) => (
                <span className="text-xs font-mono text-gray-500">{row.slug}</span>
            ),
        },
        {
            header: "Current Stock",
            cell: (row) => {
                const currentVal = edits[row.id] !== undefined ? edits[row.id] : row.stock;
                const isLow = currentVal <= 5;
                return (
                    <span className={`font-semibold ${isLow ? "text-red-500" : "text-gray-700"}`}>
                        {row.stock}
                        {isLow && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                Low
                            </span>
                        )}
                    </span>
                );
            },
        },
        {
            header: "New Stock",
            cell: (row) => (
                <Input
                    type="number"
                    min="0"
                    className="w-24 h-8"
                    value={edits[row.id] !== undefined ? edits[row.id] : row.stock}
                    onChange={(e) => handleChange(row.id, e.target.value)}
                />
            ),
        },
    ];

    const pendingCount = Object.keys(edits).length;

    return (
        <AdminShell
            title="Inventory"
            actions={
                pendingCount > 0 && (
                    <Button onClick={saveChanges} disabled={saving}>
                        {saving ? "Saving…" : `Save Changes (${pendingCount})`}
                    </Button>
                )
            }
        >
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading inventory…</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={products}
                    searchKey="name"
                />
            )}
        </AdminShell>
    );
}
