"use client";

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Save,
  Search,
  X,
  Box,
  Clock,
  DollarSign,
  Download,
  AlertTriangle,
  CheckCircle,
  Package2,
  ShoppingCart
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from 'sonner';
import { ImportHistory } from '@/components/types/ImportHistory';
import { ImportItem } from "@/components/types/ImportItem";
import { Material } from "@/components/types/Material";

export default function MaterialImport() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Form states
  const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: '' });
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importNotes, setImportNotes] = useState('');
  const [activeTab, setActiveTab] = useState('import');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalImports: 0,
    totalValue: 0,
    uniqueMaterials: 0,
    todayImports: 0
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast('Không thể tải danh sách vật tư');
    }
  };

  // Fetch import history
  const fetchImportHistory = async () => {
    try {
      let query = supabase
        .from('material_imports')
        .select(`
          *,
          material:materials(name, unit)
        `)
        .order('import_date', { ascending: false })
        .limit(50);

      // Filter by period
      if (selectedPeriod === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('import_date', today.toISOString());
      } else if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('import_date', weekAgo.toISOString());
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('import_date', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setImportHistory(data || []);

      // Calculate statistics
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayImports = data?.filter(imp =>
        new Date(imp.import_date) >= todayStart
      ) || [];

      setStats({
        totalImports: data?.length || 0,
        totalValue: data?.reduce((sum, imp) => sum + (imp.total_amount || 0), 0) || 0,
        uniqueMaterials: new Set(data?.map(imp => imp.material_id)).size || 0,
        todayImports: todayImports.length
      });

    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMaterials(), fetchImportHistory()]);
      setLoading(false);
    };
    loadData();
  }, [selectedPeriod]);

  // Add material to import list
  const addImportItem = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const existingItem = importItems.find(item => item.materialId === materialId);
    if (existingItem) {
      toast('Vật tư này đã có trong danh sách nhập');
      return;
    }

    setImportItems([...importItems, {
      materialId,
      materialName: material.name,
      unit: material.unit,
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    }]);
  };

  // Update import item
  const updateImportItem = (index: number, field: keyof ImportItem, value: any) => {
    const newItems = [...importItems];
    (newItems[index] as any)[field] = value;

    // Calculate total amount
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalAmount = newItems[index].quantity * newItems[index].unitPrice;
    }

    setImportItems(newItems);
  };

  // Remove import item
  const removeImportItem = (index: number) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  // Create new material
  const createMaterial = async () => {
    if (!newMaterial.name || !newMaterial.unit) {
      toast('Vui lòng nhập đầy đủ thông tin vật tư');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([newMaterial])
        .select()
        .single();

      if (error) throw error;

      setMaterials([...materials, data]);
      setNewMaterial({ name: '', unit: '' });
      setShowNewMaterialDialog(false);

      toast('Đã thêm vật tư mới');

      // Add to import list
      addImportItem(data.id);
    } catch (error) {
      console.error('Error creating material:', error);
      toast('Không thể tạo vật tư mới');
    }
  };

  // Save import
  const saveImport = async () => {
    if (importItems.length === 0) {
      toast('Vui lòng thêm ít nhất một vật tư để nhập');
      return;
    }

    // Validate all items
    const invalidItems = importItems.filter(item =>
      !item.quantity || item.quantity <= 0 ||
      !item.unitPrice || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      toast('Vui lòng nhập đầy đủ số lượng và đơn giá cho tất cả vật tư');
      return;
    }

    setSaving(true);

    try {
      // Prepare import data
      const importData = importItems.map(item => ({
        material_id: item.materialId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        notes: importNotes || null,
        import_date: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('material_imports')
        .insert(importData);

      if (error) throw error;

      toast('Thành công');

      // Reset form
      setImportItems([]);
      setImportNotes('');

      // Refresh data
      await Promise.all([fetchMaterials(), fetchImportHistory()]);

    } catch (error) {
      console.error('Error saving import:', error);
      toast('Không thể lưu phiếu nhập');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return importItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  };

  // Filter materials for search
  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      // Kiểm tra xem vật tư có được sử dụng trong phiếu nhập không
      const { data: imports, error: checkError } = await supabase
        .from('material_imports')
        .select('id')
        .eq('material_id', materialToDelete.id)
        .limit(1);

      if (checkError) throw checkError;

      if (imports && imports.length > 0) {
        toast('Không thể xóa vật tư đã có phiếu nhập');
        setShowDeleteDialog(false);
        setMaterialToDelete(null);
        return;
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialToDelete.id);

      if (error) throw error;

      toast('Đã xóa vật tư thành công');

      // Cập nhật danh sách vật tư
      setMaterials(materials.filter(m => m.id !== materialToDelete.id));

      // Đóng dialog
      setShowDeleteDialog(false);
      setMaterialToDelete(null);

    } catch (error) {
      console.error('Error deleting material:', error);
      toast('Không thể xóa vật tư');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Toaster />
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                  <Package className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Quản lý nhập kho
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Hệ thống quản lý vật tư và phiếu nhập kho thông minh
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewMaterialDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Thêm vật tư mới
              </button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalImports}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tổng phiếu nhập
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                +{stats.todayImports} hôm nay
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalValue).replace('₫', '')}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tổng giá trị
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Trong kỳ này
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Package2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.uniqueMaterials}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Loại vật tư
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Đã nhập trong kỳ
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Box className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {materials.length}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tổng tồn kho
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Các loại vật tư
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex space-x-1">
              {[
                { id: 'import', label: 'Nhập vật tư', icon: Plus },
                { id: 'history', label: 'Lịch sử nhập', icon: Clock },
                { id: 'inventory', label: 'Tồn kho', icon: Package }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Material Selection - Left Side */}
            <div className="xl:col-span-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Chọn vật tư
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Tìm và chọn vật tư cần nhập kho
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm vật tư..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => addImportItem(material.id)}
                        className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {material.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Tồn: {material.current_stock || 0} {material.unit}
                            </span>
                            {(material.current_stock || 0) <= 50 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Sắp hết
                              </span>
                            )}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Import Form - Right Side */}
            <div className="xl:col-span-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Phiếu nhập kho
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Nhập thông tin chi tiết cho từng vật tư
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(calculateTotals())}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Tổng giá trị
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {importItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Chưa có vật tư nào
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400">
                        Chọn vật tư từ danh sách bên trái để bắt đầu tạo phiếu nhập
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {importItems.map((item, index) => (
                          <div key={index} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {item.materialName}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Đơn vị: {item.unit}
                                </p>
                              </div>
                              <button
                                onClick={() => removeImportItem(index)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Số lượng
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateImportItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Đơn giá (VND)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateImportItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Thành tiền
                                </label>
                                <input
                                  type="text"
                                  value={formatCurrency(item.totalAmount)}
                                  readOnly
                                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Ghi chú
                          </label>
                          <textarea
                            placeholder="Ghi chú cho phiếu nhập (tùy chọn)"
                            value={importNotes}
                            onChange={(e) => setImportNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setImportItems([]);
                              setImportNotes('');
                            }}
                            className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <X className="w-4 h-4 mr-2 inline" />
                            Hủy
                          </button>
                          <button
                            onClick={saveImport}
                            disabled={saving}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2 inline" />
                                Lưu phiếu nhập
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Lịch sử nhập kho
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Danh sách các phiếu nhập gần đây
                  </p>
                </div>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">7 ngày qua</option>
                  <option value="month">30 ngày qua</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tên vật tư</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Đơn vị</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tồn kho</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Cập nhật</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {importHistory.map((import_) => (
                    <tr key={import_.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDate(import_.import_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {import_.material.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Đơn vị: {import_.material.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {import_.quantity} {import_.material.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {formatCurrency(import_.unit_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatCurrency(import_.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {import_.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tồn kho vật tư
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Số lượng hiện có trong kho
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                   <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tên vật tư</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Đơn vị</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tồn kho</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Cập nhật</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {materials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {material.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {material.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {material.current_stock || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(material.current_stock || 0) <= 50 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Sắp hết
                          </span>
                        ) : (material.current_stock || 0) <= 100 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3" />
                            Thấp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Bình thường
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(material.updated_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setMaterialToDelete(material);
                            setShowDeleteDialog(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa vật tư"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Material Dialog */}
        {showNewMaterialDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Thêm vật tư mới
                  </h3>
                  <button
                    onClick={() => setShowNewMaterialDialog(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Tạo vật tư mới để thêm vào danh sách nhập
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tên vật tư
                  </label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    placeholder="VD: Chai nhựa 500ml"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    placeholder="VD: Chai, Thùng, Kg..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewMaterialDialog(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={createMaterial}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Tạo vật tư
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete Material Dialog */}
        {showDeleteDialog && materialToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Xác nhận xóa vật tư
                  </h3>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setMaterialToDelete(null);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                      Bạn có chắc chắn muốn xóa?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Vật tư &quot;{materialToDelete.name}&quot; sẽ bị xóa vĩnh viễn
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <strong>Lưu ý:</strong> Không thể xóa vật tư đã có phiếu nhập trong hệ thống.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setMaterialToDelete(null);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={deleteMaterial}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-600 text-white rounded-xl hover:from-red-700 hover:to-red-700 transition-all duration-200"
                  >
                    Xóa vật tư
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}