"use client";

import { Menu, Bell, Check, Trash2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

export default function AdminTopbar({ toggleSidebar }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch on mount & every 30s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                {unreadCount} New
                            </span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="flex flex-col">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-colors relative group
                                                ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-1 min-w-0 pr-8">
                                                    <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-xs text-gray-400 mt-1 block">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1 block">
                                                        {notification.type.replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons (Hover) */}
                                            <div className="absolute right-3 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                        title="Mark as read"
                                                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                    title="Delete"
                                                    className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                                    <Bell className="w-10 h-10 text-gray-300 mb-3" />
                                    <p className="font-medium text-gray-900">All caught up!</p>
                                    <p className="text-sm text-gray-500 mt-1">No new notifications.</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 border-t bg-gray-50/80 text-center">
                                <button
                                    onClick={() => notifications.forEach(n => !n.isRead && markAsRead(n.id))}
                                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider disabled:opacity-50"
                                    disabled={unreadCount === 0}
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
