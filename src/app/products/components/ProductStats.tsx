import { Package, Box, Layers, Calendar, TrendingUp, Archive, Activity, Clock } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalMaterials: number;
  totalMaterialStock: number;
  totalOrdersToday: number;
}

export default function ProductStats({ stats }: { stats: Stats }) {
  return (
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
  );
}