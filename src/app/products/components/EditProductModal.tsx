'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Calculator, Factory, X, Plus, Minus } from 'lucide-react';
import { updateProduct, updateProductMaterials } from '../actions';
import { Material } from '@/types';
import { supabase } from '@/lib/supabase';

interface EditProductModalProps {
    product: {
        id: string;
        name: string;
        unit: string;
    };
    materials: Material[];
    productMaterials: Array<{
        material_id: string;
        quantity_required: number;
    }>;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EditProductModal({
    product,
    materials,
    productMaterials,
    onClose,
    onUpdate,
}: EditProductModalProps) {
    const [formData, setFormData] = useState({
        name: product.name,
        unit: product.unit,
        materials: productMaterials,
    });
    const [loading, setLoading] = useState(false);
    const [productCost, setProductCost] = useState(0);

    useEffect(() => {
        calculateFormProductCost();
    }, [formData.materials]);

    const calculateFormProductCost = async () => {
        let totalCost = 0;

        for (const material of formData.materials) {
            if (material.material_id && material.quantity_required > 0) {
                const { data } = await supabase
                    .from('material_imports')
                    .select('quantity, unit_price')
                    .eq('material_id', material.material_id);

                if (data && data.length > 0) {
                    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
                    const totalValue = data.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                    const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                    totalCost += material.quantity_required * avgPrice;
                }
            }
        }

        setProductCost(totalCost);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Cập nhật thông tin sản phẩm
            await updateProduct(product.id, {
                name: formData.name,
                unit: formData.unit,
            });

            // Cập nhật công thức sản phẩm
            await updateProductMaterials(product.id, formData.materials);

            alert('Cập nhật sản phẩm thành công!');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            alert('Lỗi khi cập nhật sản phẩm!');
        } finally {
            setLoading(false);
        }
    };

    const addMaterial = () => {
        setFormData(prev => ({
            ...prev,
            materials: [...prev.materials, { material_id: '', quantity_required: 0 }],
        }));
    };

    const removeMaterial = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index),
        }));
    };

    const updateMaterial = (index: number, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.map((material, i) =>
                i === index ? { ...material, [field]: value } : material
            ),
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Factory className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Chỉnh sửa sản phẩm</h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Tên sản phẩm *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Đơn vị tính *
                                </label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) =>
                                        setFormData({ ...formData, unit: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-bold text-gray-800">
                                    Công thức sản phẩm
                                </label>
                                <button
                                    type="button"
                                    onClick={addMaterial}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center space-x-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm vật tư</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.materials.map((material, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                                    >
                                        <select
                                            value={material.material_id}
                                            onChange={(e) =>
                                                updateMaterial(index, 'material_id', e.target.value)
                                            }
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Chọn vật tư</option>
                                            {materials.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} ({m.unit}) - Tồn: {m.current_stock}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={material.quantity_required}
                                            onChange={(e) =>
                                                updateMaterial(
                                                    index,
                                                    'quantity_required',
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMaterial(index)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-300"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {formData.materials.length > 0 && productCost > 0 && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <Calculator className="w-5 h-5 text-blue-600" />
                                            <span className="font-medium text-gray-800">
                                                Giá thành ước tính/sản phẩm:
                                            </span>
                                        </div>
                                        <span className="font-bold text-blue-600">
                                            {productCost.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Lưu thay đổi</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}