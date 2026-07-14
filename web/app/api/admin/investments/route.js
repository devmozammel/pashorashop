import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

// Resolves to e:\e- commarce\web\appData\partners_investments.json
const DATA_FILE_PATH = path.join(process.cwd(), "appData", "partners_investments.json");

const DEFAULT_DATA = {
    partners: [],
    transactions: [],
    boostingSpends: []
};

async function getFileData() {
    try {
        const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        return {
            partners: parsed.partners || [],
            transactions: parsed.transactions || [],
            boostingSpends: parsed.boostingSpends || []
        };
    } catch (error) {
        // If file does not exist or has invalid JSON, write default data and return it
        try {
            await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
            await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
        } catch (e) {
            console.error("Error creating default partners file:", e);
        }
        return DEFAULT_DATA;
    }
}

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const data = await getFileData();

        // Query real-time statistics from the database using Prisma
        const [
            deliveredAgg, shippedAgg, returnedAgg, totalOrders, returnedOrders,
            whatsappSales, facebookSales, phoneSales
        ] = await Promise.all([
            prisma.order.aggregate({
                where: { status: "DELIVERED" },
                _sum: { total: true }
            }),
            prisma.order.aggregate({
                where: { status: "SHIPPED" },
                _sum: { total: true }
            }),
            prisma.order.aggregate({
                where: { status: "RETURNED" },
                _sum: { total: true }
            }),
            prisma.order.count(),
            prisma.order.count({
                where: { status: "RETURNED" }
            }),
            prisma.order.aggregate({
                where: { status: "DELIVERED", orderNumber: { startsWith: "WA-" } },
                _sum: { total: true }
            }),
            prisma.order.aggregate({
                where: { status: "DELIVERED", orderNumber: { startsWith: "FB-" } },
                _sum: { total: true }
            }),
            prisma.order.aggregate({
                where: { status: "DELIVERED", orderNumber: { startsWith: "PH-" } },
                _sum: { total: true }
            })
        ]);

        const deliveredVal = deliveredAgg._sum.total || 0;
        const waVal = whatsappSales._sum.total || 0;
        const fbVal = facebookSales._sum.total || 0;
        const phVal = phoneSales._sum.total || 0;
        const webVal = Math.max(0, deliveredVal - waVal - fbVal - phVal);

        const dbStats = {
            deliveredSales: deliveredVal,
            shippedSales: shippedAgg._sum.total || 0,
            returnedSales: returnedAgg._sum.total || 0,
            totalOrders,
            returnedOrdersCount: returnedOrders,
            whatsappSales: waVal,
            facebookSales: fbVal,
            phoneSales: phVal,
            websiteSales: webVal
        };

        return NextResponse.json({ ok: true, data, dbStats });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { partners = [], transactions = [], boostingSpends = [] } = body;

        // Calculate total investment amount
        const totalInvestment = partners.reduce((sum, p) => sum + (Number(p.investmentAmount) || 0), 0);

        // Recalculate share percentages dynamically
        const updatedPartners = partners.map(partner => {
            const amount = Number(partner.investmentAmount) || 0;
            const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;
            return {
                ...partner,
                investmentAmount: amount,
                sharePercentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
            };
        });

        const updatedData = {
            partners: updatedPartners,
            transactions,
            boostingSpends
        };

        // Write back to the file
        await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2), "utf-8");

        return NextResponse.json({ ok: true, data: updatedData });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

