import { X } from 'lucide-react';
import { ImportItem } from '@/types';

interface ImportItemCardProps {
    item: ImportItem;
    index: number;
    onUpdate: (index: number, field: keyof ImportItem, value: any) => void;
    onRemove: (index: number) => void;
}

export function ImportItemCard({ item, index, onUpdate, onRemove }: ImportItemCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                        {item.materialName}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Đơn vị: {item.unit}
                    </p>
                </div>
                <button
                    onClick={() => onRemove(index)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Số lượng
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Đơn giá (VND)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Thành tiền
                    </label>
                    <input
                        type="text"
                        value={formatCurrency(item.totalAmount)}
                        readOnly
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    />
                </div>
            </div>
        </div>
    );
}