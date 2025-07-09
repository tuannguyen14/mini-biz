import { X, AlertTriangle, Clock, CheckCircle, Edit2, Save, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Material } from '@/types';

interface InventoryTableProps {
    materials: Material[];
    onDeleteMaterial: (material: Material) => void;
    onUpdateMaterial: (materialId: string, updates: { name?: string; current_stock?: number }) => Promise<boolean>;
}

export function InventoryTable({ materials, onDeleteMaterial, onUpdateMaterial }: InventoryTableProps) {
    const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<'name' | 'stock' | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStockStatus = (stock: number) => {
        if (stock <= 50) {
            return {
                component: (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Sắp hết
                    </span>
                ),
                priority: 3
            };
        } else if (stock <= 100) {
            return {
                component: (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Thấp
                    </span>
                ),
                priority: 2
            };
        } else {
            return {
                component: (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Bình thường
                    </span>
                ),
                priority: 1
            };
        }
    };

    const handleStartEdit = (materialId: string, field: 'name' | 'stock', currentValue: string | number) => {
        setEditingMaterial(materialId);
        setEditingField(field);
        setEditValue(currentValue.toString());
    };

    const handleCancelEdit = () => {
        setEditingMaterial(null);
        setEditingField(null);
        setEditValue('');
    };

    const handleSaveEdit = async () => {
        if (!editingMaterial || !editingField) return;

        setIsUpdating(true);
        try {
            const updates: { name?: string; current_stock?: number } = {};
            
            if (editingField === 'name') {
                if (editValue.trim() === '') {
                    alert('Tên vật tư không được để trống');
                    return;
                }
                updates.name = editValue.trim();
            } else if (editingField === 'stock') {
                const stockValue = parseFloat(editValue);
                if (isNaN(stockValue) || stockValue < 0) {
                    alert('Tồn kho phải là số không âm');
                    return;
                }
                updates.current_stock = stockValue;
            }

            const success = await onUpdateMaterial(editingMaterial, updates);
            if (success) {
                handleCancelEdit();
            }
        } catch (error) {
            console.error('Error updating material:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Tồn kho vật tư
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Số lượng hiện có trong kho
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Tên vật tư
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Đơn vị
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Tồn kho
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Trạng thái
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Cập nhật
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {materials.map((material) => {
                            const stockStatus = getStockStatus(material.current_stock || 0);
                            const isEditingName = editingMaterial === material.id && editingField === 'name';
                            const isEditingStock = editingMaterial === material.id && editingField === 'stock';
                            
                            return (
                                <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isEditingName ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={handleKeyPress}
                                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {material.name}
                                                    </span>
                                                    <button
                                                        onClick={() => handleStartEdit(material.id, 'name', material.name)}
                                                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Sửa tên vật tư"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            {material.unit}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isEditingStock ? (
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={handleKeyPress}
                                                    className="w-24 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="0"
                                                    step="0.01"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {material.current_stock || 0}
                                                    </span>
                                                    <button
                                                        onClick={() => handleStartEdit(material.id, 'stock', material.current_stock || 0)}
                                                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Sửa tồn kho"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {stockStatus.component}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(material.updated_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {(isEditingName || isEditingStock) ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={isUpdating}
                                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Lưu"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={isUpdating}
                                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Hủy"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => onDeleteMaterial(material)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Xóa vật tư"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {materials.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">
                            Chưa có vật tư nào trong hệ thống
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}