// components/OrderEditModal.tsx
import { X, Save, RefreshCw, Calendar, DollarSign, Edit } from 'lucide-react'
import { OrderEditData } from '@/types/customer'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderEditModalProps {
  isOpen: boolean
  loading: boolean
  orderEditData: OrderEditData
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onOrderEditDataChange: (data: OrderEditData) => void
}

export default function OrderEditModal({
  isOpen,
  loading,
  orderEditData,
  onClose,
  onSubmit,
  onOrderEditDataChange
}: OrderEditModalProps) {
  if (!isOpen) return null

  const statusOptions = [
    { value: 'pending', label: '⏳ Chờ thanh toán', color: 'text-yellow-600' },
    { value: 'partial_paid', label: '💰 Trả một phần', color: 'text-orange-600' },
    { value: 'completed', label: '✅ Hoàn thành', color: 'text-green-600' }
  ]

  const calculatedProfit = orderEditData.totalAmount - orderEditData.totalCost
  const remainingDebt = orderEditData.totalAmount - orderEditData.paidAmount
  const paymentPercentage = orderEditData.totalAmount > 0 ? 
    ((orderEditData.paidAmount / orderEditData.totalAmount) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Chỉnh sửa đơn hàng
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Order Info Header */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Thông tin đơn hàng
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Khách hàng:</span>
                  <p className="text-blue-900 font-semibold">{orderEditData.customerName}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">ID đơn hàng:</span>
                  <p className="text-blue-900 font-mono text-xs">{orderEditData.orderId.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Order Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Ngày đặt hàng *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={orderEditData.orderDate}
                  onChange={(e) => onOrderEditDataChange({
                    ...orderEditData,
                    orderDate: e.target.value
                  })}
                />
              </div>

              {/* Financial Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Tổng tiền đơn hàng *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={orderEditData.totalAmount || ''}
                    onChange={(e) => onOrderEditDataChange({
                      ...orderEditData,
                      totalAmount: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nhập theo nghìn VNĐ</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tổng chi phí *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={orderEditData.totalCost || ''}
                    onChange={(e) => onOrderEditDataChange({
                      ...orderEditData,
                      totalCost: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nhập theo nghìn VNĐ</p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số tiền đã thanh toán
                </label>
                <input
                  type="number"
                  min="0"
                  max={orderEditData.totalAmount}
                  step="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={orderEditData.paidAmount || ''}
                  onChange={(e) => onOrderEditDataChange({
                    ...orderEditData,
                    paidAmount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="0"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tối đa: {formatCurrency(orderEditData.totalAmount)}</span>
                  <span className={`font-medium ${paymentPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {paymentPercentage.toFixed(1)}% đã thanh toán
                  </span>
                </div>
                
                {/* Payment Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      paymentPercentage === 100 ? 'bg-green-500' : 
                      paymentPercentage > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(paymentPercentage, 2)}%` }}
                  />
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái đơn hàng *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={orderEditData.status}
                  onChange={(e) => onOrderEditDataChange({
                    ...orderEditData,
                    status: e.target.value
                  })}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú đơn hàng
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={orderEditData.notes}
                  onChange={(e) => onOrderEditDataChange({
                    ...orderEditData,
                    notes: e.target.value
                  })}
                  placeholder="Thêm ghi chú cho đơn hàng này..."
                />
              </div>

              {/* Calculated Values Display */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tính toán tự động
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Lợi nhuận</p>
                    <p className={`text-lg font-bold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculatedProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {orderEditData.totalAmount > 0 ? 
                        `${((calculatedProfit / orderEditData.totalAmount) * 100).toFixed(1)}% margin` : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Còn nợ</p>
                    <p className={`text-lg font-bold ${remainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingDebt)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {remainingDebt > 0 ? 'Chưa thanh toán hết' : 'Đã thanh toán đủ'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Tiến độ</p>
                    <p className="text-lg font-bold text-blue-600">
                      {paymentPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Đã thanh toán
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={loading || orderEditData.totalAmount <= 0}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
          
          {/* Validation hints */}
          {orderEditData.totalAmount <= 0 && (
            <p className="text-xs text-red-600 mt-2 text-center">
              ⚠️ Vui lòng nhập tổng tiền đơn hàng hợp lệ
            </p>
          )}
          {orderEditData.paidAmount > orderEditData.totalAmount && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              ⚠️ Số tiền đã thanh toán không được vượt quá tổng tiền đơn hàng
            </p>
          )}
        </div>
      </div>
    </div>
  )
}