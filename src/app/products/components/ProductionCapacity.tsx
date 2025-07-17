import { Package, Factory, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ProductPossibleQuantity {
  product_id: string;
  product_name: string;
  product_unit: string;
  max_possible_quantity: number;
}

export default function ProductionCapacity({ 
  productPossibleQuantities 
}: { 
  productPossibleQuantities: ProductPossibleQuantity[] 
}) {
  const totalProducibleProducts = productPossibleQuantities.filter(p => p.max_possible_quantity > 0).length;
  const totalProducts = productPossibleQuantities.length;

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Khả Năng Sản Xuất</h2>
              <p className="text-blue-100 text-sm">Theo dõi khả năng sản xuất từ tồn kho</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <p className="text-white text-sm font-medium">
                {totalProducibleProducts}/{totalProducts} sản phẩm
              </p>
              <p className="text-blue-100 text-xs">có thể sản xuất</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {productPossibleQuantities.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border-2 border-green-100">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-800">{totalProducibleProducts}</p>
                    <p className="text-sm text-green-600 font-medium">Có thể sản xuất</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-2xl border-2 border-red-100">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-800">{totalProducts - totalProducibleProducts}</p>
                    <p className="text-sm text-red-600 font-medium">Không thể sản xuất</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100">
                <div className="flex items-center space-x-3">
                  <Info className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-800">{totalProducts}</p>
                    <p className="text-sm text-blue-600 font-medium">Tổng sản phẩm</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-3">
              {productPossibleQuantities.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.max_possible_quantity > 0 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{item.product_name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-xl">
                          Đơn vị: {item.product_unit}
                        </span>
                        {item.max_possible_quantity === 0 && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Thiếu vật tư</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-2">Có thể sản xuất</p>
                    <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-lg font-bold ${
                      item.max_possible_quantity > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.max_possible_quantity} {item.product_unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Production Tips */}
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-2xl border-2 border-amber-200">
              <div className="flex items-start space-x-3">
                <Info className="w-6 h-6 text-amber-600 mt-1" />
                <div>
                  <h4 className="font-bold text-amber-800 mb-2">Gợi ý sản xuất</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Khả năng sản xuất được tính dựa trên tồn kho vật tư hiện tại</li>
                    <li>• Nhập thêm vật tư để tăng khả năng sản xuất</li>
                    <li>• Kiểm tra công thức BOM nếu sản phẩm không thể sản xuất</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Factory className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-gray-500">
              <p className="text-xl font-bold mb-2">Chưa có sản phẩm nào</p>
              <p className="text-sm">Tạo sản phẩm để xem khả năng sản xuất</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}