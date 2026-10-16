"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as ttpixel from "@/lib/ttpixel";

export default function TikTokPixel({ id }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (id) {
            ttpixel.pageview();
        }
    }, [pathname, searchParams, id]);

    return null;
}
