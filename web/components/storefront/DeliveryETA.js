
"use client";

import { Truck, MapPin } from "lucide-react";

export default function DeliveryETA() {
    // Simple logic for demo
    const today = new Date();

    const formatDate = (daysToAdd) => {
        const date = new Date(today);
        date.setDate(date.getDate() + daysToAdd);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 my-6 space-y-3">
            <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary mt-0.5" />
                <div>
                    <p className="font-semibold text-sm">Estimated Delivery</p>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between w-full gap-8">
                            <span>Inside Dhaka:</span>
                            <span className="font-medium text-foreground">{formatDate(2)} - {formatDate(3)}</span>
                        </div>
                        <div className="flex justify-between w-full gap-8">
                            <span>Outside Dhaka:</span>
                            <span className="font-medium text-foreground">{formatDate(3)} - {formatDate(5)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
