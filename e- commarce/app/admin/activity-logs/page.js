"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";


export default function ActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/admin/audit-logs?limit=100");
                const data = await res.json();
                if (data.logs) {
                    // Map db logs to table format
                    const formatted = data.logs.map(log => {
                        let meta = {};
                        try {
                            meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : (log.meta || {});
                        } catch (e) {
                            meta = {};
                        }
                        return {
                            id: log.id,
                            user: log.adminId,
                            action: log.action,
                            entity: `${log.entityType || ''} ${log.entityId ? `#${log.entityId}` : ''}`,
                            ip: meta.ip || '-',
                            at: log.createdAt
                        };
                    });
                    setLogs(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch audit logs", error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const columns = [
        { header: "User", accessor: "user" },
        { header: "Action", accessor: "action" },
        { header: "Entity", accessor: "entity" },
        { header: "IP Address", accessor: "ip" },
        { header: "Timestamp", cell: (row) => new Date(row.at).toLocaleString() },
    ];

    return (
        <AdminShell title="Activity Logs">
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading activity logs...</div>
            ) : (
                <DataTable columns={columns} data={logs} searchKey="action" />
            )}
        </AdminShell>
    );
}
