"use client";

import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/FormElements";
import { ImageIcon } from "lucide-react";

export default function ImagesPage() {
    return (
        <AdminShell title="Images">
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-xl bg-gray-50">
                <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Bulk Image Management</h3>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                    Manage all product images in one place. Drag and drop to upload multiple files at once.
                </p>
                <Button>Upload Images</Button>
            </div>
        </AdminShell>
    );
}
