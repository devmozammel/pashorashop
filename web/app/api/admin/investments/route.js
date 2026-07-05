import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { promises as fs } from "fs";
import path from "path";

// Resolves to e:\e- commarce\web\appData\partners_investments.json
const DATA_FILE_PATH = path.join(process.cwd(), "appData", "partners_investments.json");

const DEFAULT_DATA = {
    partners: [
        {
            id: "partner-1",
            name: "Co-founder A",
            role: "Managing Director",
            investmentAmount: 500000,
            sharePercentage: 40,
            status: "Paid",
            joinedDate: "2026-01-10",
            avatarColor: "from-blue-500 to-indigo-500"
        },
        {
            id: "partner-2",
            name: "Co-founder B",
            role: "Operations Director",
            investmentAmount: 375000,
            sharePercentage: 30,
            status: "Paid",
            joinedDate: "2026-01-15",
            avatarColor: "from-pink-500 to-rose-500"
        },
        {
            id: "partner-3",
            name: "Co-founder C",
            role: "Marketing Director",
            investmentAmount: 250000,
            sharePercentage: 20,
            status: "Paid",
            joinedDate: "2026-02-01",
            avatarColor: "from-amber-500 to-orange-500"
        },
        {
            id: "partner-4",
            name: "Co-founder D",
            role: "Financial Director",
            investmentAmount: 125000,
            sharePercentage: 10,
            status: "Paid",
            joinedDate: "2026-02-10",
            avatarColor: "from-emerald-500 to-teal-500"
        }
    ],
    transactions: [
        {
            id: "tx-1",
            partnerId: "partner-1",
            partnerName: "Co-founder A",
            amount: 500000,
            date: "2026-01-10",
            type: "Capital Injection",
            description: "Initial capital contribution for shop launch"
        },
        {
            id: "tx-2",
            partnerId: "partner-2",
            partnerName: "Co-founder B",
            amount: 375000,
            date: "2026-01-15",
            type: "Capital Injection",
            description: "Initial capital contribution for shop launch"
        },
        {
            id: "tx-3",
            partnerId: "partner-3",
            partnerName: "Co-founder C",
            amount: 250000,
            date: "2026-02-01",
            type: "Capital Injection",
            description: "Sourcing and inventory capital contribution"
        },
        {
            id: "tx-4",
            partnerId: "partner-4",
            partnerName: "Co-founder D",
            amount: 125000,
            date: "2026-02-10",
            type: "Capital Injection",
            description: "Office setup and initial marketing cash injection"
        }
    ]
};

async function getFileData() {
    try {
        const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
        return JSON.parse(fileContent);
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
        return NextResponse.json({ ok: true, data });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { partners = [], transactions = [] } = body;

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
            transactions
        };

        // Write back to the file
        await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2), "utf-8");

        return NextResponse.json({ ok: true, data: updatedData });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
