
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

export default function TrustBlocks() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b py-6 my-8">
            <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-primary" />
                <div>
                    <h4 className="font-semibold text-sm">Fast Delivery</h4>
                    <p className="text-xs text-muted-foreground">Across Bangladesh</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                    <h4 className="font-semibold text-sm">Genuine Products</h4>
                    <p className="text-xs text-muted-foreground">100% Authentic</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <RotateCcw className="w-8 h-8 text-primary" />
                <div>
                    <h4 className="font-semibold text-sm">Easy Returns</h4>
                    <p className="text-xs text-muted-foreground">7 Days Policy</p>
                </div>
            </div>
        </div>
    );
}
