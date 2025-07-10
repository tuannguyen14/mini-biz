// components/sales/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  debt: number;
  paymentAmount: number;
}

export function StatusBadge({ debt, paymentAmount }: StatusBadgeProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-700 mb-2">Trạng thái đơn hàng:</div>
      <Badge
        variant={
          debt <= 0 ? "default" :
            paymentAmount > 0 ? "secondary" :
              "destructive"
        }
        className="text-sm"
      >
        {debt <= 0 ? "✅ Hoàn thành" :
          paymentAmount > 0 ? "⚡ Thanh toán một phần" :
            "⏳ Chờ thanh toán"}
      </Badge>
    </div>
  );
}