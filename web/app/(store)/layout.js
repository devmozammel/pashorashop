import Header from "@/components/storefront/Header";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import CartDrawer from "@/components/cart/CartDrawer";
import MobileNav from "@/components/storefront/MobileNav";
import CartSync from "@/components/storefront/CartSync";

export default async function StoreLayout({ children }) {
    let settings = {};

    try {
        const settingsList = await prisma.siteSetting.findMany({
            where: { isPublic: true }
        });
        settings = settingsList.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    } catch (error) {
        console.error("Failed to fetch settings:", error);
    }

    return (
        <div className="flex min-h-screen flex-col relative" suppressHydrationWarning>
            <CartSync />
            <Header settings={settings} />
            <CartDrawer />

            <main className="flex-1 container mx-auto px-4 py-8 pb-32 md:pb-12">
                {children}
            </main>

            <Footer />
            <MobileNav />
        </div>
    );
}
