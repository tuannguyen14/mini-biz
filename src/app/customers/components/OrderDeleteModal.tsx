// components/OrderDeleteModal.tsx
import React, { useState, useEffect } from 'react'
import { X, Trash2, RefreshCw, AlertTriangle, Calendar, DollarSign, Package } from 'lucide-react'
import { OrderDeleteData } from '@/types/customer'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderDeleteModalProps {
  isOpen: boolean
  loading: boolean
  orderDeleteData: OrderDeleteData | null
  onClose: () => void
  onConfirm: () => void
}

export default function OrderDeleteModal({
  isOpen,
  loading,
  orderDeleteData,
  onClose,
  onConfirm
}: OrderDeleteModalProps) {
  const [confirmChecked, setConfirmChecked] = useState(false)

  // Reset checkbox when modal opens - MUST be before any conditional returns
  useEffect(() => {
    if (isOpen) {
      setConfirmChecked(false)
    }
  }, [isOpen])

  // Early return AFTER all hooks
  if (!isOpen || !orderDeleteData) return null

  const handleConfirm = () => {
    if (confirmChecked && !loading) {
      onConfirm()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa đơn hàng
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Warning Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Bạn có chắc chắn muốn xóa đơn hàng này?
              </p>
              <p className="text-gray-600">
                Thao tác này sẽ xóa vĩnh viễn đơn hàng và không thể hoàn tác!
              </p>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Thông tin đơn hàng sẽ bị xóa
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ngày đặt:</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatDate(orderDeleteData.orderDate)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tổng giá trị:</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(orderDeleteData.totalAmount)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Số mặt hàng:</span>
                </div>
                <span className="font-medium text-gray-900">
                  {orderDeleteData.itemCount} món
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Khách hàng:</span>
                <span className="font-medium text-gray-900">
                  {orderDeleteData.customerName}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ID đơn hàng:</span>
                <span className="font-mono text-xs text-gray-500">
                  {orderDeleteData.orderId.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="space-y-3 mb-6">
            {orderDeleteData.hasPayments && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Đơn hàng có lịch sử thanh toán
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Việc xóa đơn hàng này sẽ ảnh hưởng đến báo cáo thanh toán và công nợ khách hàng.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Dữ liệu sẽ bị mất vĩnh viễn
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Tất cả thông tin về đơn hàng, chi tiết sản phẩm, và lịch sử thanh toán sẽ bị xóa khỏi hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  Tôi hiểu rằng thao tác này không thể hoàn tác
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Tôi xác nhận muốn xóa vĩnh viễn đơn hàng này khỏi hệ thống.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmChecked || loading}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Xóa đơn hàng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}