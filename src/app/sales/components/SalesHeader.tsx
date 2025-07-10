// components/sales/SalesHeader.tsx
import { ShoppingCart } from 'lucide-react';
import { OrderSummary } from '../actions/types';

interface SalesHeaderProps {
  orderItemsCount: number;
  orderSummary: OrderSummary;
}

export function SalesHeader({ orderItemsCount, orderSummary }: SalesHeaderProps) {
  return (
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
              <div className="text-2xl font-bold">{orderItemsCount}</div>
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
  );
}