'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Material } from '@/types';

interface DeleteMaterialDialogProps {
    open: boolean;
    material: Material | null;
    onClose: () => void;
    onConfirm: () => Promise<boolean>;
}

export function DeleteMaterialDialog({ open, material, onClose, onConfirm }: DeleteMaterialDialogProps) {
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        try {
            const success = await onConfirm();
            if (success) {
                onClose();
            }
        } finally {
            setDeleting(false);
        }
    };

    if (!open || !material) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Xác nhận xóa vật tư
                        </h3>
                        <button
                            onClick={onClose}
                            disabled={deleting}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                                Bạn có chắc chắn muốn xóa?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Vật tư "{material.name}" sẽ bị xóa vĩnh viễn
                            </p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                            <strong>Lưu ý:</strong> Không thể xóa vật tư đã có phiếu nhập trong hệ thống.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={deleting}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={deleting}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-600 text-white rounded-xl hover:from-red-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {deleting ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa vật tư'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}