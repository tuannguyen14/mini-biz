// components/sales/PaymentSection.tsx
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentSectionProps {
  paymentAmount: string;
  paymentMethod: string;
  onPaymentAmountChange: (amount: string) => void;
  onPaymentMethodChange: (method: string) => void;
  totalAmount: number;
}

export function PaymentSection({
  paymentAmount,
  paymentMethod,
  onPaymentAmountChange,
  onPaymentMethodChange,
  totalAmount
}: PaymentSectionProps) {
  return (
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
              onChange={(e) => onPaymentAmountChange(e.target.value)}
              className="flex-1 h-10"
            />
            <Button
              variant="outline"
              onClick={() => onPaymentAmountChange(totalAmount.toString())}
              className="px-3 h-10"
            >
              Toàn bộ
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="payment-method" className="text-sm font-medium">Phương thức</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
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
  );
}