import { ShieldCheck, Truck, RotateCcw, Award } from "lucide-react";

export default function TrustBadges() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-gray-100 bg-gray-50/50 rounded-lg px-4 my-6">
            <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-900">Secure Payment</h4>
                    <p className="text-[10px] text-gray-500">100% Secure COD & Online</p>
                </div>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <Truck size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-900">Fast Delivery</h4>
                    <p className="text-[10px] text-gray-500">2-5 Days Nationwide</p>
                </div>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                    <RotateCcw size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-900">Easy Returns</h4>
                    <p className="text-[10px] text-gray-500">7 Days Return Policy</p>
                </div>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                    <Award size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-900">Authentic</h4>
                    <p className="text-[10px] text-gray-500">100% Original Products</p>
                </div>
            </div>
        </div>
    );
}
