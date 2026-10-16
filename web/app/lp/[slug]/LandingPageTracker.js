"use client";

import { useEffect } from "react";
import * as fpixel from "@/lib/fpixel";
import * as ttpixel from "@/lib/ttpixel";

export default function LandingPageTracker({ product, price }) {
    useEffect(() => {
        if (!product) return;
        const val = Number(price || 0);

        try {
            fpixel.event("ViewContent", {
                content_name: product.name,
                content_ids: [product.id],
                content_type: "product",
                value: val,
                currency: "BDT"
            });
        } catch (e) {
            console.error("LP FB ViewContent error:", e);
        }

        try {
            ttpixel.event("ViewContent", {
                content_id: product.id,
                content_name: product.name,
                content_type: "product",
                value: val,
                currency: "BDT"
            });
        } catch (e) {
            console.error("LP TT ViewContent error:", e);
        }
    }, [product, price]);

    return null;
}
