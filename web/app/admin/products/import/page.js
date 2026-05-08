
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BulkImportPage() {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [logs, setLogs] = useState([]);
    const router = useRouter();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    setData(result.data);
                },
                error: (error) => {
                    console.error("Error parsing CSV:", error);
                    setLogs(prev => [...prev, { type: 'error', message: 'Failed to parse CSV file.' }]);
                }
            });
        }
    };

    const handleUpload = async () => {
        if (!data || data.length === 0) return;
        setUploading(true);
        setLogs([]);

        let successCount = 0;
        let failCount = 0;

        // Process in batches or one by one. For simplicity, one by one to give feedback.
        // Ideally, send bulk to API. Let's send bulk to API.

        try {
            const response = await fetch("/api/admin/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: data }),
            });

            const result = await response.json();

            if (response.ok) {
                setLogs([{ type: 'success', message: `Successfully imported ${result.count} products.` }]);
                if (result.errors && result.errors.length > 0) {
                    result.errors.forEach(err => {
                        setLogs(prev => [...prev, { type: 'error', message: err }]);
                    });
                }
                router.refresh();
            } else {
                setLogs([{ type: 'error', message: result.error || "Upload failed." }]);
            }

        } catch (error) {
            setLogs([{ type: 'error', message: "Network error occurred." }]);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Bulk Product Import</h1>
            <p className="text-gray-500 mb-8">Upload a CSV file to bulk import products. Required columns: name, price, stock, category (slug), description.</p>

            <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    {file ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <FileText className="w-5 h-5" />
                            {file.name}
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <span className="text-primary font-medium">Click to upload</span> or drag and drop CSV
                        </div>
                    )}
                </div>

                {data.length > 0 && (
                    <div className="mt-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <span className="font-medium">{data.length} products found</span>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {uploading ? "Importing..." : "Start Import"}
                            </button>
                        </div>

                        {/* Preview First 3 */}
                        <div className="text-left text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                            <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
                            {data.length > 3 && <p className="mt-2 text-gray-500">...and {data.length - 3} more</p>}
                        </div>
                    </div>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="mt-6 space-y-2 text-left">
                        {logs.map((log, i) => (
                            <div key={i} className={`p-3 rounded-lg text-sm flex items-start gap-2 ${log.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {log.type === 'success' ? <Check className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                                <span>{log.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
