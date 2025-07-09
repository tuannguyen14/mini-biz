import { Package, Plus, Download, Upload } from 'lucide-react';
import { ChangeEvent } from 'react';

interface HeaderProps {
    onNewMaterial: () => void;
    onImportFromExcel: (file: File) => Promise<void>;
}

export function Header({ onNewMaterial, onImportFromExcel }: HeaderProps) {
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onImportFromExcel(file);
            // Reset the input to allow selecting the same file again
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                        <Package className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Quản lý nhập kho
                    </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                    Hệ thống quản lý vật tư và phiếu nhập kho thông minh
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onNewMaterial}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-4 h-4" />
                    Thêm vật tư mới
                </button>
                
                {/* Import from Excel button */}
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Nhập từ Excel
                    <input 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
                
                <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
            </div>
        </div>
    );
}