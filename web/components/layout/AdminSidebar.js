
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Settings,
    LogOut,
    Ticket,
    Undo2
} from "lucide-react";

export default function AdminSidebar() {
    return (
        <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-gray-50/40">
            <div className="p-6 border-b">
                <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
                    <span>Admin Panel</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                </Link>
                <Link
                    href="/admin/orders"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <Package className="w-4 h-4" />
                    Orders
                </Link>
                <Link
                    href="/admin/products"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Products
                </Link>
                <Link
                    href="/admin/coupons"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <Ticket className="w-4 h-4" />
                    Coupons
                </Link>
                <Link
                    href="/admin/returns"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <Undo2 className="w-4 h-4" />
                    Returns
                </Link>
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </Link>
            </nav>
            <div className="p-4 border-t">
                <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50">
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
