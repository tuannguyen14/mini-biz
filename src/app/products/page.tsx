import ProductForm from './components/ProductForm';
import ProductStats from './components/ProductStats';
import ProductionCapacity from './components/ProductionCapacity';
import ProductList from './components/ProductList';
import RecentActivities from './components/RecentActivities';
import { fetchStats, fetchProducts, fetchMaterials, fetchRecentActivities, fetchProductPossibleQuantities } from './actions';

export default async function ProductManagementPage() {
  const [stats, products, materials, recentActivities, productPossibleQuantities] = await Promise.all([
    fetchStats(),
    fetchProducts(),
    fetchMaterials(),
    fetchRecentActivities(),
    fetchProductPossibleQuantities()
  ]);

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
      </div>
    </div>
  );
}