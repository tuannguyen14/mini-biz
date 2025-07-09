import { Box, AlertTriangle, Calculator } from 'lucide-react';

interface ProductDetailsProps {
  selectedProduct: {
    id: string;
    name: string;
  };
  productMaterials: Array<{
    id: string;
    quantity_required: number;
    material: {
      name: string;
      unit: string;
      current_stock: number;
    };
  }>;
  productCost: number;
  onClose: () => void;
}

export default function ProductDetails({ 
  selectedProduct, 
  productMaterials, 
  productCost, 
  onClose 
}: ProductDetailsProps) {
  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50/80 p-6 rounded-3xl border-2 border-blue-200 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 text-xl flex items-center space-x-3">
          <Box className="w-6 h-6 text-blue-600" />
          <span>Công thức: {selectedProduct.name}</span>
        </h3>
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl transition-all duration-300"
        >
          Đóng
        </button>
      </div>

      {productMaterials.length > 0 ? (
        <div className="space-y-4">
          {productMaterials.map(pm => (
            <div key={pm.id} className="flex justify-between items-center py-3 px-5 bg-white/80 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300">
              <span className="font-semibold text-gray-800">{pm.material.name}</span>
              <div className="text-right">
                <span className="font-bold text-gray-900 text-lg">
                  {pm.quantity_required} {pm.material.unit}
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  Tồn kho: {pm.material.current_stock}
                </div>
              </div>
            </div>
          ))}
          <div className="border-t-2 border-blue-300 pt-5 flex items-center justify-between bg-white/80 rounded-2xl p-5 border border-blue-200">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-800 text-lg">Giá thành/đơn vị:</span>
            </div>
            <span className="font-bold text-blue-600 text-xl">
              {productCost.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Chưa có công thức cho sản phẩm này</p>
          <p className="text-gray-500 text-sm mt-1">Vui lòng thiết lập công thức sản xuất</p>
        </div>
      )}
    </div>
  );
}