// components/sales/OrderItemsList.tsx
import { Package, Package2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart } from 'lucide-react';
import { OrderItem } from '../actions/types';
import { calculateItemTotals } from '../actions/utils';

interface OrderItemsListProps {
  orderItems: OrderItem[];
  onUpdateItem: (id: string, field: 'quantity' | 'unit_price' | 'discount', value: string) => void;
  onRemoveItem: (id: string) => void;
}

export function OrderItemsList({ orderItems, onUpdateItem, onRemoveItem }: OrderItemsListProps) {
  if (orderItems.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <ShoppingCart className="h-10 w-10 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Chưa có sản phẩm</h3>
          <p className="text-gray-500">Thêm sản phẩm để bắt đầu tạo đơn hàng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderItems.map((item) => (
        <Card key={item.id} className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.item_type === 'product' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {item.item_type === 'product' ? (
                      <Package className="h-4 w-4 text-green-600" />
                    ) : (
                      <Package2 className="h-4 w-4 text-blue-600" />
                    )}
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
                  onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
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
                  onChange={(e) => onUpdateItem(item.id, 'unit_price', e.target.value)}
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
                  onChange={(e) => onUpdateItem(item.id, 'discount', e.target.value)}
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
                  onClick={() => onRemoveItem(item.id)}
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
  );
}