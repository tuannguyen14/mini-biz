"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

interface ProductSaleDetail {
  id: string;
  product_name: string;
  product_unit: string;
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
}

interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  total_orders: number;
  unique_customers: number;
}

const ProductSalesReport = () => {
  const [productDetails, setProductDetails] = useState<ProductSaleDetail[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>(
    []
  );
  const [productsList, setProductsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"summary" | "details">("summary");

  const fetchProductsList = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setProductsList(data || []);
    } catch (error) {
      console.error("Error fetching products list:", error);
    }
  };

  const fetchProductSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch detailed sales data with proper joins
      const { data: detailsData, error: detailsError } = await supabase
        .from("order_items")
        .select(
          `
          id,
          quantity,
          unit_price,
          total_price,
          unit_cost,
          total_cost,
          profit,
          product_id,
          order_id,
          products!order_items_product_id_fkey(
            id,
            name,
            unit
          ),
          orders!order_items_order_id_fkey(
            id,
            order_date,
            status,
            customers!orders_customer_id_fkey(
              id,
              name,
              phone
            )
          )
        `
        )
        .eq("item_type", "product")
        .not("product_id", "is", null);

      if (detailsError) {
        console.error("Supabase error:", detailsError);
        throw detailsError;
      }

      if (!detailsData) {
        setProductDetails([]);
        setProductSummaries([]);
        return;
      }

      // Filter by date range and selected product on client side for now
      const filteredData = detailsData.filter((item: any) => {
        const orderDate = new Date(item.orders?.order_date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate + "T23:59:59");

        const isInDateRange = orderDate >= startDate && orderDate <= endDate;
        const isSelectedProduct =
          selectedProduct === "all" || item.product_id === selectedProduct;

        return (
          isInDateRange &&
          isSelectedProduct &&
          item.products &&
          item.orders?.customers
        );
      });

      const formattedDetails: ProductSaleDetail[] = filteredData.map(
        (item: any) => ({
          id: item.id,
          product_name: item.products?.name || "N/A",
          product_unit: item.products?.unit || "",
          order_id: item.orders?.id || "",
          order_date: item.orders?.order_date || "",
          customer_name: item.orders?.customers?.name || "N/A",
          customer_phone: item.orders?.customers?.phone || "",
          quantity: parseFloat(item.quantity || 0),
          unit_price: parseFloat(item.unit_price || 0),
          total_price: parseFloat(item.total_price || 0),
          unit_cost: parseFloat(item.unit_cost || 0),
          total_cost: parseFloat(item.total_cost || 0),
          profit: parseFloat(item.profit || 0),
          order_status: item.orders?.status || "pending",
        })
      );

      setProductDetails(formattedDetails);

      // Calculate summaries
      const summaries = calculateProductSummaries(formattedDetails);
      setProductSummaries(summaries);
    } catch (error: any) {
      console.error("Error fetching product sales data:", error);
      setError(error.message || "Có lỗi xảy ra khi tải dữ liệu");
      setProductDetails([]);
      setProductSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const calculateProductSummaries = (
    details: ProductSaleDetail[]
  ): ProductSummary[] => {
    const summaryMap = new Map<string, ProductSummary>();

    details.forEach((detail) => {
      const key = detail.product_name;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          product_id: key,
          product_name: detail.product_name,
          total_quantity_sold: 0,
          total_revenue: 0,
          total_cost: 0,
          total_profit: 0,
          profit_margin: 0,
          total_orders: 0,
          unique_customers: 0,
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
      const productDetails = details.filter((d) => d.product_name === key);
      summary.total_orders = new Set(
        productDetails.map((d) => d.order_id)
      ).size;
      summary.unique_customers = new Set(
        productDetails.map((d) => d.customer_name)
      ).size;
      summary.profit_margin =
        summary.total_revenue > 0
          ? (summary.total_profit / summary.total_revenue) * 100
          : 0;
    });

    return Array.from(summaryMap.values()).sort(
      (a, b) => b.total_revenue - a.total_revenue
    );
  };

  const filteredDetails = productDetails.filter(
    (detail) =>
      detail.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSummaries = productSummaries.filter((summary) => {

    // Cải thiện search: tách từ khóa và tìm tất cả các từ
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    const combinedText = `${summary.product_name}`.toLowerCase();
    const normalizedText = removeVietnameseTones(combinedText);

    // Tất cả các từ trong search phải có trong text (không cần theo thứ tự)
    const matchesSearch = searchWords.every((word) => {
      const normalizedWord = removeVietnameseTones(word);
      // Tìm cả trong text gốc và text đã loại bỏ dấu
      return (
        combinedText.includes(word) || normalizedText.includes(normalizedWord)
      );
    });

    return matchesSearch;
  });

  useEffect(() => {
    fetchProductsList();
  }, []);

  useEffect(() => {
    fetchProductSalesData();
  }, [dateRange, selectedProduct]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const exportToCSV = () => {
    const data = viewMode === "summary" ? filteredSummaries : filteredDetails;
    const headers =
      viewMode === "summary"
        ? [
            "Sản phẩm",
            "Số lượng bán",
            "Doanh thu",
            "Chi phí",
            "Lợi nhuận",
            "Tỷ suất LN (%)",
            "Số đơn hàng",
            "Số khách hàng",
          ]
        : [
            "Sản phẩm",
            "Ngày bán",
            "Khách hàng",
            "SĐT",
            "Số lượng",
            "Đơn giá",
            "Thành tiền",
            "Chi phí",
            "Lợi nhuận",
          ];

    const csvContent = [
      headers.join(","),
      ...data.map((row) => {
        if (viewMode === "summary") {
          const s = row as ProductSummary;
          return [
            s.product_name,
            s.total_quantity_sold,
            s.total_revenue,
            s.total_cost,
            s.total_profit,
            s.profit_margin.toFixed(2),
            s.total_orders,
            s.unique_customers,
          ].join(",");
        } else {
          const d = row as ProductSaleDetail;
          return [
            d.product_name,
            formatDate(d.order_date),
            d.customer_name,
            d.customer_phone,
            d.quantity,
            d.unit_price,
            d.total_price,
            d.total_cost,
            d.profit,
          ].join(",");
        }
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-san-pham-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const quickDateRanges = [
    {
      label: "Hôm nay",
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    {
      label: "7 ngày qua",
      start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    {
      label: "30 ngày qua",
      start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    {
      label: "Tháng này",
      start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Báo cáo chi tiết sản phẩm
                </h1>
                <p className="text-gray-600 mt-1">
                  Phân tích doanh thu và lợi nhuận theo sản phẩm
                </p>
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
                onClick={fetchProductSalesData}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Date Range */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Khoảng thời gian
              </label>
              <div className="flex space-x-3 mb-3">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500">đến</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {quickDateRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() =>
                      setDateRange({
                        startDate: range.start,
                        endDate: range.end,
                      })
                    }
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-full transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sản phẩm
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả sản phẩm</option>
                {productsList.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tên sản phẩm, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Chế độ xem
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode("summary")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "summary"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setViewMode("details")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "details"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Chi tiết
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">
                    Lỗi tải dữ liệu
                  </p>
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
              label: "Tổng doanh thu",
              value: formatCurrency(
                productSummaries.reduce((sum, p) => sum + p.total_revenue, 0)
              ),
              icon: DollarSign,
              color: "from-green-500 to-emerald-600",
            },
            {
              label: "Tổng lợi nhuận",
              value: formatCurrency(
                productSummaries.reduce((sum, p) => sum + p.total_profit, 0)
              ),
              icon: TrendingUp,
              color: "from-blue-500 to-cyan-600",
            },
            {
              label: "Sản phẩm bán",
              value: productSummaries.length.toString(),
              icon: Package,
              color: "from-purple-500 to-violet-600",
            },
            {
              label: "Đơn hàng",
              value: new Set(
                productDetails.map((d) => d.order_id)
              ).size.toString(),
              icon: Users,
              color: "from-orange-500 to-red-600",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`bg-gradient-to-r ${stat.color} rounded-xl p-3`}
                >
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
              {viewMode === "summary"
                ? "Tổng quan theo sản phẩm"
                : "Chi tiết bán hàng"}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {viewMode === "summary" ? (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Số lượng bán
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Doanh thu
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Chi phí
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Lợi nhuận
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Tỷ suất LN
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Đơn hàng
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Khách hàng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSummaries.map((summary, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {summary.product_name}
                          </div>
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
                          <span
                            className={`font-bold ${
                              summary.total_profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(summary.total_profit)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-bold ${
                              summary.profit_margin >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {summary.profit_margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600 font-medium">
                          {summary.total_orders}
                        </td>
                        <td className="px-6 py-4 text-right text-purple-600 font-medium">
                          {summary.unique_customers}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Ngày bán
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Khách hàng
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Số lượng
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Đơn giá
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Thành tiền
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Chi phí
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Lợi nhuận
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDetails.map((detail, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {detail.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {detail.product_unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(detail.order_date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {detail.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {detail.customer_phone}
                          </div>
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
                          <span
                            className={`font-bold ${
                              detail.profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(detail.profit)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              detail.order_status === "completed"
                                ? "bg-green-100 text-green-800"
                                : detail.order_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {detail.order_status === "completed"
                              ? "Hoàn thành"
                              : detail.order_status === "pending"
                              ? "Chờ xử lý"
                              : "Thanh toán 1 phần"}
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
          {!loading &&
            (viewMode === "summary"
              ? filteredSummaries.length === 0
              : filteredDetails.length === 0) && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có dữ liệu
                </h3>
                <p className="text-gray-500">
                  Không tìm thấy dữ liệu bán hàng trong khoảng thời gian đã
                  chọn.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductSalesReport;
