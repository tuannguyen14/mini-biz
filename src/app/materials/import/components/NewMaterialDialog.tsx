import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface NewMaterialDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (material: { name: string; unit: string }) => Promise<boolean>;
}

export function NewMaterialDialog({ open, onClose, onSubmit }: NewMaterialDialogProps) {
    const [formData, setFormData] = useState({ name: '', unit: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Reset error
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Vui lòng nhập tên vật tư');
            return;
        }

        if (!formData.unit.trim()) {
            setError('Vui lòng nhập đơn vị tính');
            return;
        }

        setSubmitting(true);
        try {
            const success = await onSubmit({
                name: formData.name.trim(),
                unit: formData.unit.trim()
            });
            
            if (success) {
                setFormData({ name: '', unit: '' });
                setError('');
                onClose();
            }
            // Error từ onSubmit sẽ được hiển thị qua toast, không cần xử lý ở đây
        } catch (error) {
            console.error('Error in dialog submit:', error);
            setError('Đã xảy ra lỗi không mong muốn');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', unit: '' });
        setError('');
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !submitting) {
            handleSubmit();
        }
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
                            disabled={submitting}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Tạo vật tư mới để thêm vào danh sách nhập
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-red-800 dark:text-red-200 text-sm">
                                {error}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Tên vật tư *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (error) setError(''); // Clear error khi user bắt đầu gõ
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="VD: Chai nhựa 500ml"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            disabled={submitting}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Đơn vị tính *
                        </label>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => {
                                setFormData({ ...formData, unit: e.target.value });
                                if (error) setError(''); // Clear error khi user bắt đầu gõ
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="VD: Chai, Thùng, Kg..."
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            disabled={submitting}
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
                            disabled={submitting || !formData.name.trim() || !formData.unit.trim()}
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