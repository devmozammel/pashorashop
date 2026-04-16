
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function checkRole(allowedRoles = []) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const start = Date.now();
    // Fetch fresh user role from DB to be safe
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user || !allowedRoles.includes(user.role)) {
        redirect("/admin/unauthorized"); // Or just throw error
    }

    return session;
}
