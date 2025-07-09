import { Package, Save, X } from 'lucide-react';
import { ImportItem } from '@/types';
import { ImportItemCard } from './ImportItemCard';

interface ImportFormProps {
    importItems: ImportItem[];
    importNotes: string;
    saving: boolean;
    totalAmount: number;
    onUpdateItem: (index: number, field: keyof ImportItem, value: any) => void;
    onRemoveItem: (index: number) => void;
    onNotesChange: (notes: string) => void;
    onSave: () => void;
    onReset: () => void;
}

export function ImportForm({
    importItems,
    importNotes,
    saving,
    totalAmount,
    onUpdateItem,
    onRemoveItem,
    onNotesChange,
    onSave,
    onReset
}: ImportFormProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Phiếu nhập kho
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Nhập thông tin chi tiết cho từng vật tư
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Tổng giá trị
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {importItems.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            Chưa có vật tư nào
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                            Chọn vật tư từ danh sách bên trái để bắt đầu tạo phiếu nhập
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {importItems.map((item, index) => (
                                <ImportItemCard
                                    key={index}
                                    item={item}
                                    index={index}
                                    onUpdate={onUpdateItem}
                                    onRemove={onRemoveItem}
                                />
                            ))}
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Ghi chú
                                </label>
                                <textarea
                                    placeholder="Ghi chú cho phiếu nhập (tùy chọn)"
                                    value={importNotes}
                                    onChange={(e) => onNotesChange(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={onReset}
                                    className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4 mr-2 inline" />
                                    Hủy
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={saving}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2 inline" />
                                            Lưu phiếu nhập
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}