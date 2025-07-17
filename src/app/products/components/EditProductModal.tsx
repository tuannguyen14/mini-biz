'use client';

import { useState, useEffect, useRef } from 'react';
import { Edit3, Save, X, Plus, Minus, Search, ChevronDown, Package, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface ProductMaterial {
  id: string;
  material_id: string;
  quantity_required: number;
  material: Material;
}

interface EditProductModalProps {
  show: boolean;
  product: {
    id: string;
    name: string;
    unit: string;
  } | null;
  materials: Material[];
  onClose: () => void;
  onSuccess: () => void;
}

interface MaterialSelectProps {
  materials: Material[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  excludeIds?: string[];
}

function MaterialSelect({ materials, value, onChange, placeholder = "Chọn vật tư", excludeIds = [] }: MaterialSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMaterials = materials
    .filter(material => !excludeIds.includes(material.id))
    .filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectedMaterial = materials.find(m => m.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (materialId: string) => {
    onChange(materialId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium bg-white text-left flex items-center justify-between"
      >
        <span className={selectedMaterial ? "text-gray-800" : "text-gray-500"}>
          {selectedMaterial 
            ? `${selectedMaterial.name} (${selectedMaterial.unit}) - Tồn: ${selectedMaterial.current_stock}`
            : placeholder
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 -mx-20 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm vật tư..."
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => handleSelect(material.id)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{material.name}</span>
                      <span className="text-sm text-gray-500">Đơn vị: {material.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-blue-600 text-sm">
                        Tồn: {material.current_stock}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-gray-500 text-center">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                Không tìm thấy vật tư nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditProductModal({ show, product, materials, onClose, onSuccess }: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productUnit, setProductUnit] = useState('');
  const [productMaterials, setProductMaterials] = useState<Array<{
    id?: string;
    material_id: string;
    quantity_required: number;
  }>>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (show && product) {
      setProductName(product.name);
      setProductUnit(product.unit);
      fetchProductMaterials();
    }
  }, [show, product]);

  useEffect(() => {
    if (productMaterials.length > 0) {
      calculateEstimatedCost();
    } else {
      setEstimatedCost(0);
    }
  }, [productMaterials]);

  const fetchProductMaterials = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .from('product_materials')
        .select('*')
        .eq('product_id', product.id);

      if (error) throw error;

      setProductMaterials(data || []);
    } catch (error) {
      console.error('Error fetching product materials:', error);
    }
  };

  const calculateEstimatedCost = async () => {
    let totalCost = 0;

    for (const material of productMaterials) {
      if (material.material_id && material.quantity_required > 0) {
        try {
          const { data, error } = await supabase
            .from('material_imports')
            .select('quantity, unit_price')
            .eq('material_id', material.material_id);

          if (!error && data && data.length > 0) {
            const validData = data.filter(item => 
              typeof item.quantity === 'number' && 
              typeof item.unit_price === 'number' &&
              item.quantity > 0 &&
              item.unit_price > 0
            );

            if (validData.length > 0) {
              const totalQuantity = validData.reduce((sum, item) => sum + item.quantity, 0);
              const totalValue = validData.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
              const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
              totalCost += material.quantity_required * avgPrice;
            }
          }
        } catch (error) {
          console.error('Error calculating material cost:', error);
        }
      }
    }

    setEstimatedCost(totalCost);
  };

  const handleSave = async () => {
    if (!product || !productName.trim() || !productUnit.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    setLoading(true);

    try {
      // Cập nhật thông tin sản phẩm
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productName.trim(),
          unit: productUnit.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Xóa công thức cũ
      const { error: deleteError } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', product.id);

      if (deleteError) throw deleteError;

      // Thêm công thức mới (nếu có)
      if (productMaterials.length > 0) {
        const materialsToInsert = productMaterials
          .filter(m => m.material_id && m.quantity_required > 0)
          .map(m => ({
            product_id: product.id,
            material_id: m.material_id,
            quantity_required: m.quantity_required
          }));

        if (materialsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('product_materials')
            .insert(materialsToInsert);

          if (insertError) throw insertError;
        }
      }

      alert('Cập nhật sản phẩm thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Lỗi khi cập nhật sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setProductMaterials(prev => [...prev, { material_id: '', quantity_required: 0 }]);
  };

  const removeMaterial = (index: number) => {
    setProductMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: string | number) => {
    setProductMaterials(prev => prev.map((material, i) =>
      i === index ? { ...material, [field]: value } : material
    ));
  };

  const getUsedMaterialIds = () => {
    return productMaterials.map(m => m.material_id).filter(id => id);
  };

  if (!show || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Chỉnh Sửa Sản Phẩm</h3>
                <p className="text-blue-100 text-sm">
                  {product?.name ? `Đang chỉnh sửa: ${product.name}` : 'Cập nhật thông tin và công thức sản phẩm'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 font-medium"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  Đơn vị tính *
                </label>
                <input
                  type="text"
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  placeholder="VD: thùng, hộp, chai..."
                  className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 font-medium"
                  required
                />
              </div>
            </div>

            {/* Materials Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-800">
                  Công thức sản phẩm (BOM)
                </label>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm vật tư</span>
                </button>
              </div>

              <div className="space-y-4">
                {productMaterials.map((material, index) => {
                  const usedIds = getUsedMaterialIds();
                  const excludeIds = usedIds.filter((_, i) => i !== index);
                  
                  return (
                    <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                      <div className="flex-1">
                        <MaterialSelect
                          materials={materials}
                          value={material.material_id}
                          onChange={(value) => updateMaterial(index, 'material_id', value)}
                          placeholder="Chọn vật tư"
                          excludeIds={excludeIds}
                        />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={material.quantity_required}
                        onChange={(e) => updateMaterial(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                        placeholder="Số lượng/1 sản phẩm"
                        className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {productMaterials.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Chưa có vật tư nào trong công thức</p>
                    <p className="text-sm">Nhấn &quot;Thêm vật tư&quot; để bắt đầu</p>
                  </div>
                )}
              </div>

              {/* Cost Estimation */}
              {productMaterials.length > 0 && estimatedCost > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 p-6 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-6 h-6 text-blue-600" />
                      <span className="font-bold text-gray-800">Giá thành ước tính/sản phẩm:</span>
                    </div>
                    <span className="font-bold text-blue-600 text-xl">
                      {estimatedCost.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-8 py-6 bg-gray-50/80 border-t border-gray-200 flex justify-end space-x-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-300"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !productName.trim() || !productUnit.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}