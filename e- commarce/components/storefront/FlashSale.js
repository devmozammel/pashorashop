import ProductCard from "@/components/product/ProductCard";
import FlashSaleTimer from "@/components/product/FlashSaleTimer";

export default function FlashSale({ products, endTime, title }) {
    if (!products || products.length === 0) return null;

    return (
        <section className="container px-4">
            <div className="mb-12">
                <FlashSaleTimer endsAt={endTime} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} isFlashSale={true} />
                ))}
            </div>
        </section>
    );
}
