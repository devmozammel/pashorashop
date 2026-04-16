"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            // Save referral code for 30 days
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            const affiliateData = {
                code: ref,
                expires: expirationDate.getTime()
            };

            localStorage.setItem("affiliate_ref", JSON.stringify(affiliateData));
        }
    }, [searchParams]);

    return null;
}
