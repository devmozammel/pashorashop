import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrderSuccessDisplay from "@/components/storefront/OrderSuccessDisplay";

export default async function OrderSuccessPage(props) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/auth/login");

    const params = await props.params;
    const { id } = params;

    const order = await prisma.order.findUnique({
        where: { id },
    });

    if (!order) notFound();

    // Ensure user only sees their own order
    if (order.userId !== session.user.id) {
        redirect("/");
    }

    return <OrderSuccessDisplay order={order} />;
}
