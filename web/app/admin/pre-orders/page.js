import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = 'force-dynamic';

export default async function AdminPreOrdersPage() {
    const preOrders = await prisma.preOrderRequest.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <AdminShell title="Pre-Order & Sourcing Requests">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Customer Info</th>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {preOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No pre-order requests found.
                                    </td>
                                </tr>
                            ) : (
                                preOrders.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {request.imageUrl ? (
                                                <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80">
                                                    <Image src={request.imageUrl} alt="Requested Product" fill className="object-cover" />
                                                </a>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                                                    No Img
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{request.name}</div>
                                            <div className="text-gray-500 mt-1">{request.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="whitespace-pre-wrap">{request.details}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                request.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                                                request.status === "CONTACTED" ? "bg-blue-100 text-blue-800" :
                                                "bg-red-100 text-red-800"
                                            }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {format(new Date(request.createdAt), "dd MMM yyyy, h:mm a")}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminShell>
    );
}
