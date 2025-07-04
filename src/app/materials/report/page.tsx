"use client";

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Package, Users, DollarSign, Eye, Download, Filter, Search, RefreshCw, Box } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from "@/lib/supabase";

interface MaterialSaleDetail {
    id: string;
    material_name: string;
    material_unit: string;
    order_id: string;
    order_date: string;
    customer_name: string;
    customer_phone: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit_cost: number;
    total_cost: number;
    profit: number;
    order_status: string;
    current_stock: number;
}

interface MaterialSummary {
    material_id: string;
    material_name: string;
    material_unit: string;
    total_quantity_sold: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
    total_orders: number;
    unique_customers: number;
    current_stock: number;
    avg_unit_price: number;
    avg_cost_price: number;
}

interface MaterialStockInfo {
    material_id: string;
    material_name: string;
    material_unit: string;
    current_stock: number;
    total_imported: number;
    total_sold: number;
    total_import_cost: number;
    avg_import_price: number;
    stock_value: number;
}

const MaterialSalesReport = () => {
    const [materialDetails, setMaterialDetails] = useState<MaterialSaleDetail[]>([]);
    const [materialSummaries, setMaterialSummaries] = useState<MaterialSummary[]>([]);
    const [materialStockInfo, setMaterialStockInfo] = useState<MaterialStockInfo[]>([]);
    const [materialsList, setMaterialsList] = useState<{ id: string, name: string, unit: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'summary' | 'details' | 'stock'>('summary');

    const fetchMaterialsList = async () => {
        try {
            const { data, error } = await supabase
                .from('materials')
                .select('id, name, unit')
                .order('name');

            if (error) throw error;
            setMaterialsList(data || []);
        } catch (error) {
            console.error('Error fetching materials list:', error);
        }
    };

    const fetchMaterialStockInfo = async () => {
        try {
            // Lấy thông tin tồn kho và nhập kho
            const { data: stockData, error: stockError } = await supabase
                .from('materials')
                .select(`
                    id,
                    name,
                    unit,
                    current_stock,
                    material_imports(
                        quantity,
                        unit_price,
                        total_amount,
                        import_date
                    )
                `);

            if (stockError) throw stockError;

            // Lấy thông tin bán hàng
            const { data: salesData, error: salesError } = await supabase
                .from('order_items')
                .select(`
                    material_id,
                    quantity,
                    unit_price,
                    total_price,
                    materials(
                        name,
                        unit
                    )
                `)
                .eq('item_type', 'material')
                .not('material_id', 'is', null);

            if (salesError) throw salesError;

            const stockInfo: MaterialStockInfo[] = (stockData || []).map(material => {
                const imports = material.material_imports || [];
                const sales = (salesData || []).filter(sale => sale.material_id === material.id);

                const totalImported = imports.reduce((sum, imp) => sum + parseFloat(imp.quantity || 0), 0);
                const totalSold = sales.reduce((sum, sale) => sum + parseFloat(sale.quantity || 0), 0);
                const totalImportCost = imports.reduce((sum, imp) => sum + parseFloat(imp.total_amount || 0), 0);
                const avgImportPrice = totalImported > 0 ? totalImportCost / totalImported : 0;

                return {
                    material_id: material.id,
                    material_name: material.name,
                    material_unit: material.unit,
                    current_stock: parseFloat(material.current_stock || 0),
                    total_imported: totalImported,
                    total_sold: totalSold,
                    total_import_cost: totalImportCost,
                    avg_import_price: avgImportPrice,
                    stock_value: parseFloat(material.current_stock || 0) * avgImportPrice
                };
            });

            setMaterialStockInfo(stockInfo);
        } catch (error) {
            console.error('Error fetching material stock info:', error);
        }
    };

    const fetchMaterialSalesData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch detailed sales data
            const { data: detailsData, error: detailsError } = await supabase
                .from('order_items')
                .select(`
                    id,
                    quantity,
                    unit_price,
                    total_price,
                    unit_cost,
                    total_cost,
                    profit,
                    material_id,
                    order_id,
                    materials(
                        id,
                        name,
                        unit,
                        current_stock
                    ),
                    orders(
                        id,
                        order_date,
                        status,
                        customers(
                            id,
                            name,
                            phone
                        )
                    )
                `)
                .eq('item_type', 'material')
                .not('material_id', 'is', null);

            if (detailsError) {
                console.error('Supabase error:', detailsError);
                throw detailsError;
            }

            if (!detailsData) {
                setMaterialDetails([]);
                setMaterialSummaries([]);
                return;
            }

            // Filter by date range and selected material
            const filteredData = detailsData.filter((item: any) => {
                const orderDate = new Date(item.orders?.order_date);
                const startDate = new Date(dateRange.startDate);
                const endDate = new Date(dateRange.endDate + 'T23:59:59');

                const isInDateRange = orderDate >= startDate && orderDate <= endDate;
                const isSelectedMaterial = selectedMaterial === 'all' || item.material_id === selectedMaterial;

                return isInDateRange && isSelectedMaterial && item.materials && item.orders?.customers;
            });

            const formattedDetails: MaterialSaleDetail[] = filteredData.map((item: any) => ({
                id: item.id,
                material_name: item.materials?.name || 'N/A',
                material_unit: item.materials?.unit || '',
                order_id: item.orders?.id || '',
                order_date: item.orders?.order_date || '',
                customer_name: item.orders?.customers?.name || 'N/A',
                customer_phone: item.orders?.customers?.phone || '',
                quantity: parseFloat(item.quantity || 0),
                unit_price: parseFloat(item.unit_price || 0),
                total_price: parseFloat(item.total_price || 0),
                unit_cost: parseFloat(item.unit_cost || 0),
                total_cost: parseFloat(item.total_cost || 0),
                profit: parseFloat(item.profit || 0),
                order_status: item.orders?.status || 'pending',
                current_stock: parseFloat(item.materials?.current_stock || 0)
            }));

            setMaterialDetails(formattedDetails);

            // Calculate summaries
            const summaries = calculateMaterialSummaries(formattedDetails);
            setMaterialSummaries(summaries);

        } catch (error: any) {
            console.error('Error fetching material sales data:', error);
            setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
            setMaterialDetails([]);
            setMaterialSummaries([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateMaterialSummaries = (details: MaterialSaleDetail[]): MaterialSummary[] => {
        const summaryMap = new Map<string, MaterialSummary>();

        details.forEach(detail => {
            const key = detail.material_name;

            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    material_id: key,
                    material_name: detail.material_name,
                    material_unit: detail.material_unit,
                    total_quantity_sold: 0,
                    total_revenue: 0,
                    total_cost: 0,
                    total_profit: 0,
                    profit_margin: 0,
                    total_orders: 0,
                    unique_customers: 0,
                    current_stock: detail.current_stock,
                    avg_unit_price: 0,
                    avg_cost_price: 0
                });
            }

            const summary = summaryMap.get(key)!;
            summary.total_quantity_sold += detail.quantity;
            summary.total_revenue += detail.total_price;
            summary.total_cost += detail.total_cost;
            summary.total_profit += detail.profit;
        });

        // Calculate additional metrics
        summaryMap.forEach((summary, key) => {
            const materialDetails = details.filter(d => d.material_name === key);
            summary.total_orders = new Set(materialDetails.map(d => d.order_id)).size;
            summary.unique_customers = new Set(materialDetails.map(d => d.customer_name)).size;
            summary.profit_margin = summary.total_revenue > 0 ? (summary.total_profit / summary.total_revenue) * 100 : 0;
            summary.avg_unit_price = summary.total_quantity_sold > 0 ? summary.total_revenue / summary.total_quantity_sold : 0;
            summary.avg_cost_price = summary.total_quantity_sold > 0 ? summary.total_cost / summary.total_quantity_sold : 0;
        });

        return Array.from(summaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    };

    const filteredDetails = materialDetails.filter(detail =>
        detail.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSummaries = materialSummaries.filter(summary =>
        summary.material_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStockInfo = materialStockInfo.filter(stock =>
        stock.material_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchMaterialsList();
    }, []);

    useEffect(() => {
        fetchMaterialSalesData();
        fetchMaterialStockInfo();
    }, [dateRange, selectedMaterial]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    };

    const exportToCSV = () => {
        let data: any[] = [];
        let headers: string[] = [];

        if (viewMode === 'summary') {
            data = filteredSummaries;
            headers = ['Vật tư', 'Đơn vị', 'Số lượng bán', 'Doanh thu', 'Chi phí', 'Lợi nhuận', 'Tỷ suất LN (%)', 'Tồn kho', 'Đơn hàng', 'Khách hàng'];
        } else if (viewMode === 'details') {
            data = filteredDetails;
            headers = ['Vật tư', 'Ngày bán', 'Khách hàng', 'SĐT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Chi phí', 'Lợi nhuận', 'Tồn kho'];
        } else {
            data = filteredStockInfo;
            headers = ['Vật tư', 'Đơn vị', 'Tồn kho', 'Tổng nhập', 'Tổng bán', 'Chi phí nhập', 'Giá nhập TB', 'Giá trị tồn kho'];
        }

        const csvContent = [
            headers.join(','),
            ...data.map(row => {
                if (viewMode === 'summary') {
                    const s = row as MaterialSummary;
                    return [s.material_name, s.material_unit, s.total_quantity_sold, s.total_revenue, s.total_cost, s.total_profit, s.profit_margin.toFixed(2), s.current_stock, s.total_orders, s.unique_customers].join(',');
                } else if (viewMode === 'details') {
                    const d = row as MaterialSaleDetail;
                    return [d.material_name, formatDate(d.order_date), d.customer_name, d.customer_phone, d.quantity, d.unit_price, d.total_price, d.total_cost, d.profit, d.current_stock].join(',');
                } else {
                    const st = row as MaterialStockInfo;
                    return [st.material_name, st.material_unit, st.current_stock, st.total_imported, st.total_sold, st.total_import_cost, st.avg_import_price, st.stock_value].join(',');
                }
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bao-cao-vat-tu-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const quickDateRanges = [
        { label: 'Hôm nay', start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
        { label: '7 ngày qua', start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
        { label: '30 ngày qua', start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
        { label: 'Tháng này', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-3">
                                <Box className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Báo cáo chi tiết vật tư</h1>
                                <p className="text-gray-600 mt-1">Phân tích bán hàng và tồn kho vật tư</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={exportToCSV}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
                            >
                                <Download className="h-4 w-4" />
                                <span>Xuất CSV</span>
                            </button>
                            <button
                                onClick={() => {
                                    fetchMaterialSalesData();
                                    fetchMaterialStockInfo();
                                }}
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                <span>Làm mới</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Date Range */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Khoảng thời gian</label>
                            <div className="flex space-x-3 mb-3">
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="flex items-center text-gray-500">đến</span>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {quickDateRanges.map((range) => (
                                    <button
                                        key={range.label}
                                        onClick={() => setDateRange({ startDate: range.start, endDate: range.end })}
                                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-full transition-colors"
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Material Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Vật tư</label>
                            <select
                                value={selectedMaterial}
                                onChange={(e) => setSelectedMaterial(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả vật tư</option>
                                {materialsList.map((material) => (
                                    <option key={material.id} value={material.id}>
                                        {material.name} ({material.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Tên vật tư, khách hàng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* View Mode */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Chế độ xem</label>
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                <button
                                    onClick={() => setViewMode('summary')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'summary'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Tổng quan
                                </button>
                                <button
                                    onClick={() => setViewMode('details')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'details'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Chi tiết
                                </button>
                                <button
                                    onClick={() => setViewMode('stock')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'stock'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Tồn kho
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">Lỗi tải dữ liệu</p>
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: 'Tổng doanh thu',
                            value: formatCurrency(materialSummaries.reduce((sum, m) => sum + m.total_revenue, 0)),
                            icon: DollarSign,
                            color: 'from-green-500 to-emerald-600'
                        },
                        {
                            label: 'Tổng lợi nhuận',
                            value: formatCurrency(materialSummaries.reduce((sum, m) => sum + m.total_profit, 0)),
                            icon: TrendingUp,
                            color: 'from-blue-500 to-cyan-600'
                        },
                        {
                            label: 'Vật tư bán',
                            value: materialSummaries.length.toString(),
                            icon: Box,
                            color: 'from-purple-500 to-violet-600'
                        },
                        {
                            label: 'Giá trị tồn kho',
                            value: formatCurrency(materialStockInfo.reduce((sum, m) => sum + m.stock_value, 0)),
                            icon: Package,
                            color: 'from-orange-500 to-red-600'
                        }
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-3`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">
                            {viewMode === 'summary' ? 'Tổng quan theo vật tư' : 
                             viewMode === 'details' ? 'Chi tiết bán hàng' : 'Thông tin tồn kho'}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {viewMode === 'summary' ? (
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vật tư</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Số lượng bán</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Doanh thu</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Chi phí</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Lợi nhuận</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tỷ suất LN</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tồn kho</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Đơn hàng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSummaries.map((summary, index) => (
                                            <tr key={index} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{summary.material_name}</div>
                                                    <div className="text-sm text-gray-500">{summary.material_unit}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                                    {summary.total_quantity_sold.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 font-semibold">
                                                    {formatCurrency(summary.total_revenue)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                    {formatCurrency(summary.total_cost)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold ${summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(summary.total_profit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold ${summary.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {summary.profit_margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-medium ${summary.current_stock > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {summary.current_stock.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-purple-600 font-medium">
                                                    {summary.total_orders}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : viewMode === 'details' ? (
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vật tư</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngày bán</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Khách hàng</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Số lượng</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Đơn giá</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Chi phí</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Lợi nhuận</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tồn kho</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDetails.map((detail, index) => (
                                            <tr key={index} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{detail.material_name}</div>
                                                    <div className="text-sm text-gray-500">{detail.material_unit}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {formatDate(detail.order_date)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{detail.customer_name}</div>
                                                    <div className="text-sm text-gray-500">{detail.customer_phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                                    {detail.quantity.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700">
                                                    {formatCurrency(detail.unit_price)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 font-semibold">
                                                    {formatCurrency(detail.total_price)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-red-600">
                                                    {formatCurrency(detail.total_cost)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold ${detail.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(detail.profit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-medium ${detail.current_stock > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {detail.current_stock.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${detail.order_status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : detail.order_status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {detail.order_status === 'completed' ? 'Hoàn thành' :
                                                            detail.order_status === 'pending' ? 'Chờ xử lý' : 'Thanh toán 1 phần'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vật tư</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tồn kho</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tổng nhập</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tổng bán</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Chi phí nhập</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Giá nhập TB</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Giá trị tồn kho</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Tình trạng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStockInfo.map((stock, index) => (
                                            <tr key={index} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{stock.material_name}</div>
                                                    <div className="text-sm text-gray-500">{stock.material_unit}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold text-lg ${stock.current_stock > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {stock.current_stock.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                                    {stock.total_imported.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                                    {stock.total_sold.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                    {formatCurrency(stock.total_import_cost)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700">
                                                    {formatCurrency(stock.avg_import_price)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 font-semibold">
                                                    {formatCurrency(stock.stock_value)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${stock.current_stock > 10
                                                        ? 'bg-green-100 text-green-800'
                                                        : stock.current_stock > 0
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {stock.current_stock > 10 ? 'Đủ hàng' :
                                                            stock.current_stock > 0 ? 'Sắp hết' : 'Hết hàng'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && (
                        (viewMode === 'summary' && filteredSummaries.length === 0) ||
                        (viewMode === 'details' && filteredDetails.length === 0) ||
                        (viewMode === 'stock' && filteredStockInfo.length === 0)
                    ) && (
                        <div className="text-center py-12">
                            <Box className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                            <p className="text-gray-500">
                                {viewMode === 'summary' || viewMode === 'details' 
                                    ? 'Không tìm thấy dữ liệu bán hàng trong khoảng thời gian đã chọn.'
                                    : 'Không tìm thấy thông tin tồn kho vật tư.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialSalesReport;