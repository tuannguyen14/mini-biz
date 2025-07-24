// components/CustomerTable.tsx
import { Phone, Eye, Edit, CreditCard, Trash2 } from 'lucide-react'
import { CustomerDebtDetail } from '@/types/customer'
import { formatCurrency } from '@/lib/utils'

interface CustomerTableProps {
  customers: CustomerDebtDetail[]
  onViewCustomer: (customer: CustomerDebtDetail) => void
  onEditCustomer: (customer: CustomerDebtDetail) => void
  onDebtEdit: (customer: CustomerDebtDetail) => void
  onDeleteCustomer: (customer: CustomerDebtDetail) => void
}

export default function CustomerTable({
  customers,
  onViewCustomer,
  onEditCustomer,
  onDebtEdit,
  onDeleteCustomer
}: CustomerTableProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-b border-gray-200/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Liên hệ
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Doanh thu
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Lợi nhuận
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Công nợ
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Đơn hàng
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">ID: {customer.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(customer.total_revenue)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(customer.total_profit)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm font-semibold ${customer.outstanding_debt > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(customer.outstanding_debt)}
                  </div>
                  {customer.outstanding_debt > 0 && (
                    <div className="text-xs text-red-500 mt-1">Có công nợ</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">{customer.total_orders}</div>
                  {customer.unpaid_orders > 0 && (
                    <div className="text-xs text-orange-600">
                      {customer.unpaid_orders} chưa thanh toán
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewCustomer(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditCustomer(customer)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDebtEdit(customer)}
                      className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                      title="Sửa công nợ"
                    >
                      <CreditCard className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(customer)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="Xóa khách hàng"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}