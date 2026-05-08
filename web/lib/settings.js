import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getSettings = cache(async () => {
    try {
        const settings = await prisma.siteSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    } catch (error) {
        console.error("Failed to fetch settings", error);
        return {};
    }
});
