'use client';

import { useState, useEffect, useRef } from 'react';
import { Edit3, Save, X, Plus, Minus, Search, ChevronDown, Package, Calculator, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateProduct } from '../actions';

interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
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
  disabled?: boolean;
}

function MaterialSelect({ 
  materials, 
  value, 
  onChange, 
  placeholder = "Chọn vật tư", 
  excludeIds = [],
  disabled = false 
}: MaterialSelectProps) {
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
    if (!disabled) {
      onChange(materialId);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all duration-300 font-medium bg-white text-left flex items-center justify-between ${
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300'
        }`}
      >
        <span className={selectedMaterial ? "text-gray-800" : "text-gray-500"}>
          {selectedMaterial 
            ? `${selectedMaterial.name} (${selectedMaterial.unit}) - Tồn: ${selectedMaterial.current_stock}`
            : placeholder
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : 'text-gray-600'}`} />
      </button>

      {isOpen && !disabled && (
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
  const [error, setError] = useState('');
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (show && product) {
      setProductName(product.name);
      setProductUnit(product.unit);
      setError('');
      setEstimatedCost(0);
      fetchProductMaterials();
    } else if (!show) {
      // Reset form when modal closes
      setProductName('');
      setProductUnit('');
      setProductMaterials([]);
      setError('');
      setEstimatedCost(0);
    }
  }, [show, product]);

  // Calculate cost when materials change
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
      setError('Không thể tải thông tin công thức sản phẩm');
    }
  };

  const calculateEstimatedCost = async () => {
    setIsCalculatingCost(true);
    let totalCost = 0;

    try {
      for (const material of productMaterials) {
        if (material.material_id && material.quantity_required > 0) {
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
        }
      }

      setEstimatedCost(totalCost);
    } catch (error) {
      console.error('Error calculating estimated cost:', error);
    } finally {
      setIsCalculatingCost(false);
    }
  };

  const handleSave = async () => {
    // Reset error
    setError('');
    
    // Validation
    if (!productName.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!productUnit.trim()) {
      setError('Vui lòng nhập đơn vị tính');
      return;
    }

    if (!product) {
      setError('Không tìm thấy thông tin sản phẩm');
      return;
    }

    setLoading(true);

    try {
      // Update product basic info with duplicate validation
      const result = await updateProduct(product.id, {
        name: productName.trim(),
        unit: productUnit.trim()
      });

      if (!result.success) {
        setError(result.error || 'Không thể cập nhật sản phẩm');
        return;
      }

      // Update product materials (BOM)
      // First, delete existing materials
      const { error: deleteError } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', product.id);

      if (deleteError) throw deleteError;

      // Then, insert new materials if any
      const validMaterials = productMaterials.filter(m => 
        m.material_id && 
        m.quantity_required > 0
      );

      if (validMaterials.length > 0) {
        const materialsToInsert = validMaterials.map(m => ({
          product_id: product.id,
          material_id: m.material_id,
          quantity_required: m.quantity_required
        }));

        const { error: insertError } = await supabase
          .from('product_materials')
          .insert(materialsToInsert);

        if (insertError) throw insertError;
      }

      alert('Cập nhật sản phẩm thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Đã xảy ra lỗi khi cập nhật sản phẩm');
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

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;
      
      if (e.key === 'Escape' && !loading) {
        handleClose();
      } else if (e.key === 'Enter' && e.ctrlKey && !loading) {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, loading]);

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
                  Đang chỉnh sửa: <span className="font-medium">{product.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Có lỗi xảy ra</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (error) setError(''); // Clear error when user starts typing
                  }}
                  className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập tên sản phẩm"
                  disabled={loading}
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
                  onChange={(e) => {
                    setProductUnit(e.target.value);
                    if (error) setError(''); // Clear error when user starts typing
                  }}
                  placeholder="VD: thùng, hộp, chai..."
                  className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Materials Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-bold text-gray-800">
                    Công thức sản phẩm (BOM)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Định nghĩa vật tư cần thiết để sản xuất 1 đơn vị sản phẩm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMaterial}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
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
                          disabled={loading}
                        />
                      </div>
                      <div className="w-40">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={material.quantity_required || ''}
                          onChange={(e) => updateMaterial(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                          placeholder="Số lượng"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex-shrink-0"
                        title="Xóa vật tư"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {productMaterials.length === 0 && (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Chưa có vật tư nào trong công thức</p>
                    <p className="text-sm">Nhấn &quot;Thêm vật tư&quot; để bắt đầu thiết lập BOM</p>
                  </div>
                )}
              </div>

              {/* Cost Estimation */}
              {productMaterials.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 p-6 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-6 h-6 text-blue-600" />
                      <span className="font-bold text-gray-800">Giá thành ước tính/sản phẩm:</span>
                    </div>
                    <div className="text-right">
                      {isCalculatingCost ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-600 text-sm">Đang tính...</span>
                        </div>
                      ) : (
                        <span className="font-bold text-blue-600 text-xl">
                          {estimatedCost > 0 ? `${estimatedCost.toLocaleString('vi-VN')} VNĐ` : 'Chưa có dữ liệu'}
                        </span>
                      )}
                    </div>
                  </div>
                  {estimatedCost === 0 && !isCalculatingCost && productMaterials.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      * Cần có dữ liệu nhập kho để tính giá thành
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-8 py-6 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> để đóng • 
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-1">Ctrl+Enter</kbd> để lưu
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleClose}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}