import ProductForm from './components/ProductForm';
import ProductStats from './components/ProductStats';
import ProductionCapacity from './components/ProductionCapacity';
import ProductList from './components/ProductList';
import RecentActivities from './components/RecentActivities';
import { fetchStats, fetchProducts, fetchMaterials, fetchRecentActivities, fetchProductPossibleQuantities } from './actions';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-lg font-medium text-gray-700">Đang tải dữ liệu...</span>
      </div>
    </div>
  );
}

export default async function ProductManagementPage() {
  try {
    const [stats, products, materials, recentActivities, productPossibleQuantities] = await Promise.all([
      fetchStats(),
      fetchProducts(),
      fetchMaterials(),
      fetchRecentActivities(),
      fetchProductPossibleQuantities()
    ]);

    // Debug logging for production
    console.log('Page data loaded:', {
      statsCount: stats ? Object.keys(stats).length : 0,
      productsCount: products?.length || 0,
      materialsCount: materials?.length || 0,
      recentActivitiesCount: recentActivities?.length || 0,
      productPossibleQuantitiesCount: productPossibleQuantities?.length || 0
    });

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

          <Suspense fallback={<LoadingSpinner />}>
            <ProductStats stats={stats} />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <ProductForm materials={materials} />
              <ProductionCapacity productPossibleQuantities={productPossibleQuantities} />
            </div>

            <ProductList 
              products={products} 
              productPossibleQuantities={productPossibleQuantities} 
            />

            <RecentActivities recentActivities={recentActivities.map(activity => ({
              ...activity,
              type: "product_creation" as const
            }))} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ProductManagementPage:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }
}