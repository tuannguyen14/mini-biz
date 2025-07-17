import ProductForm from './components/ProductForm';
import ProductStats from './components/ProductStats';
import ProductionCapacity from './components/ProductionCapacity';
import ProductList from './components/ProductList';
import RecentActivities from './components/RecentActivities';
import MaterialShortageAlert from './components/MaterialShortageAlert';
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

function SkeletonCard() {
  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-pulse">
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl"></div>
          <div>
            <div className="h-6 bg-white/30 rounded w-32 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-48"></div>
          </div>
        </div>
      </div>
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
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
        <MaterialShortageAlert />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Modern Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent py-2">
              Quản Lý Sản Phẩm
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
              Tạo và quản lý sản phẩm với công thức sản xuất thông minh
            </p>
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center space-x-2 bg-white/80 px-6 py-3 rounded-2xl shadow-lg border border-white/50">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Hệ thống hoạt động ổn định</span>
              </div>
            </div>
          </div>

          <Suspense fallback={
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 animate-pulse">
                    <div className="w-12 h-12 bg-white/30 rounded-xl mb-4"></div>
                    <div className="h-4 bg-white/30 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-white/30 rounded w-16"></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonCard />
            </div>
          }>
            <ProductStats stats={stats} />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <ProductForm materials={materials} />
              <ProductionCapacity productPossibleQuantities={productPossibleQuantities} />
            </div>

            <ProductList 
              products={products} 
              productPossibleQuantities={productPossibleQuantities}
              materials={materials}
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
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/30">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-6">Không thể kết nối đến cơ sở dữ liệu</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
}