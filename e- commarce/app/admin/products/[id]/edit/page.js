import ProductFormPage from "@/components/admin/ProductFormPage";

// Properly async params for Next.js 15
export default async function EditProductPage(props) {
    const params = await props.params; // Await params in newer Next.js
    return <ProductFormPage params={params} />;
}
