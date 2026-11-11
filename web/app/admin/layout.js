import { requireStaff } from "@/lib/require-admin";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Pashora Shop Admin",
    description: "Manage your store",
};

export default async function AdminLayout({ children }) {
    const session = await requireStaff();
    
    if (!session) {
        return redirect("/auth/login"); // Or wherever your login page is
    }

    return (
        <div className="admin-layout-wrapper">
            {children}
        </div>
    );
}
