"use client";

import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/FormElements";
import { FileText, Copy, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function FeedExportPage() {
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const feedUrl = origin ? `${origin}/api/catalog/facebook.xml` : "Loading...";

    const copyUrl = () => {
        navigator.clipboard.writeText(feedUrl).then(() => {
            toast.success("Feed URL copied to clipboard!");
        });
    };

    return (
        <AdminShell title="Feed Export">
            <div className="bg-white p-8 rounded-xl border shadow-sm max-w-2xl text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Product Feed URL</h3>
                <p className="text-gray-500">
                    Use this URL to sync your products with Facebook Catalog or Google Merchant Center.
                </p>
                <div className="bg-gray-100 p-3 rounded-lg border font-mono text-sm break-all text-left text-gray-700">
                    {feedUrl}
                </div>
                <div className="flex justify-center gap-3">
                    <Button onClick={copyUrl} variant="secondary">
                        <Copy className="w-4 h-4 mr-2" /> Copy URL
                    </Button>
                    {origin && (
                        <a
                            href={feedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            <ExternalLink className="w-4 h-4" /> Open Feed
                        </a>
                    )}
                </div>
                <p className="text-xs text-gray-400">
                    The feed is automatically generated from your active products in the database.
                    No manual regeneration is needed.
                </p>
            </div>
        </AdminShell>
    );
}
