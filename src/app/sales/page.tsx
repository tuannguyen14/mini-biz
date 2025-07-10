// app/sales/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calculator, X, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SalesHeader } from './components/SalesHeader';
import { CustomerSection } from './components/CustomerSection';
import { OrderItemsList } from './components/OrderItemsList';
import { ItemSelectorDialog } from './components/ItemSelectorDialog';
import { OrderSummary } from './components/OrderSummary';
import { fetchInitialData, getLatestCostPrice, saveOrder } from './actions/actions';
import { calculateOrderSummary } from './actions/utils';
import { Customer, Product, Material, OrderItem } from './actions/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportExcelDialog } from './components/ImportExcelDialog';

export default function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>('products');
  const [showItemSelector, setShowItemSelector] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        const { customers, products, materials } = await fetchInitialData();
        setCustomers(customers);
        setProducts(products);
        setMaterials(materials);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddItem = async (item: Product | Material, type: 'product' | 'material') => {
    try {
      const costPrice = await getLatestCostPrice(item.id, type);
      const orderItem: OrderItem = {
        id: Date.now().toString(),
        item_type: type,
        [type === 'product' ? 'product_id' : 'material_id']: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        unit_price: costPrice * 1.3,
        unit_cost: costPrice,
        discount: 0,
        available_stock: item.current_stock,
      };
      setOrderItems([...orderItems, orderItem]);
      setShowItemSelector(false);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Không thể thêm sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleImportItems = async (items: Array<{ id: string; quantity: number; type: 'product' | 'material', discount: number }>) => {
    try {
      setLoading(true);

      const newOrderItems: OrderItem[] = [];

      for (const item of items) {
        const productOrMaterial = item.type === 'product'
          ? products.find(p => p.id === item.id)
          : materials.find(m => m.id === item.id);

        if (productOrMaterial) {
          const costPrice = await getLatestCostPrice(item.id, item.type);
          const orderItem: OrderItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            item_type: item.type,
            [item.type === 'product' ? 'product_id' : 'material_id']: item.id,
            name: productOrMaterial.name,
            unit: productOrMaterial.unit,
            quantity: item.quantity,
            unit_price: costPrice * 1.3,
            unit_cost: costPrice,
            discount: item.discount,
            available_stock: productOrMaterial.current_stock,
          };
          newOrderItems.push(orderItem);
        }
      }

      setOrderItems([...orderItems, ...newOrderItems]);
    } catch (err) {
      console.error('Error importing items:', err);
      setError('Có lỗi xảy ra khi import sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderItem = (id: string, field: 'quantity' | 'unit_price' | 'discount', value: string) => {
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleSaveOrder = async () => {
    if (!selectedCustomer) {
      setError('Vui lòng chọn khách hàng');
      return;
    }
    if (orderItems.length === 0) {
      setError('Vui lòng thêm sản phẩm vào đơn hàng');
      return;
    }

    setLoading(true);
    try {
      const orderSummary = calculateOrderSummary(orderItems, paymentAmount);

      await saveOrder({
        customerId: selectedCustomer.id,
        orderItems,
        totalAmount: orderSummary.totalAmount,
        totalCost: orderSummary.totalCost,
        paidAmount: parseFloat(paymentAmount) || 0,
        orderNotes,
        paymentMethod
      });

      setOrderItems([]);
      setPaymentAmount('');
      setOrderNotes('');
      setSelectedCustomer(null);
      setError(null);

      // Refresh data
      const { customers, products, materials } = await fetchInitialData();
      setCustomers(customers);
      setProducts(products);
      setMaterials(materials);

      alert('Đơn hàng đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Có lỗi xảy ra khi lưu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const orderSummary = calculateOrderSummary(orderItems, paymentAmount);

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <ShoppingCart className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Đang khởi tạo hệ thống</h3>
          <p className="text-gray-600">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-8">
        <SalesHeader
          orderItemsCount={orderItems.length}
          orderSummary={orderSummary}
        />

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CustomerSection
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />

            <ImportExcelDialog
              products={products}
              materials={materials}
              onImport={handleImportItems}
            />

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package2 className="h-5 w-5 text-green-600" />
                    </div>
                    Sản phẩm đặt hàng
                  </CardTitle>
                  <ItemSelectorDialog
                    open={showItemSelector}
                    onOpenChange={setShowItemSelector}
                    products={products}
                    materials={materials}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onAddItem={handleAddItem}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <OrderItemsList
                  orderItems={orderItems}
                  onUpdateItem={updateOrderItem}
                  onRemoveItem={removeOrderItem}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {orderItems.length > 0 ? (
              <OrderSummary
                orderSummary={orderSummary}
                paymentAmount={paymentAmount}
                paymentMethod={paymentMethod}
                orderNotes={orderNotes}
                onPaymentAmountChange={setPaymentAmount}
                onPaymentMethodChange={setPaymentMethod}
                onOrderNotesChange={setOrderNotes}
                onSaveOrder={handleSaveOrder}
                loading={loading}
              />
            ) : (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Calculator className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Chưa có dữ liệu</h3>
                    <p className="text-sm text-gray-500 mt-1">Thông tin tổng kết sẽ hiển thị khi bạn thêm sản phẩm</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}