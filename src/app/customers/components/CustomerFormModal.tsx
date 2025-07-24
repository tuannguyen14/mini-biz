// components/CustomerFormModal.tsx
import { X } from 'lucide-react'
import { CustomerFormData } from '@/types/customer'

interface CustomerFormModalProps {
  isOpen: boolean
  isEdit: boolean
  loading: boolean
  formData: CustomerFormData
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormDataChange: (data: CustomerFormData) => void
}

export default function CustomerFormModal({
  isOpen,
  isEdit,
  loading,
  formData,
  onClose,
  onSubmit,
  onFormDataChange
}: CustomerFormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {isEdit ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên khách hàng *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="Nhập tên khách hàng"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.phone}
                onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Địa chỉ
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
                value={formData.address}
                onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
                placeholder="Nhập địa chỉ khách hàng"
              />
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
              disabled={loading}
              className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 ${
                isEdit 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {loading 
                ? (isEdit ? 'Đang cập nhật...' : 'Đang thêm...') 
                : (isEdit ? 'Cập nhật' : 'Thêm khách hàng')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}