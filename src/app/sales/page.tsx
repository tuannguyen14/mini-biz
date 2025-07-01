"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Search, Package, ShoppingCart, Save, Calculator,
  Loader2, CreditCard, Receipt, Edit3, X, ArrowRight,
  TrendingUp, Wallet, Package2, Users, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

const SalesPage = () => {
  // State definitions
  type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    outstanding_debt?: number;
    [key: string]: any;
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  type Product = {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    [key: string]: any;
  };
  type Material = {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    [key: string]: any;
  };
  type OrderItem = {
    id: string;
    item_type: 'product' | 'material';
    product_id?: string;
    material_id?: string;
    name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    discount: number; // Thêm trường discount
    available_stock: number;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');



  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setDataLoading(true);
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (customersError) throw customersError;
      setCustomers(customersData || []);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      if (materialsError) throw materialsError;
      setMaterials(materialsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setDataLoading(false);
    }
  };

  const getLatestCostPrice = async (itemId: string, itemType: 'product' | 'material') => {
    try {
      if (itemType === 'material') {
        const { data, error } = await supabase
          .from('material_imports')
          .select('unit_price')
          .eq('material_id', itemId)
          .order('import_date', { ascending: false })
          .limit(1);
        if (error) throw error;
        return data?.[0]?.unit_price || 0;
      } else {
        const costPrice = await calculateProductCost(itemId);
        return costPrice;
      }
    } catch (err) {
      console.error('Error getting cost price:', err);
      return 0;
    }
  };

  const calculateProductCost = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_product_cost', { p_product_id: productId });
      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Error calculating product cost:', err);
      return 0;
    }
  };

  // Tính toán tổng đơn hàng với discount
  const calculateItemTotals = (item: OrderItem) => {
    const subtotal = item.quantity * item.unit_price;
    const total_price = subtotal - item.discount; // Trừ discount
    const total_cost = item.quantity * item.unit_cost;
    const profit = total_price - total_cost;
    return { subtotal, total_price, total_cost, profit };
  };

  const orderSummary = {
    get subtotalAmount() {
      return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    },
    get totalDiscount() {
      return orderItems.reduce((sum, item) => sum + item.discount, 0);
    },
    get totalAmount() {
      return orderItems.reduce((sum, item) => sum + calculateItemTotals(item).total_price, 0);
    },
    get totalCost() {
      return orderItems.reduce((sum, item) => sum + calculateItemTotals(item).total_cost, 0);
    },
    get profit() { return this.totalAmount - this.totalCost; },
    get debt() { return this.totalAmount - (parseFloat(paymentAmount) || 0); }
  };

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
        discount: 0, // Mặc định không giảm giá
        available_stock: item.current_stock,
      };
      setOrderItems([...orderItems, orderItem]);
      setShowItemSelector(false);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Không thể thêm sản phẩm. Vui lòng thử lại.');
    }
  };

  const updateOrderItem = (id: string, field: keyof Pick<OrderItem, 'quantity' | 'unit_price' | 'discount'>, value: string) => {
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
      // Xác định status dựa trên debt
      let orderStatus = 'pending';
      const paidAmount = parseFloat(paymentAmount) || 0;
      if (orderSummary.debt <= 0) {
        orderStatus = 'completed';
      } else if (paidAmount > 0) {
        orderStatus = 'partial_paid';
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedCustomer.id,
          total_amount: orderSummary.totalAmount,
          total_cost: orderSummary.totalCost,
          paid_amount: paidAmount,
          notes: orderNotes,
          status: orderStatus
        }])
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItemsData = orderItems.map(item => ({
        order_id: orderData.id,
        item_type: item.item_type,
        product_id: item.product_id || null,
        material_id: item.material_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        discount: item.discount // Lưu discount
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);
      if (itemsError) throw itemsError;

      if (parseFloat(paymentAmount) > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            order_id: orderData.id,
            amount: parseFloat(paymentAmount),
            payment_method: paymentMethod
          }]);
        if (paymentError) throw paymentError;
      }

      setOrderItems([]);
      setPaymentAmount('');
      setOrderNotes('');
      setSelectedCustomer(null);
      setError(null);
      await fetchInitialData();
      alert('Đơn hàng đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Có lỗi xảy ra khi lưu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Bán Hàng</h1>
                    <p className="text-blue-100">Tạo đơn hàng mới và quản lý bán hàng hiệu quả</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{orderItems.length}</div>
                  <div className="text-sm text-blue-100">Sản phẩm</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{orderSummary.totalAmount.toLocaleString()}</div>
                  <div className="text-sm text-blue-100">Tổng tiền</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Error Alert */}
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
          {/* Left Column - Customer & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection - Modern Design */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  Khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedCustomer ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select
                        onValueChange={(value) => {
                          const customer = customers.find(c => c.id === value);
                          setSelectedCustomer(customer ?? null);
                        }}
                      >
                        <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                          <SelectValue placeholder="Chọn khách hàng..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-60">
                            {customers.map(customer => (
                              <SelectItem key={customer.id} value={customer.id} className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                      {customer.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-xs text-gray-500">{customer.phone}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                          <Separator />
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {selectedCustomer.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg">{selectedCustomer.name}</div>
                          <div className="text-gray-600">{selectedCustomer.phone}</div>
                          {selectedCustomer.outstanding_debt !== undefined && selectedCustomer.outstanding_debt > 0 && (
                            <Badge variant="destructive" className="mt-1">
                              Nợ cũ: {selectedCustomer.outstanding_debt.toLocaleString()}đ
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="border-2">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Đổi
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items - Enhanced với Discount */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package2 className="h-5 w-5 text-green-600" />
                    </div>
                    Sản phẩm đặt hàng
                  </CardTitle>
                  <Dialog open={showItemSelector} onOpenChange={setShowItemSelector}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm sản phẩm
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Chọn sản phẩm</DialogTitle>
                        <DialogDescription>
                          Chọn sản phẩm hoặc vật tư để thêm vào đơn hàng
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 border-2 focus:border-blue-400"
                          />
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="products" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Sản phẩm ({filteredProducts.length})
                            </TabsTrigger>
                            <TabsTrigger value="materials" className="flex items-center gap-2">
                              <Package2 className="h-4 w-4" />
                              Vật tư ({filteredMaterials.length})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="products" className="space-y-4">
                            <ScrollArea className="h-80">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                                {filteredProducts.map(product => (
                                  <Card
                                    key={product.id}
                                    className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all duration-200 border-2"
                                    onClick={() => handleAddItem(product, 'product')}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="font-semibold text-lg">{product.name}</div>
                                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-green-600 border-green-300">
                                              Sản phẩm
                                            </Badge>
                                            <span>Tồn: {product.current_stock} {product.unit}</span>
                                          </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="materials" className="space-y-4">
                            <ScrollArea className="h-80">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                                {filteredMaterials.map(material => (
                                  <Card
                                    key={material.id}
                                    className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 border-2"
                                    onClick={() => handleAddItem(material, 'material')}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="font-semibold text-lg">{material.name}</div>
                                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                                              Vật tư
                                            </Badge>
                                            <span>Tồn: {material.current_stock} {material.unit}</span>
                                          </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingCart className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Chưa có sản phẩm</h3>
                      <p className="text-gray-500">Thêm sản phẩm để bắt đầu tạo đơn hàng</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <Card key={item.id} className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                            <div className="md:col-span-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.item_type === 'product' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                  {item.item_type === 'product' ?
                                    <Package className="h-4 w-4 text-green-600" /> :
                                    <Package2 className="h-4 w-4 text-blue-600" />
                                  }
                                </div>
                                <div>
                                  <div className="font-semibold">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    Tồn kho: {item.available_stock} {item.unit}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-center">
                              <Label className="text-xs text-gray-500 mb-1 block">Số lượng</Label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(item.id, 'quantity', e.target.value)}
                                className="w-20 text-center h-10"
                              />
                              <div className="text-xs text-gray-400 mt-1">{item.unit}</div>
                            </div>

                            <div className="text-center">
                              <Label className="text-xs text-gray-500 mb-1 block">Đơn giá</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1000"
                                value={item.unit_price}
                                onChange={(e) => updateOrderItem(item.id, 'unit_price', e.target.value)}
                                className="w-24 text-right h-10"
                              />
                              <div className="text-xs text-gray-400 mt-1">
                                Vốn: {item.unit_cost.toLocaleString()}đ
                              </div>
                            </div>

                            <div className="text-center">
                              <Label className="text-xs text-gray-500 mb-1 block">Giảm giá</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1000"
                                value={item.discount}
                                onChange={(e) => updateOrderItem(item.id, 'discount', e.target.value)}
                                className="w-24 text-right h-10"
                              />
                              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                                Giảm
                              </div>
                            </div>

                            <div className="text-center">
                              <Label className="text-xs text-gray-500 mb-1 block">Thành tiền</Label>
                              <div className="space-y-1">
                                {item.discount > 0 && (
                                  <div className="text-sm text-gray-400 line-through">
                                    {(item.quantity * item.unit_price).toLocaleString()}đ
                                  </div>
                                )}
                                <div className="font-bold text-lg">
                                  {calculateItemTotals(item).total_price.toLocaleString()}đ
                                </div>
                                {item.discount > 0 && (
                                  <div className="text-xs text-red-500">
                                    (-{item.discount.toLocaleString()}đ)
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-center">
                              <Label className="text-xs text-gray-500 mb-1 block">Lợi nhuận</Label>
                              <div className={`font-semibold ${calculateItemTotals(item).profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {calculateItemTotals(item).profit.toLocaleString()}đ
                              </div>
                            </div>

                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOrderItem(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-10 w-10 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary - Enhanced với Discount */}
            {orderItems.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calculator className="h-5 w-5 text-purple-600" />
                    </div>
                    Tổng kết đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Tạm tính</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-600">
                        {orderSummary.subtotalAmount.toLocaleString()}đ
                      </div>
                    </div>

                    {orderSummary.totalDiscount > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Tổng giảm giá</span>
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          -{orderSummary.totalDiscount.toLocaleString()}đ
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Tổng tiền</span>
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {orderSummary.totalAmount.toLocaleString()}đ
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Tổng vốn</span>
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {orderSummary.totalCost.toLocaleString()}đ
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Lợi nhuận</span>
                      </div>
                      <div className={`text-xl font-bold ${orderSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {orderSummary.profit.toLocaleString()}đ
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Còn nợ</span>
                      </div>
                      <div className={`text-xl font-bold ${orderSummary.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {orderSummary.debt.toLocaleString()}đ
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Thanh toán
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="payment-amount" className="text-sm font-medium">Số tiền thanh toán</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="payment-amount"
                            type="number"
                            placeholder="0"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="flex-1 h-10"
                          />
                          <Button
                            variant="outline"
                            onClick={() => setPaymentAmount(orderSummary.totalAmount.toString())}
                            className="px-3 h-10"
                          >
                            Toàn bộ
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="payment-method" className="text-sm font-medium">Phương thức</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="mt-1 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">💵 Tiền mặt</SelectItem>
                            <SelectItem value="transfer">🏦 Chuyển khoản</SelectItem>
                            <SelectItem value="card">💳 Thẻ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notes Section */}
                  <div className="space-y-3">
                    <Label htmlFor="order-notes" className="text-sm font-medium flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Ghi chú đơn hàng
                    </Label>
                    <Textarea
                      id="order-notes"
                      rows={3}
                      placeholder="Ghi chú thêm về đơn hàng..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  {/* Status Preview */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Trạng thái đơn hàng:</div>
                    <Badge
                      variant={
                        orderSummary.debt <= 0 ? "default" :
                          (parseFloat(paymentAmount) || 0) > 0 ? "secondary" :
                            "destructive"
                      }
                      className="text-sm"
                    >
                      {orderSummary.debt <= 0 ? "✅ Hoàn thành" :
                        (parseFloat(paymentAmount) || 0) > 0 ? "⚡ Thanh toán một phần" :
                          "⏳ Chờ thanh toán"}
                    </Badge>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveOrder}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu đơn hàng
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State for Summary */}
            {orderItems.length === 0 && (
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
};

export default SalesPage;