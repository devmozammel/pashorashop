import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    return { title: `Invoice #${params.id} | Fashion House` };
}

export default async function InvoicePage({ params }) {
    const session = await getServerSession(authOptions);
    const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: { items: { include: { product: true } } }
    });

    if (!order) notFound();

    // Security check
    if (!session || (session.user.role !== "ADMIN" && order.userId !== session.user.id)) {
        redirect("/auth/login");
    }

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            <div className="max-w-3xl mx-auto border p-8 print:border-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Invoice</h1>
                        <p className="text-sm text-gray-500">#{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-xl">Fashion House</h2>
                        <p className="text-sm text-gray-500">123 Fashion Street</p>
                        <p className="text-sm text-gray-500">Dhaka, Bangladesh</p>
                        <p className="text-sm text-gray-500">contact@fashionhouse.com</p>
                    </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Bill To</h3>
                        <p>{order.shippingAddress?.name}</p>
                        <p>{order.shippingAddress?.street}</p>
                        <p>{order.shippingAddress?.city} {order.shippingAddress?.zip}</p>
                        <p>{order.shippingAddress?.phone}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Order Details</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment:</span>
                                <span>{order.paymentMethod}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2">Item</th>
                            <th className="text-center py-2">Qty</th>
                            <th className="text-right py-2">Price</th>
                            <th className="text-right py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="py-2">
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.id}</p>
                                </td>
                                <td className="text-center py-2">{item.quantity}</td>
                                <td className="text-right py-2">{formatCurrency(item.price)}</td>
                                <td className="text-right py-2 font-bold">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>{formatCurrency(order.shippingCost)}</span>
                        </div>
                        {Number(order.discount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2 border-black">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-12 print:fixed print:bottom-8 print:left-0 print:w-full">
                    <p>Thank you for shopping with Fashion House.</p>
                    <p>For support, email contact@fashionhouse.com</p>
                </div>
            </div>

            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full shadow-lg print:hidden font-bold hover:bg-gray-800"
            >
                Print Invoice
            </button>
        </div>
    );
}
