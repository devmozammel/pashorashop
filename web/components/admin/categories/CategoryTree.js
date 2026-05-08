"use client";

import { Edit, Trash } from 'lucide-react';
import { Button, Badge } from '@/components/admin/ui/FormElements';

export default function CategoryTree({ categories, onEdit, onDelete, onToggleStatus }) {
    if (!categories || categories.length === 0) {
        return <div className="text-gray-500 text-center py-4">No categories found.</div>;
    }

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Slug</th>
                        <th className="px-6 py-3">Mega Menu</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {categories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{category.name}</td>
                            <td className="px-6 py-3 font-mono text-xs text-gray-500">{category.slug}</td>
                            <td className="px-6 py-3">
                                {category.showInMegaMenu ? (
                                    <Badge variant="default" size="sm" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                        Shown
                                    </Badge>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-3">
                                {category.isActive ? (
                                    <span className="text-green-600 font-bold text-xs">Active</span>
                                ) : (
                                    <span className="text-red-500 font-bold text-xs">Inactive</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-right flex justify-end gap-2">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => onToggleStatus(category)}
                                    className={category.isActive ? "text-green-600 border-green-200" : "text-gray-400"}
                                >
                                    {category.isActive ? "ON" : "OFF"}
                                </Button>
                                <Button size="xs" variant="ghost" onClick={() => onEdit(category)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
