"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";

export default function CartSync() {
    const { status } = useSession();
    const syncWithServer = useCartStore((state) => state.syncWithServer);
    const hasSynced = useRef(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && status === "authenticated" && !hasSynced.current) {
            hasSynced.current = true;
            syncWithServer();
        }
    }, [status, syncWithServer, mounted]);

    return null;
}
