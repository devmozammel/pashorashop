"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/FormElements";
import { Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    // Modal State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users");
                const data = await res.json();
                if (data.ok) {
                    setUsers(data.data);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load users");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!emailSubject.trim() || !emailMessage.trim()) {
            toast.error("Please provide both subject and message.");
            return;
        }

        const selectedEmails = users
            .filter(u => selectedUserIds.includes(u.id))
            .map(u => u.email);

        setIsSending(true);
        try {
            const res = await fetch("/api/admin/users/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emails: selectedEmails,
                    subject: emailSubject,
                    message: emailMessage
                })
            });

            const data = await res.json();
            if (data.ok) {
                toast.success(data.message);
                setIsEmailModalOpen(false);
                setEmailSubject("");
                setEmailMessage("");
                // Optionally clear selection, but leaving it might be useful
            } else {
                toast.error(data.message || "Failed to send email");
            }
        } catch (error) {
            toast.error("An error occurred while sending the email");
        } finally {
            setIsSending(false);
        }
    };

    const toggleRole = async (user) => {
        const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
        if (!confirm(`Change ${user.email} to ${newRole}?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(`Role updated to ${newRole}`);
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const columns = [
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Phone", accessor: "phone" },
        { header: "Role", cell: (row) => <Badge variant={row.role === 'ADMIN' ? 'primary' : 'secondary'}>{row.role}</Badge> },
        { header: "Total Orders", accessor: "totalOrders" },
        { header: "Status", cell: () => <Badge variant="success">ACTIVE</Badge> },
        {
            header: "Actions",
            cell: (row) => (
                <button
                    onClick={() => toggleRole(row)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                >
                    Switch to {row.role === 'ADMIN' ? 'User' : 'Admin'}
                </button>
            )
        }
    ];

    return (
        <AdminShell title="Users">

            <div className="flex justify-end mb-4 gap-3">
                {selectedUserIds.length > 0 && (
                    <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                        <Mail className="w-4 h-4" />
                        Email {selectedUserIds.length} User{selectedUserIds.length !== 1 && 's'}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={users}
                    searchKey="email"
                    onSelectionChange={setSelectedUserIds}
                />
            )}

            {/* Email Modal */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Send Bulk Email</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Sending to {selectedUserIds.length} selected user{selectedUserIds.length !== 1 && 's'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEmailModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                disabled={isSending}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendEmail} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Enter email subject..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    disabled={isSending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message (HTML Supported)</label>
                                <textarea
                                    required
                                    value={emailMessage}
                                    onChange={(e) => setEmailMessage(e.target.value)}
                                    placeholder="<p>Dear Customer...</p>"
                                    rows={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y font-mono text-sm"
                                    disabled={isSending}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    You can write standard text or use HTML tags (e.g. &lt;b&gt;, &lt;h1&gt;, &lt;a href="..."&gt;) to style your email.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    disabled={isSending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || !emailSubject.trim() || !emailMessage.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
