// components/CustomerDetailModal.tsx
import { X, Phone, DollarSign, TrendingUp, CreditCard, Package, Calendar, MapPin, Clock, User } from 'lucide-react'
import { Customer, Order } from '@/types/customer'
import { formatCurrency, formatDate, getStatusDisplay } from '@/lib/utils'

interface CustomerDetailModalProps {
  isOpen: boolean
  customer: Customer | null
  orders: Order[]
  onClose: () => void
  onOrderPaymentUpdate: (order: Order) => void
}

export default function CustomerDetailModal({
  isOpen,
  customer,
  orders,
  onClose,
  onOrderPaymentUpdate
}: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null

  // Calculate statistics
  const completedOrders = orders.filter(order => order.status === 'completed')
  const partialPaidOrders = orders.filter(order => order.status === 'partial_paid')
  const pendingOrders = orders.filter(order => order.debt_amount > 0)
  const totalOrderValue = orders.reduce((sum, order) => sum + order.total_amount, 0)
  const totalPaidAmount = orders.reduce((sum, order) => sum + order.paid_amount, 0)
  const averageOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{customer.name}</h3>
                <p className="text-blue-100 mt-1">Thông tin chi tiết khách hàng</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Tham gia: {formatDate(customer.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{orders.length} đơn hàng</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Tổng doanh thu
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-1">{formatCurrency(customer.total_revenue)}</p>
              <p className="text-sm text-blue-600">Trung bình: {formatCurrency(averageOrderValue)}/đơn</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Tổng lợi nhuận
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(customer.total_profit)}</p>
              <p className="text-sm text-green-600">
                Margin: {customer.total_revenue > 0 ? ((customer.total_profit / customer.total_revenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  Công nợ hiện tại
                </span>
              </div>
              <p className="text-2xl font-bold text-red-900 mb-1">{formatCurrency(customer.outstanding_debt)}</p>
              <p className="text-sm text-red-600">
                {customer.outstanding_debt > 0 ? 'Cần theo dõi' : 'Đã thanh toán đủ'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Tỷ lệ thanh toán
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mb-1">
                {totalOrderValue > 0 ? ((totalPaidAmount / totalOrderValue) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-purple-600">
                {formatCurrency(totalPaidAmount)} / {formatCurrency(totalOrderValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Enhanced Contact Information */}
            <div className="lg:col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-700" />
                Thông tin cá nhân
              </h4>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Số điện thoại</p>
                    <p className="text-gray-900 font-semibold">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-blue-600 transition-colors">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Địa chỉ</p>
                    <p className="text-gray-900">
                      {customer.address ? (
                        <span>{customer.address}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có thông tin</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Thông tin tài khoản</p>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>Tạo: {formatDate(customer.created_at)}</p>
                      <p>Cập nhật: {formatDate(customer.updated_at)}</p>
                      <p className="text-xs text-gray-500">ID: {customer.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Order Statistics */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-700" />
                Thống kê đơn hàng chi tiết
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                  <div className="p-2 bg-blue-500 rounded-lg mx-auto mb-2 w-fit">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                  <p className="text-sm text-blue-700 font-medium">Tổng đơn hàng</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                  <div className="p-2 bg-green-500 rounded-lg mx-auto mb-2 w-fit">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                  <p className="text-sm text-green-700 font-medium">Đã hoàn thành</p>
                  <p className="text-xs text-green-600 mt-1">
                    {orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors">
                  <div className="p-2 bg-yellow-500 rounded-lg mx-auto mb-2 w-fit">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{partialPaidOrders.length}</p>
                  <p className="text-sm text-yellow-700 font-medium">Trả một phần</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {orders.length > 0 ? ((partialPaidOrders.length / orders.length) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="p-2 bg-red-500 rounded-lg mx-auto mb-2 w-fit">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{pendingOrders.length}</p>
                  <p className="text-sm text-red-700 font-medium">Có công nợ</p>
                  <p className="text-xs text-red-600 mt-1">
                    {orders.length > 0 ? ((pendingOrders.length / orders.length) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Giá trị trung bình/đơn</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(averageOrderValue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tần suất mua hàng</p>
                  <p className="text-lg font-bold text-gray-900">
                    {orders.length > 0 && customer.created_at ? 
                      `${(orders.length / ((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))).toFixed(1)} đơn/tháng` : 
                      'Chưa đủ dữ liệu'
                    }
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Khách hàng từ</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))} ngày
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Order History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-700" />
                Lịch sử đơn hàng ({orders.length})
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Theo dõi tất cả giao dịch và thanh toán của khách hàng
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thông tin đơn hàng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Giá trị
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Lợi nhuận
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, index) => {
                    const statusDisplay = getStatusDisplay(order.status)
                    const paymentProgress = (order.paid_amount / order.total_amount) * 100
                    
                    return (
                      <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(order.order_date)}
                              </p>
                              <p className="text-xs text-gray-500">ID: {order.id.slice(0, 8)}...</p>
                              {order.notes && (
                                <p className="text-xs text-gray-600 italic mt-1" title={order.notes}>
                                  {order.notes.length > 30 ? `${order.notes.slice(0, 30)}...` : order.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.total_amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Chi phí: {formatCurrency(order.total_cost)}
                            </p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Tiến độ</span>
                              <span className="font-semibold">{paymentProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  paymentProgress === 100 ? 'bg-green-500' : 
                                  paymentProgress > 0 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.max(paymentProgress, 5)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600 font-medium">
                                ✓ {formatCurrency(order.paid_amount)}
                              </span>
                              {order.debt_amount > 0 && (
                                <span className="text-red-600 font-medium">
                                  ⚠ {formatCurrency(order.debt_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(order.profit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Margin: {order.total_amount > 0 ? ((order.profit / order.total_amount) * 100).toFixed(1) : 0}%
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${statusDisplay.className}`}>
                            {statusDisplay.text}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          {order.debt_amount > 0 ? (
                            <button
                              onClick={() => onOrderPaymentUpdate(order)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all transform hover:scale-105 shadow-sm"
                              title="Cập nhật thanh toán"
                            >
                              <CreditCard className="h-3 w-3" />
                              Thanh toán
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Hoàn thành
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {orders.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Chưa có đơn hàng nào</p>
                <p className="text-gray-400 text-sm mt-1">
                  Khách hàng này chưa thực hiện giao dịch nào
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}