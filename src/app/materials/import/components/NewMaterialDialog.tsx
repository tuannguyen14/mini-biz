import { useState } from 'react';
import { X } from 'lucide-react';

interface NewMaterialDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (material: { name: string; unit: string }) => Promise<boolean>;
}

export function NewMaterialDialog({ open, onClose, onSubmit }: NewMaterialDialogProps) {
    const [formData, setFormData] = useState({ name: '', unit: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name || !formData.unit) {
            return;
        }

        setSubmitting(true);
        try {
            const success = await onSubmit(formData);
            if (success) {
                setFormData({ name: '', unit: '' });
                onClose();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', unit: '' });
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Thêm vật tư mới
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Tạo vật tư mới để thêm vào danh sách nhập
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Tên vật tư
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Chai nhựa 500ml"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Đơn vị tính
                        </label>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="VD: Chai, Thùng, Kg..."
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !formData.name || !formData.unit}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                                    Đang tạo...
                                </>
                            ) : (
                                'Tạo vật tư'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}