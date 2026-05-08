"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useUserSession } from "@/lib/userSession";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function NotificationDropdown() {
    const { user, status } = useUserSession();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/user/notifications");
            if (res.ok) {
                const result = await res.json();
                const items = result.data || [];
                setNotifications(items);
                setUnreadCount(items.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user, status]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/user/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRead: true })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/api/user/notifications/mark-all-read`, { method: "POST" });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation(); // prevent clicking the background
        try {
            await fetch(`/api/user/notifications/${id}`, { method: "DELETE" });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    if (status !== "authenticated") return null;

    return (
        <div className="relative z-50 hidden md:block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground/80 hover:text-foreground hover:bg-secondary/50 rounded-full transition-colors relative"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <Bell className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 flex gap-3 group transition-colors ${notification.isRead ? 'bg-white' : 'bg-blue-50/50'}`}
                                        onMouseEnter={() => !notification.isRead && markAsRead(notification.id)}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                            {notification.type === 'ORDER_STATUS_UPDATE' && (
                                                <Link href="/my-orders" onClick={() => setIsOpen(false)} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                                    View Orders
                                                </Link>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => deleteNotification(notification.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all h-fit"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
