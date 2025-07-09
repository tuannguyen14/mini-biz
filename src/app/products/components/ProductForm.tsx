'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, CheckCircle, Calculator, Factory } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface ProductFormData {
  name: string;
  unit: string;
  quantity: number;
  materials: { material_id: string; quantity_required: number }[];
  notes: string;
}

export default function ProductForm({ materials }: { materials: Material[] }) {
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    unit: '',
    quantity: 0,
    materials: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [productCost, setProductCost] = useState(0);

  useEffect(() => {
    if (productForm.materials.length > 0) {
      calculateFormProductCost();
    } else {
      setProductCost(0);
    }
  }, [productForm.materials]);

  const calculateFormProductCost = async () => {
    let totalCost = 0;

    for (const material of productForm.materials) {
      if (material.material_id && material.quantity_required > 0) {
        const { data, error } = await supabase
          .from('material_imports')
          .select('quantity, unit_price')
          .eq('material_id', material.material_id);

        if (!error && data && data.length > 0) {
          const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
          const totalValue = data.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
          const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
          totalCost += material.quantity_required * avgPrice;
        }
      }
    }

    setProductCost(totalCost);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (productForm.quantity > 0) {
        const requiredMaterials = productForm.materials.map(material => {
          const materialInfo = materials.find(m => m.id === material.material_id);
          return {
            material_id: material.material_id,
            required: material.quantity_required * productForm.quantity,
            available: materialInfo?.current_stock || 0,
            name: materialInfo?.name || '',
            unit: materialInfo?.unit || ''
          };
        });

        const insufficientMaterials = requiredMaterials.filter(rm => rm.required > rm.available);

        if (insufficientMaterials.length > 0) {
          const message = insufficientMaterials
            .map(rm => `${rm.name}: cần ${rm.required} ${rm.unit}, chỉ có ${rm.available} ${rm.unit}`)
            .join('\n');
          alert(`Không đủ vật tư để sản xuất:\n${message}`);
          return;
        }
      }

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          unit: productForm.unit
        })
        .select()
        .single();

      if (productError) throw productError;

      if (productForm.materials.length > 0) {
        const productMaterialsData = productForm.materials.map(material => ({
          product_id: newProduct.id,
          material_id: material.material_id,
          quantity_required: material.quantity_required
        }));

        const { error: materialsError } = await supabase
          .from('product_materials')
          .insert(productMaterialsData);

        if (materialsError) throw materialsError;
      }

      alert(`Tạo sản phẩm "${productForm.name}" thành công!`);
      setProductForm({
        name: '',
        unit: '',
        quantity: 0,
        materials: [],
        notes: ''
      });
      setProductCost(0);
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      alert('Lỗi khi tạo sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  const addMaterialToProduct = () => {
    setProductForm(prev => ({
      ...prev,
      materials: [...prev.materials, { material_id: '', quantity_required: 0 }]
    }));
  };

  const removeMaterialFromProduct = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateProductMaterial = (index: number, field: string, value: string | number) => {
    setProductForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tạo Sản Phẩm & Công Thức</h2>
            <p className="text-emerald-100 text-sm">Thiết lập sản phẩm với công thức BOM</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleCreateProduct} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-5 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-gray-800 font-medium"
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Đơn vị tính *
              </label>
              <input
                type="text"
                value={productForm.unit}
                onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="VD: thùng, hộp, chai..."
                className="w-full px-5 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-gray-800 font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-gray-800">
                Công thức sản phẩm (BOM)
              </label>
              <button
                type="button"
                onClick={addMaterialToProduct}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-2xl text-sm hover:shadow-xl transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Thêm vật tư</span>
              </button>
            </div>

            <div className="space-y-4">
              {productForm.materials.map((material, index) => (
                <div key={index} className="flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300">
                  <select
                    value={material.material_id}
                    onChange={(e) => updateProductMaterial(index, 'material_id', e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 font-medium"
                    required
                  >
                    <option value="">Chọn vật tư</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit}) - Tồn: {m.current_stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={material.quantity_required}
                    onChange={(e) => updateProductMaterial(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                    placeholder="Số lượng/1 sản phẩm"
                    className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterialFromProduct(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {productForm.materials.length > 0 && productCost > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 p-6 rounded-3xl border-2 border-blue-200 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-gray-800 text-lg">Giá thành ước tính/sản phẩm:</span>
                  </div>
                  <span className="font-bold text-blue-600 text-xl">
                    {productCost.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Ghi chú
            </label>
            <textarea
              value={productForm.notes}
              onChange={(e) => setProductForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-5 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none font-medium"
              placeholder="Ghi chú về sản phẩm..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl hover:shadow-xl disabled:opacity-50 transition-all duration-300 font-bold text-lg hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tạo sản phẩm...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Tạo Sản Phẩm Mới</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}