import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });

        const settings = setting ? JSON.parse(setting.value) : {};
        const maintenanceMode = settings.maintenanceMode === true;

        return NextResponse.json({ 
            maintenanceMode,
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        // If DB is down, we allow site access to not make the situation worse
        return NextResponse.json({ maintenanceMode: false }, { status: 500 });
    }
}
