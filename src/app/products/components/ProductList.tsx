'use client';

import { useState } from 'react';
import { Package, FileText, Trash2, Eye, Edit3, CheckCircle, Search, X, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteProduct } from '../actions';
import DeleteConfirmation from './DeleteConfirmation';
import ProductDetails from './ProductDetails';
import EditProductModal from './EditProductModal';

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface ProductPossibleQuantity {
  product_id: string;
  product_name: string;
  product_unit: string;
  max_possible_quantity: number;
}

export default function ProductList({
  products,
  productPossibleQuantities,
  materials = []
}: {
  products: Product[];
  productPossibleQuantities: ProductPossibleQuantity[];
  materials?: Material[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMaterials, setProductMaterials] = useState<any[]>([]);
  const [productCost, setProductCost] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    product: null as Product | null
  });
  const [editModal, setEditModal] = useState({
    show: false,
    product: null as Product | null
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'canProduce' | 'cannotProduce'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Function để loại bỏ dấu tiếng Việt
  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Function để highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    let highlightedText = text;
    
    searchWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
      );
    });
    
    return highlightedText;
  };

  // Filter products based on search term and filter type - IMPROVED VERSION
  const filteredProducts = products.filter(product => {
    // Production capability filter
    const possibleQuantity = productPossibleQuantities.find(pq => pq.product_id === product.id);
    const canProduce = (possibleQuantity?.max_possible_quantity || 0) > 0;

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'canProduce' && canProduce) ||
      (filterType === 'cannotProduce' && !canProduce);

    if (!searchTerm.trim()) {
      return matchesFilter;
    }

    // Cải thiện search: tách từ khóa và tìm tất cả các từ
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    const combinedText = `${product.name} ${product.unit}`.toLowerCase();
    const normalizedText = removeVietnameseTones(combinedText);
    
    // Tất cả các từ trong search phải có trong text (không cần theo thứ tự)
    const matchesSearch = searchWords.every(word => {
      const normalizedWord = removeVietnameseTones(word);
      // Tìm cả trong text gốc và text đã loại bỏ dấu
      return combinedText.includes(word) || normalizedText.includes(normalizedWord);
    });

    return matchesSearch && matchesFilter;
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
      const result = await deleteProduct(productId);

      if (result.success) {
        alert('Xóa sản phẩm thành công!');
        setDeleteConfirm({ show: false, product: null });

        // Nếu đang xem chi tiết sản phẩm vừa xóa thì đóng modal
        if (selectedProduct?.id === productId) {
          setSelectedProduct(null);
        }

        // Reload trang để cập nhật danh sách
        window.location.reload();
      } else {
        alert(result.error || 'Lỗi khi xóa sản phẩm!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert('Lỗi khi xóa sản phẩm!');
    }
  };

  const handleEditSuccess = () => {
    // Reload trang để cập nhật danh sách
    window.location.reload();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getFilterStats = () => {
    const canProduce = products.filter(product => {
      const possibleQuantity = productPossibleQuantities.find(pq => pq.product_id === product.id);
      return (possibleQuantity?.max_possible_quantity || 0) > 0;
    }).length;

    return {
      total: products.length,
      canProduce,
      cannotProduce: products.length - canProduce
    };
  };

  const stats = getFilterStats();

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden mb-8 hover:shadow-3xl transition-all duration-500">
      <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Danh Sách Sản Phẩm</h2>
              <p className="text-purple-100 text-sm">Quản lý và theo dõi sản phẩm</p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-3">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all duration-300 ${showFilters || filterType !== 'all'
                ? 'bg-white/30 text-white'
                : 'bg-white/20 text-white/70 hover:bg-white/30'
                }`}
              title="Bộ lọc"
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm... (VD: cao tròn)"
                className="w-64 pl-10 pr-10 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-white/90 text-sm font-medium">Lọc theo khả năng sản xuất:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${filterType === 'all'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    Tất cả ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilterType('canProduce')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${filterType === 'canProduce'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    Có thể SX ({stats.canProduce})
                  </button>
                  <button
                    onClick={() => setFilterType('cannotProduce')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${filterType === 'cannotProduce'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    Không thể SX ({stats.cannotProduce})
                  </button>
                </div>
              </div>

              {(searchTerm || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="text-white/70 hover:text-white text-xs underline transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Search Results Info */}
        {(searchTerm || filterType !== 'all') && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Tìm thấy {filteredProducts.length} sản phẩm
                  {searchTerm && ` cho "${searchTerm}"`}
                  {filterType !== 'all' && ` (${filterType === 'canProduce' ? 'Có thể sản xuất' : 'Không thể sản xuất'})`}
                </span>
              </div>
              {filteredProducts.length === 0 && (
                <span className="text-xs text-blue-600">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </span>
              )}
            </div>
          </div>
        )}

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
              {filteredProducts.map((product, index) => {
                const possibleQuantity = productPossibleQuantities.find(pq => pq.product_id === product.id);
                return (
                  <tr key={product.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-blue-50/70 transition-all duration-300 border-b border-gray-100`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">
                            {/* Highlight search term */}
                            {searchTerm ? (
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(product.name, searchTerm)
                              }} />
                            ) : (
                              product.name
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-gray-100 text-gray-800">
                        {searchTerm ? (
                          <span dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(product.unit, searchTerm)
                          }} />
                        ) : (
                          product.unit
                        )}
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
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            fetchProductMaterials(product.id);
                            calculateProductCost(product.id);
                          }}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem</span>
                        </button>

                        <button
                          onClick={() => setEditModal({ show: true, product })}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirm({ show: true, product })}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && products.length > 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-gray-500">
                        <p className="text-xl font-bold mb-2">Không tìm thấy sản phẩm nào</p>
                        <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
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

        {/* Quick Actions */}
        {products.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100/80 p-6 rounded-3xl border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Thống kê nhanh</h3>
                <p className="text-gray-600 text-sm">Tổng quan về sản phẩm trong hệ thống</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 border border-gray-200">
                  <Package className="w-4 h-4 mr-2" />
                  {filteredProducts.length}/{products.length} sản phẩm
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-green-100 rounded-xl text-sm font-medium text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {productPossibleQuantities.filter(p => p.max_possible_quantity > 0).length} có thể sản xuất
                </span>
              </div>
            </div>
          </div>
        )}

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

      <EditProductModal
        show={editModal.show}
        product={editModal.product}
        materials={materials}
        onClose={() => setEditModal({ show: false, product: null })}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}