"use client";

import ProductFormPage from "@/components/admin/ProductFormPage";

export default function EditProductPage() {
    // ProductFormPage uses useParams() internally to get the [id] segment,
    // so no need to pass params as a prop.
    return <ProductFormPage />;
}
