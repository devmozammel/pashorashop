import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrderSuccessDisplay from "@/components/storefront/OrderSuccessDisplay";

export default async function OrderSuccessPage(props) {
    const session = await getServerSession(authOptions);
    const params = await props.params;
    const { id } = params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
    });

    if (!order) notFound();

    // If order has a userId, and we have a session, ensure they match.
    // If it's a guest order (userId: null), anyone with the ID can view (minimal security risk for success page).
    if (order.userId && session?.user?.id && order.userId !== session.user.id) {
        redirect("/");
    }

    return <OrderSuccessDisplay order={order} />;
}
