
"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return <div>Loading Analytics...</div>;
    if (!data) return <div>Error loading data</div>;

    return (
        <div className="space-y-8">
            {/* Sales Chart */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Sales - Last 30 Days</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.salesByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value} BDT`} />
                            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Top 5 Best Selling Products</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topProducts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="quantity" fill="#10b981" barSize={30} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
