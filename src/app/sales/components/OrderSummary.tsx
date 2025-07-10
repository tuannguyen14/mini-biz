// components/sales/OrderSummary.tsx
import { Calculator, Edit3, Loader2, Package, Percent, Receipt, Save, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { OrderSummary } from '../actions/types';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '@/components/ui/textarea';
import { PaymentSection } from './PaymentSection';
import { StatusBadge } from './StatusBadge';

interface OrderSummaryProps {
  orderSummary: OrderSummary;
  paymentAmount: string;
  paymentMethod: string;
  orderNotes: string;
  onPaymentAmountChange: (amount: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onOrderNotesChange: (notes: string) => void;
  onSaveOrder: () => void;
  loading: boolean;
}

export function OrderSummary({
  orderSummary,
  paymentAmount,
  paymentMethod,
  orderNotes,
  onPaymentAmountChange,
  onPaymentMethodChange,
  onOrderNotesChange,
  onSaveOrder,
  loading
}: OrderSummaryProps) {
  return (
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

        <PaymentSection
          paymentAmount={paymentAmount}
          paymentMethod={paymentMethod}
          onPaymentAmountChange={onPaymentAmountChange}
          onPaymentMethodChange={onPaymentMethodChange}
          totalAmount={orderSummary.totalAmount}
        />

        <Separator />

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
            onChange={(e) => onOrderNotesChange(e.target.value)}
            className="resize-none"
          />
        </div>

        <Separator />

        <StatusBadge debt={orderSummary.debt} paymentAmount={parseFloat(paymentAmount) || 0} />

        <Button
          onClick={onSaveOrder}
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
  );
}