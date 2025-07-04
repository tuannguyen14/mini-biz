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
  Package,
  ShoppingCart,
  X,
  Crown,
  Zap,
  CalendarDays,
  ChevronDown
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

// Date filter options
const DATE_FILTERS = [
  { key: 'today', label: 'Hôm nay', value: 0 },
  { key: 'yesterday', label: 'Hôm qua', value: 1 },
  { key: 'last7days', label: '7 ngày qua', value: 7 },
  { key: 'last30days', label: '30 ngày qua', value: 30 },
  { key: 'thisMonth', label: 'Tháng này', value: 'thisMonth' },
  { key: 'lastMonth', label: 'Tháng trước', value: 'lastMonth' },
  { key: 'custom', label: 'Tùy chỉnh', value: 'custom' }
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Date filter states
  const [selectedDateFilter, setSelectedDateFilter] = useState('last30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

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
  };
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  
  type LowStockItem = {
    id: string;
    name: string;
    current_stock: number;
    unit?: string;
    type: 'material' | 'product';
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

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedDateFilter) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: today.toISOString()
        };
      case 'last7days':
        return {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'last30days':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: thisMonthStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: lastMonthStart.toISOString(),
          endDate: lastMonthEnd.toISOString()
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate).toISOString(),
            endDate: new Date(new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
        }
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      default:
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  // Fetch filtered data
  const fetchFilteredData = async () => {
    try {
      const dateRange = getDateRange();
      
      // Fetch orders within date range
      const { data: filteredOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .gte('created_at', dateRange.startDate)
        .lt('created_at', dateRange.endDate)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate filtered stats
      const completedOrders = filteredOrders?.filter(order => order.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalProfit = completedOrders.reduce((sum, order) => sum + (order.profit || 0), 0);
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

      // Get unique customers from filtered orders
      const uniqueCustomers = new Set(filteredOrders?.map(order => order.customer_id));

      setStats(prev => ({
        ...prev,
        totalOrders: filteredOrders?.length || 0,
        totalRevenue,
        totalProfit,
        profitMargin,
        totalCustomers: uniqueCustomers.size
      }));

      // Set recent orders (limited to 5)
      setRecentOrders(filteredOrders?.slice(0, 5) || []);

      // Fetch top customers for the period
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          orders!inner(*)
        `)
        .gte('orders.created_at', dateRange.startDate)
        .lt('orders.created_at', dateRange.endDate)
        .order('total_revenue', { ascending: false })
        .limit(5);

      if (customersError) throw customersError;
      setTopCustomers(customers || []);

    } catch (error) {
      console.error('Error fetching filtered data:', error);
    }
  };

  // Fetch all data (including non-filtered data like low stock)
  const fetchData = async () => {
    try {
      // Always fetch overall debt and low stock (not date filtered)
      const { data: overview, error: overviewError } = await supabase
        .from('system_overview')
        .select('total_debt')
        .single();

      if (overviewError) throw overviewError;

      setStats(prev => ({
        ...prev,
        totalDebt: overview.total_debt
      }));

      // Fetch low stock items (materials)
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .lt('current_stock', 100)
        .order('current_stock', { ascending: true })
        .limit(5);

      if (materialsError) throw materialsError;

      const allLowStock = [
        ...(materials || []).map(item => ({ ...item, type: 'material' as const }))
      ].sort((a, b) => a.current_stock - b.current_stock).slice(0, 5);

      setLowStockItems(allLowStock);

      // Fetch filtered data
      await fetchFilteredData();

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDateFilter, customStartDate, customEndDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDateFilterChange = (filterKey: string) => {
    setSelectedDateFilter(filterKey);
    setShowDateFilter(false);
    if (filterKey === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const getCurrentFilterLabel = () => {
    const filter = DATE_FILTERS.find(f => f.key === selectedDateFilter);
    if (selectedDateFilter === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString('vi-VN')} - ${new Date(customEndDate).toLocaleDateString('vi-VN')}`;
    }
    return filter?.label || 'Tùy chọn';
  };

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      description: getCurrentFilterLabel(),
      icon: DollarSign,
      isPositive: true,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Lợi nhuận',
      value: formatCurrency(stats.totalProfit),
      description: `Biên lợi nhuận: ${stats.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
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
      isPositive: false,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Đơn hàng',
      value: stats.totalOrders.toLocaleString('vi-VN'),
      description: getCurrentFilterLabel(),
      icon: ShoppingCart,
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
              
              {/* Date Filter Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 min-w-[160px]"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span className="flex-1 text-left truncate">{getCurrentFilterLabel()}</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                
                {showDateFilter && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    {DATE_FILTERS.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => handleDateFilterChange(filter.key)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 ${
                          selectedDateFilter === filter.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowCustomDatePicker(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
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
                      <p className="text-sm text-gray-600">{recentOrders.length} đơn hàng trong khoảng thời gian</p>
                    </div>
                  </div>
                  {/* <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    Xem tất cả
                  </button> */}
                </div>
              </div>
             
              <div className="p-6">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Không có đơn hàng nào trong khoảng thời gian này</p>
                  </div>
                ) : (
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
                              order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                              order.status === 'partial_paid' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'completed' ? 'Hoàn thành' : 
                               order.status === 'pending' ? 'Chưa thanh toán' : 
                               order.status === 'partial_paid' ? 'Thanh toán 1 phần' : 'Đã hủy'}
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
                )}
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
                    <p className="text-sm text-gray-600">Top khách hàng theo doanh thu</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {topCustomers.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-sm">Không có dữ liệu khách hàng</p>
                  </div>
                ) : (
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
                )}
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
                  {lowStockItems.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 text-sm">Tồn kho ổn định</p>
                    </div>
                  ) : (
                    lowStockItems.map((item, index) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}