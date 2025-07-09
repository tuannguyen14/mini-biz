'use client';

import { useState } from 'react';
import { Package, FileText, Trash2, Eye, Box, AlertTriangle, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DeleteConfirmation from './DeleteConfirmation';
import ProductDetails from './ProductDetails';

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface ProductPossibleQuantity {
  product_id: string;
  product_name: string;
  product_unit: string;
  max_possible_quantity: number;
}

export default function ProductList({ 
  products, 
  productPossibleQuantities 
}: { 
  products: Product[]; 
  productPossibleQuantities: ProductPossibleQuantity[] 
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMaterials, setProductMaterials] = useState<any[]>([]);
  const [productCost, setProductCost] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    product: null as Product | null
  });

  const fetchProductMaterials = async (productId: string) => {
    const { data, error } = await supabase
      .from('product_materials')
      .select(`*, material:materials(*)`)
      .eq('product_id', productId);

    if (!error) {
      setProductMaterials(data || []);
    }
  };

  const calculateProductCost = async (productId: string) => {
    const { data, error } = await supabase
      .rpc('calculate_product_cost', { p_product_id: productId });

    if (!error) {
      setProductCost(data || 0);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Xóa công thức sản phẩm trước
      await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', productId);

      // Xóa sản phẩm
      await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      alert('Xóa sản phẩm thành công!');
      setDeleteConfirm({ show: false, product: null });
      
      // Nếu đang xem chi tiết sản phẩm vừa xóa thì đóng modal
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert('Lỗi khi xóa sản phẩm!');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden mb-8 hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Danh Sách Sản Phẩm</h2>
            <p className="text-purple-100 text-sm">Quản lý và theo dõi sản phẩm</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="overflow-hidden rounded-3xl border-2 border-gray-100 shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/80">
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Đơn vị</th>
                <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Khả năng sản xuất</th>
                <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const possibleQuantity = productPossibleQuantities.find(pq => pq.product_id === product.id);
                return (
                  <tr key={product.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-blue-50/70 transition-all duration-300 border-b border-gray-100`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-bold text-gray-900 text-lg">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-gray-100 text-gray-800">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold ${(possibleQuantity?.max_possible_quantity || 0) > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {possibleQuantity?.max_possible_quantity || 0}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            fetchProductMaterials(product.id);
                            calculateProductCost(product.id);
                          }}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, product })}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-gray-500">
                        <p className="text-xl font-bold mb-2">Chưa có sản phẩm nào</p>
                        <p className="text-sm">Hãy tạo sản phẩm đầu tiên để bắt đầu quản lý</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedProduct && (
          <ProductDetails 
            selectedProduct={selectedProduct} 
            productMaterials={productMaterials} 
            productCost={productCost} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </div>

      <DeleteConfirmation 
        show={deleteConfirm.show} 
        product={deleteConfirm.product} 
        onCancel={() => setDeleteConfirm({ show: false, product: null })} 
        onConfirm={handleDeleteProduct} 
      />
    </div>
  );
}