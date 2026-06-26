"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ columns, data, searchKey = "name", onSearch, onSelectionChange }) {
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;

    const storageKey = typeof window !== "undefined"
        ? `datatable_page_${window.location.pathname}_${searchKey}`
        : "";

    const [currentPage, setCurrentPage] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem(`datatable_page_${window.location.pathname}_${searchKey}`);
            return saved ? parseInt(saved, 10) : 1;
        }
        return 1;
    });

    const [selectedIds, setSelectedIds] = useState(new Set());

    // Save page index to session storage when changed
    useEffect(() => {
        if (storageKey) {
            sessionStorage.setItem(storageKey, currentPage);
        }
    }, [currentPage, storageKey]);

    // Reset selection when data changes entirely (optional, depending on UX desired)
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(Array.from(selectedIds));
        }
    }, [selectedIds, onSelectionChange]);

    // Filter Logic
    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const val = item[searchKey];
        return val && String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Adjust page if it exceeds total pages after filter or delete
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(filteredData.map(item => item.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page
                        }}
                        className="pl-9 h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Showing {paginatedData.length} of {filteredData.length} results
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                {onSelectionChange && (
                                    <th className="px-4 py-3 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-4 py-3 font-medium">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, rowIdx) => (
                                    <tr key={row.id || rowIdx} className="hover:bg-gray-50 transition-colors">
                                        {onSelectionChange && (
                                            <td className="px-4 py-3 align-middle">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={() => handleSelectRow(row.id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className="px-4 py-3 align-middle text-gray-700">
                                                {col.accessor ? row[col.accessor] : col.cell(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-100 transition bg-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`w-10 h-10 rounded-xl text-sm font-medium transition ${p === currentPage ? "bg-red-600 text-white shadow" : "border border-gray-200 hover:bg-gray-100 text-gray-600 bg-white"}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-100 transition bg-white"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
