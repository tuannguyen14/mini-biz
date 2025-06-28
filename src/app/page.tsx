"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreVertical,
  RefreshCw,
  Calendar,
  Package,
  ShoppingCart,
  Eye,
  Printer,
  X,
  Star,
  Crown,
  Zap
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalDebt: 0,
    profitMargin: 0
  });
  type RecentOrder = {
    id: string;
    created_at: string;
    total_amount: number;
    profit: number;
    status: string;
    customer?: {
      name?: string;
      phone?: string;
    };
    // Add other fields if needed
  };
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  type LowStockItem = {
    id: string;
    name: string;
    current_stock: number;
    unit?: string;
    type: 'material' | 'product';
    // Add other fields if needed
  };
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Format currency VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Format relative time
  const formatRelativeTime = (date: string | number | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      // Fetch system overview
      const { data: overview, error: overviewError } = await supabase
        .from('system_overview')
        .select('*')
        .single();

      if (overviewError) throw overviewError;

      // Calculate profit margin
      const profitMargin = overview.total_revenue > 0 
        ? (overview.total_profit / overview.total_revenue * 100).toFixed(1)
        : 0;

      setStats({
        totalCustomers: overview.total_customers,
        totalOrders: overview.total_orders,
        totalRevenue: overview.total_revenue,
        totalProfit: overview.total_profit,
        totalDebt: overview.total_debt,
        profitMargin:  overview.profitMargin
      });

      // Fetch recent orders with customer info
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;
      setRecentOrders(orders || []);

      // Fetch top customers
      const { data: customers, error: customersError } = await supabase
        .from('customer_debt_details')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(5);

      if (customersError) throw customersError;
      setTopCustomers(customers || []);

      // Fetch low stock items (materials)
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .lt('current_stock', 100) // Threshold for low stock
        .order('current_stock', { ascending: true })
        .limit(5);

      if (materialsError) throw materialsError;

      // Fetch low stock products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .lt('current_stock', 50) // Threshold for low stock
        .order('current_stock', { ascending: true })
        .limit(5);

      if (productsError) throw productsError;

      const allLowStock = [
        ...(materials || []).map(item => ({ ...item, type: 'material' })),
        ...(products || []).map(item => ({ ...item, type: 'product' }))
      ].sort((a, b) => a.current_stock - b.current_stock).slice(0, 5);

      setLowStockItems(allLowStock);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      description: 'Tổng doanh thu từ đầu',
      icon: DollarSign,
      // trend: '+12.5%',
      isPositive: true,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Lợi nhuận',
      value: formatCurrency(stats.totalProfit),
      description: `Biên lợi nhuận: ${stats.profitMargin}%`,
      icon: TrendingUp,
      // trend: '+18.2%',
      isPositive: true,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Công nợ',
      value: formatCurrency(stats.totalDebt),
      description: 'Tổng công nợ phải thu',
      icon: AlertTriangle,
      // trend: '-5.4%',
      isPositive: false,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Khách hàng',
      value: stats.totalCustomers.toLocaleString('vi-VN'),
      description: 'Tổng số khách hàng',
      icon: Users,
      // trend: '+3.2%',
      isPositive: true,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tải dữ liệu</h3>
            <p className="text-gray-600">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header with glass morphism */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Tổng quan hoạt động kinh doanh
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800">
                <Calendar className="w-4 h-4 mr-2" />
                Hôm nay
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300" 
                   style={{backgroundImage: `linear-gradient(135deg, ${stat.gradient.split(' ')[1]}, ${stat.gradient.split(' ')[3]})`}}></div>
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
                    stat.isPositive 
                      ? 'text-emerald-700 bg-emerald-100' 
                      : 'text-red-700 bg-red-100'
                  }`}>
                    {/* {stat.trend} */}
                    {stat.isPositive ? 
                      <ArrowUpRight className="w-3 h-3 ml-1" /> : 
                      <ArrowDownRight className="w-3 h-3 ml-1" />
                    }
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders - Enhanced */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
                      <p className="text-sm text-gray-600">{recentOrders.length} đơn hàng mới nhất</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    Xem tất cả
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <div key={order.id} className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                            {order.customer?.name?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.customer?.name || 'Khách hàng'}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatRelativeTime(order.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                            <p className="text-sm text-emerald-600 font-medium">
                              +{formatCurrency(order.profit)}
                            </p>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                            order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'completed' ? 'Hoàn thành' : 
                             order.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
                          </div>
                          
                          <div className="relative">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Top Customers - Enhanced */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Khách hàng VIP</h2>
                    <p className="text-sm text-gray-600">Top 5 khách hàng theo doanh thu</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                          'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {customer.total_orders} đơn hàng
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-900">
                          {formatCurrency(customer.total_revenue)}
                        </p>
                        {customer.outstanding_debt > 0 && (
                          <p className="text-xs text-red-600 font-medium">
                            Nợ: {formatCurrency(customer.outstanding_debt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Low Stock Alert - Enhanced */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">Cảnh báo tồn kho</h3>
                    <p className="text-sm text-red-700">Các mặt hàng sắp hết</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'material' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <Package className={`w-4 h-4 ${
                            item.type === 'material' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'material' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'material' ? 'Vật tư' : 'Sản phẩm'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-sm">
                          {item.current_stock} {item.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}