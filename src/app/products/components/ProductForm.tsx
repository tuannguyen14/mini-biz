'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, CheckCircle, Calculator, Factory, Search, ChevronDown, Package, Sparkles } from 'lucide-react';
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
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 font-medium bg-white text-left flex items-center justify-between hover:border-emerald-300"
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
                placeholder="Tìm kiếm vật tư theo tên hoặc đơn vị..."
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 font-medium"
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
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{material.name}</span>
                      <span className="text-sm text-gray-500 mt-1">Đơn vị: {material.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-emerald-600 text-sm">
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
    let isMounted = true;
    
    const calculateCost = async () => {
      if (productForm.materials.length > 0) {
        const cost = await calculateFormProductCost();
        if (isMounted) {
          setProductCost(cost);
        }
      } else {
        if (isMounted) {
          setProductCost(0);
        }
      }
    };

    calculateCost();

    return () => {
      isMounted = false;
    };
  }, [productForm.materials]);

  const calculateFormProductCost = async (): Promise<number> => {
    let totalCost = 0;

    for (const material of productForm.materials) {
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

    return totalCost;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name.trim() || !productForm.unit.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

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
          name: productForm.name.trim(),
          unit: productForm.unit.trim()
        })
        .select()
        .single();

      if (productError) throw productError;

      if (productForm.materials.length > 0) {
        const productMaterialsData = productForm.materials
          .filter(material => material.material_id && material.quantity_required > 0)
          .map(material => ({
            product_id: newProduct.id,
            material_id: material.material_id,
            quantity_required: material.quantity_required
          }));

        if (productMaterialsData.length > 0) {
          const { error: materialsError } = await supabase
            .from('product_materials')
            .insert(productMaterialsData);

          if (materialsError) throw materialsError;
        }
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
      
      // Reload trang để cập nhật danh sách
      window.location.reload();
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

  const getUsedMaterialIds = () => {
    return productForm.materials.map(m => m.material_id).filter(id => id);
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tạo Sản Phẩm Mới</h2>
            <p className="text-emerald-100 text-sm">Thiết lập sản phẩm với công thức BOM</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-xl">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Smart BOM</span>
            </div>
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

          <div className="space-y-6">
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
              {productForm.materials.map((material, index) => {
                const usedIds = getUsedMaterialIds();
                const excludeIds = usedIds.filter((_, i) => i !== index);
                
                return (
                  <div key={index} className="flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300">
                    <div className="flex-1">
                      <MaterialSelect
                        materials={materials}
                        value={material.material_id}
                        onChange={(value) => updateProductMaterial(index, 'material_id', value)}
                        placeholder="Chọn vật tư"
                        excludeIds={excludeIds}
                      />
                    </div>
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
                );
              })}

              {productForm.materials.length === 0 && (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Chưa có vật tư nào trong công thức</p>
                  <p className="text-sm">Nhấn "Thêm vật tư" để bắt đầu thiết lập BOM</p>
                </div>
              )}
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
            disabled={loading || !productForm.name.trim() || !productForm.unit.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl hover:shadow-xl disabled:opacity-50 transition-all duration-300 font-bold text-lg hover:scale-[1.02] disabled:hover:scale-100"
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