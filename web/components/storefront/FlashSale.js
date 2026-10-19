import ProductCard from "@/components/product/ProductCard";
import FlashSaleTimer from "@/components/product/FlashSaleTimer";

export default function FlashSale({ products, endTime, title }) {
    if (!products || products.length === 0) return null;

    return (
        <section className="container mx-auto px-4 py-4 md:py-6">
            <div className="mb-6 md:mb-8">
                <FlashSaleTimer endsAt={endTime} title={title} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} isFlashSale={true} />
                ))}
            </div>
        </section>
    );
}

