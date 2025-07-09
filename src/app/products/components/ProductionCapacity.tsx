import { Package, Factory } from 'lucide-react';

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
  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Khả Năng Sản Xuất</h2>
            <p className="text-blue-100 text-sm">Theo dõi khả năng sản xuất từ tồn kho</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="space-y-6">
          {productPossibleQuantities.length > 0 ? (
            productPossibleQuantities.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-3xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">Đơn vị: {item.product_unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Có thể sản xuất</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-lg font-bold ${item.max_possible_quantity > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {item.max_possible_quantity} {item.product_unit}
                  </span>
                </div>
              </div>
            ))
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
    </div>
  );
}