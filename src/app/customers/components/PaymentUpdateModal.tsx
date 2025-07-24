// components/PaymentUpdateModal.tsx
import { X, Save, RefreshCw } from 'lucide-react'
import { Order, PaymentUpdateData } from '@/types/customer'
import { formatCurrency, formatDate, getStatusDisplay } from '@/lib/utils'

interface PaymentUpdateModalProps {
  isOpen: boolean
  loading: boolean
  selectedOrder: Order | null
  paymentData: PaymentUpdateData
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onPaymentDataChange: (data: PaymentUpdateData) => void
}

export default function PaymentUpdateModal({
  isOpen,
  loading,
  selectedOrder,
  paymentData,
  onClose,
  onSubmit,
  onPaymentDataChange
}: PaymentUpdateModalProps) {
  if (!isOpen || !selectedOrder) return null

  const statusDisplay = getStatusDisplay(selectedOrder.status)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Cập nhật thanh toán</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Thông tin đơn hàng</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="font-medium">{formatDate(selectedOrder.order_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã thanh toán:</span>
                <span className="font-semibold text-green-600">{formatCurrency(selectedOrder.paid_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Còn nợ:</span>
                <span className="font-semibold text-red-600">{formatCurrency(selectedOrder.debt_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.className}`}>
                  {statusDisplay.text}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số tiền thanh toán thêm *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedOrder.debt_amount}
                  step="1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={paymentData.newPaidAmount || ''}
                  onChange={(e) => onPaymentDataChange({ 
                    ...paymentData, 
                    newPaidAmount: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="Nhập số tiền"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Tối đa: {formatCurrency(selectedOrder.debt_amount)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phương thức thanh toán
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={paymentData.paymentMethod}
                  onChange={(e) => onPaymentDataChange({ 
                    ...paymentData, 
                    paymentMethod: e.target.value 
                  })}
                >
                  <option value="cash">💵 Tiền mặt</option>
                  <option value="transfer">🏦 Chuyển khoản</option>
                  <option value="card">💳 Thẻ</option>
                  <option value="other">📝 Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={paymentData.notes}
                  onChange={(e) => onPaymentDataChange({ 
                    ...paymentData, 
                    notes: e.target.value 
                  })}
                  placeholder="Ghi chú về khoản thanh toán này..."
                />
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPaymentDataChange({ 
                    ...paymentData, 
                    newPaidAmount: selectedOrder.debt_amount / 2 
                  })}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Trả 50%
                </button>
                <button
                  type="button"
                  onClick={() => onPaymentDataChange({ 
                    ...paymentData, 
                    newPaidAmount: selectedOrder.debt_amount 
                  })}
                  className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  Trả hết nợ
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || paymentData.newPaidAmount <= 0}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Cập nhật thanh toán
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}