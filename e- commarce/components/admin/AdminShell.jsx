"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ children, title, actions }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
                <AdminTopbar toggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="container mx-auto max-w-7xl">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                            </div>
                            {actions && <div className="flex gap-2">{actions}</div>}
                        </div>

                        {/* Page Content */}
                        {children}
                    </div>
                </main>
            </div>

            {/* Overlay for mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
