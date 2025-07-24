// components/DeleteConfirmModal.tsx
import { X, Trash2, RefreshCw } from 'lucide-react'
import { CustomerDebtDetail } from '@/types/customer'
import { formatCurrency } from '@/lib/utils'

interface DeleteConfirmModalProps {
  isOpen: boolean
  loading: boolean
  customer: CustomerDebtDetail | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({
  isOpen,
  loading,
  customer,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  if (!isOpen || !customer) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-red-600">Xác nhận xóa khách hàng</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Bạn có chắc chắn muốn xóa khách hàng này?
              </p>
              <p className="text-gray-600 mt-1">
                Thao tác này không thể hoàn tác!
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {customer.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.phone}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Tổng doanh thu:</p>
                <p className="font-semibold text-blue-600">{formatCurrency(customer.total_revenue)}</p>
              </div>
              <div>
                <p className="text-gray-600">Số đơn hàng:</p>
                <p className="font-semibold">{customer.total_orders}</p>
              </div>
            </div>

            {customer.outstanding_debt > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Khách hàng còn công nợ: {formatCurrency(customer.outstanding_debt)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Xóa khách hàng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}