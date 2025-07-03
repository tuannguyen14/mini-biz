'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Calculator,
  FileText,
  Box,
  Clock,
  TrendingUp,
  Archive,
  Layers,
  Activity,
  Calendar,
  Trash2,
  Factory
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface ProductMaterial {
  id: string;
  material_id: string;
  quantity_required: number;
  material: Material;
}

interface ProductFormData {
  name: string;
  unit: string;
  quantity: number; // Số lượng sản xuất ngay
  materials: { material_id: string; quantity_required: number }[];
  notes: string;
}

interface RecentActivity {
  id: string;
  type: 'product_creation';
  product_name: string;
  quantity?: number;
  created_at: string;
  notes?: string;
}

interface ProductPossibleQuantity {
  product_id: string;
  product_name: string;
  product_unit: string;
  max_possible_quantity: number;
}

export default function ProductManagementPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>([]);
  const [productPossibleQuantities, setProductPossibleQuantities] = useState<ProductPossibleQuantity[]>([]);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    unit: '',
    quantity: 0,
    materials: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [productCost, setProductCost] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalMaterials: 0,
    totalMaterialStock: 0,
    totalOrdersToday: 0
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    product: Product | null;
  }>({
    show: false,
    product: null
  });

  useEffect(() => {
    fetchMaterials();
    fetchProducts();
    fetchRecentActivities();
    fetchStats();
    fetchProductPossibleQuantities();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductMaterials(selectedProduct.id);
      calculateProductCost(selectedProduct.id);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (productForm.materials.length > 0) {
      calculateFormProductCost();
    } else {
      setProductCost(0);
    }
  }, [productForm.materials]);

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) {
      console.error('Lỗi khi lấy danh sách vật tư:', error);
    } else {
      setMaterials(data || []);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    } else {
      setProducts(data || []);
    }
  };

  const fetchProductMaterials = async (productId: string) => {
    const { data, error } = await supabase
      .from('product_materials')
      .select(`
        *,
        material:materials(*)
      `)
      .eq('product_id', productId);

    if (error) {
      console.error('Lỗi khi lấy công thức sản phẩm:', error);
    } else {
      setProductMaterials(data || []);
    }
  };

  const fetchProductPossibleQuantities = async () => {
    const { data, error } = await supabase
      .from('product_possible_quantity')
      .select('*')
      .order('product_name');

    if (error) {
      console.error('Lỗi khi lấy số lượng có thể sản xuất:', error);
    } else {
      setProductPossibleQuantities(data || []);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setLoading(true);

    try {
      // Xóa công thức sản phẩm trước
      const { error: materialsError } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', productId);

      if (materialsError) throw materialsError;

      // Xóa sản phẩm
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      alert('Xóa sản phẩm thành công!');

      // Đóng modal và refresh data
      setDeleteConfirm({ show: false, product: null });
      fetchProducts();
      fetchRecentActivities();
      fetchStats();
      fetchProductPossibleQuantities();

      // Nếu đang xem chi tiết sản phẩm vừa xóa thì đóng modal
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert('Lỗi khi xóa sản phẩm!');
    } finally {
      setLoading(false);
    }
  };


  const calculateProductCost = async (productId: string) => {
    const { data, error } = await supabase
      .rpc('calculate_product_cost', { p_product_id: productId });

    if (error) {
      console.error('Lỗi khi tính giá thành:', error);
    } else {
      setProductCost(data || 0);
    }
  };

  const calculateFormProductCost = async () => {
    let totalCost = 0;

    for (const material of productForm.materials) {
      if (material.material_id && material.quantity_required > 0) {
        // Tính giá trung bình vật tư
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

  const fetchRecentActivities = async () => {
    try {
      // Lấy sản phẩm được tạo gần đây
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (productsError) throw productsError;

      const activities: RecentActivity[] = (productsData || []).map(item => ({
        id: item.id,
        type: 'product_creation' as const,
        product_name: item.name,
        created_at: item.created_at
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Lỗi khi lấy hoạt động gần đây:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Sử dụng view system_overview
      const { data: overview, error: overviewError } = await supabase
        .from('system_overview')
        .select('*')
        .single();

      if (overviewError) throw overviewError;

      // Đơn hàng hôm nay
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .gte('order_date', `${today}T00:00:00`)
        .lt('order_date', `${today}T23:59:59`);

      if (ordersError) throw ordersError;

      setStats({
        totalProducts: overview?.total_products || 0,
        totalMaterials: overview?.total_materials || 0,
        totalMaterialStock: overview?.total_material_stock || 0,
        totalOrdersToday: (todayOrders || []).length
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Kiểm tra vật tư nếu có số lượng sản xuất
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

      // Tạo sản phẩm mới
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          unit: productForm.unit
        })
        .select()
        .single();

      if (productError) throw productError;

      // Thêm công thức sản phẩm
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

      // Reset form
      setProductForm({
        name: '',
        unit: '',
        quantity: 0,
        materials: [],
        notes: ''
      });
      setProductCost(0);

      // Refresh data
      fetchProducts();
      fetchRecentActivities();
      fetchStats();
      fetchProductPossibleQuantities();
      fetchMaterials();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent py-2">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Tạo và quản lý sản phẩm với công thức sản xuất thông minh
          </p>
        </div>

    

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Package className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Tổng sản phẩm</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Box className="w-6 h-6" />
              </div>
              <Archive className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Vật tư khả dụng</p>
              <p className="text-3xl font-bold">{stats.totalMaterials}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Layers className="w-6 h-6" />
              </div>
              <Activity className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Tồn kho vật tư</p>
              <p className="text-3xl font-bold">{stats.totalMaterialStock}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/25 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <Clock className="w-5 h-5 text-orange-200" />
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Đơn hàng hôm nay</p>
              <p className="text-3xl font-bold">{stats.totalOrdersToday}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Enhanced Create Product Section */}
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

          {/* Product Production Capacity */}
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
        </div>

        {/* Enhanced Product List */}
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
                              onClick={() => setSelectedProduct(product)}
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

            {/* Product Details Modal */}
            {selectedProduct && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50/80 p-6 rounded-3xl border-2 border-blue-200 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-800 text-xl flex items-center space-x-3">
                    <Box className="w-6 h-6 text-blue-600" />
                    <span>Công thức: {selectedProduct.name}</span>
                  </h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
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
            )}
          </div>
        </div>

        {/* Real Recent Activities Section */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Hoạt Động Gần Đây</h2>
                  <p className="text-orange-100 text-sm">Theo dõi lịch sử tạo sản phẩm</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Cập nhật realtime</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-3xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Plus className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          Tạo sản phẩm {activity.product_name}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          {activity.quantity && (
                            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-xl">
                              SL: {activity.quantity}
                            </span>
                          )}
                          {activity.notes && (
                            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-xl max-w-xs truncate">
                              {activity.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 font-medium">{formatDate(activity.created_at)}</p>
                      <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold mt-2 bg-blue-100 text-blue-800">
                        Tạo mới
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="text-gray-500">
                    <p className="text-xl font-bold mb-2">Chưa có hoạt động nào</p>
                    <p className="text-sm">Các hoạt động gần đây sẽ hiển thị tại đây</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Xác nhận xóa sản phẩm</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-800 font-medium mb-2">
                  Bạn có chắc chắn muốn xóa sản phẩm:
                </p>
                <p className="text-xl font-bold text-red-600">
                  {deleteConfirm.product?.name}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Hành động này không thể hoàn tác và sẽ xóa cả công thức sản phẩm.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, product: null })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-2xl font-medium transition-all duration-300"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteConfirm.product && handleDeleteProduct(deleteConfirm.product.id)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-2xl font-medium transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}