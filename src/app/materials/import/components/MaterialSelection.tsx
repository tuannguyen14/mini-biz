'use client';

import { useState } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { Material } from '@/types';

interface MaterialSelectionProps {
    materials: Material[];
    onSelectMaterial: (material: Material) => boolean;
}

export function MaterialSelection({ materials, onSelectMaterial }: MaterialSelectionProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMaterials = materials.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Chọn vật tư
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Tìm và chọn vật tư cần nhập kho
                </p>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm vật tư..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                    {filteredMaterials.map((material) => (
                        <div
                            key={material.id}
                            onClick={() => onSelectMaterial(material)}
                            className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                        >
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {material.name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Tồn: {material.current_stock || 0} {material.unit}
                                    </span>
                                    {(material.current_stock || 0) <= 50 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                                            <AlertTriangle className="w-3 h-3" />
                                            Sắp hết
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}