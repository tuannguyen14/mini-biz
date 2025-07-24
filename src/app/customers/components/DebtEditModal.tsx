// components/DebtEditModal.tsx
import { X, Save, RefreshCw } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import { DebtEditData } from '@/types/customer'
import { formatCurrency } from '@/lib/utils'

interface DebtEditModalProps {
  isOpen: boolean
  loading: boolean
  debtEditData: DebtEditData
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onDebtEditDataChange: (data: DebtEditData) => void
}

export default function DebtEditModal({
  isOpen,
  loading,
  debtEditData,
  onClose,
  onSubmit,
  onDebtEditDataChange
}: DebtEditModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-orange-600">Điều chỉnh công nợ</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Thông tin khách hàng</h4>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {debtEditData.customerName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{debtEditData.customerName}</p>
                <p className="text-sm text-gray-600">
                  Công nợ hiện tại: {formatCurrency(debtEditData.currentDebt)}
                </p>
              </div>
            </div>
          </div>

          {/* Debt Edit Form */}
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Công nợ mới *
                </label>
                <NumericFormat
                  value={debtEditData.newDebt || ''}
                  onValueChange={(values) => {
                    onDebtEditDataChange({
                      ...debtEditData,
                      newDebt: values.value ? parseFloat(values.value) : 0,
                    })
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  allowLeadingZeros={false}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Nhập số tiền công nợ mới"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Chênh lệch: {formatCurrency(debtEditData.newDebt - debtEditData.currentDebt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do điều chỉnh *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={debtEditData.reason}
                  onChange={(e) => onDebtEditDataChange({ 
                    ...debtEditData, 
                    reason: e.target.value 
                  })}
                >
                  <option value="">Chọn lý do...</option>
                  <option value="data_migration">Chuyển dữ liệu từ hệ thống cũ</option>
                  <option value="manual_adjustment">Điều chỉnh thủ công</option>
                  <option value="error_correction">Sửa lỗi dữ liệu</option>
                  <option value="settlement">Thương lượng thanh toán</option>
                  <option value="write_off">Xóa nợ</option>
                  <option value="other">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú chi tiết
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={debtEditData.notes}
                  onChange={(e) => onDebtEditDataChange({ 
                    ...debtEditData, 
                    notes: e.target.value 
                  })}
                  placeholder="Nhập ghi chú chi tiết về việc điều chỉnh công nợ..."
                />
              </div>

              {/* Quick adjustment buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onDebtEditDataChange({ 
                    ...debtEditData, 
                    newDebt: 0 
                  })}
                  className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                >
                  Xóa hết nợ
                </button>
                <button
                  type="button"
                  onClick={() => onDebtEditDataChange({ 
                    ...debtEditData, 
                    newDebt: debtEditData.currentDebt / 2 
                  })}
                  className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  Giảm 50%
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
                disabled={loading || debtEditData.reason === ''}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Cập nhật công nợ
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