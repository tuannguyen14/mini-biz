'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Eye, Phone, DollarSign, TrendingUp, Users, X, Calendar, Package, CreditCard, Save, RefreshCw, Trash2 } from 'lucide-react'
import { NumericFormat } from 'react-number-format';

interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  total_revenue: number
  total_profit: number
  outstanding_debt: number
  created_at: string
  updated_at: string
}

interface CustomerDebtDetail {
  id: string
  name: string
  phone: string | null
  outstanding_debt: number
  total_revenue: number
  total_profit: number
  total_orders: number
  unpaid_orders: number
}

interface Order {
  id: string
  order_date: string
  total_amount: number
  total_cost: number
  profit: number
  paid_amount: number
  debt_amount: number
  status: string
  notes: string | null
}

interface CustomerFormData {
  name: string
  phone: string
  address: string
}

interface PaymentUpdateData {
  orderId: string
  newPaidAmount: number
  paymentMethod: string
  notes: string
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerDebtDetail[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    address: ''
  })
  const [paymentData, setPaymentData] = useState<PaymentUpdateData>({
    orderId: '',
    newPaidAmount: 0,
    paymentMethod: 'cash',
    notes: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerDebtDetail | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [showDebtEdit, setShowDebtEdit] = useState(false)
  const [debtEditData, setDebtEditData] = useState({
    customerId: '',
    customerName: '',
    currentDebt: 0,
    newDebt: 0,
    reason: '',
    notes: ''
  })
  const [debtEditLoading, setDebtEditLoading] = useState(false)

  const handleDebtEdit = (customer: CustomerDebtDetail) => {
    setDebtEditData({
      customerId: customer.id,
      customerName: customer.name,
      currentDebt: customer.outstanding_debt,
      newDebt: customer.outstanding_debt,
      reason: '',
      notes: ''
    })
    setShowDebtEdit(true)
  }

  const handleUpdateDebt = async (e: React.FormEvent) => {
    e.preventDefault()

    setDebtEditLoading(true)
    try {
      // Tạo record điều chỉnh công nợ
      const adjustmentAmount = debtEditData.newDebt - debtEditData.currentDebt

      if (adjustmentAmount !== 0) {
        const { error: adjustmentError } = await supabase
          .from('debt_adjustments')
          .insert([{
            customer_id: debtEditData.customerId,
            adjustment_amount: adjustmentAmount,
            reason: debtEditData.reason,
            notes: debtEditData.notes,
            created_by: 'admin' // Có thể thay bằng user hiện tại
          }])

        if (adjustmentError) throw adjustmentError
      }

      // Refresh data
      await fetchCustomers()

      setShowDebtEdit(false)
      setDebtEditData({
        customerId: '',
        customerName: '',
        currentDebt: 0,
        newDebt: 0,
        reason: '',
        notes: ''
      })

      alert('Cập nhật công nợ thành công!')
    } catch (error) {
      console.error('Error updating debt:', error)
      alert('Có lỗi xảy ra khi cập nhật công nợ!')
    } finally {
      setDebtEditLoading(false)
    }
  }

  // Fetch customers with debt details
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_debt_details')
        .select('*')
        .order('outstanding_debt', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch customer orders
  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('order_date', { ascending: false })

      if (error) throw error

      setCustomerOrders(data || [])
    } catch (error) {
      console.error('Error fetching customer orders:', error)
    }
  }

  // Add new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([formData])
        .select()

      if (error) throw error

      setFormData({ name: '', phone: '', address: '' })
      setShowAddForm(false)
      fetchCustomers()
      alert('Thêm khách hàng thành công!')
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Có lỗi xảy ra khi thêm khách hàng!')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id)

      if (error) throw error

      setShowDeleteConfirm(false)
      setCustomerToDelete(null)
      fetchCustomers()
      alert('Xóa khách hàng thành công!')
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Có lỗi xảy ra khi xóa khách hàng!')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Update customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', selectedCustomer.id)

      if (error) throw error

      setShowEditForm(false)
      setSelectedCustomer(null)
      fetchCustomers()
      alert('Cập nhật khách hàng thành công!')
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Có lỗi xảy ra khi cập nhật!')
    } finally {
      setLoading(false)
    }
  }

  // Update payment for order
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setPaymentLoading(true)
    try {
      // Thêm payment record mới
      if (paymentData.newPaidAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            order_id: selectedOrder.id,
            amount: paymentData.newPaidAmount,
            payment_method: paymentData.paymentMethod,
            notes: paymentData.notes || null
          }])

        if (paymentError) throw paymentError
      }

      // Refresh data để có được status mới nhất từ trigger
      if (selectedCustomer) {
        await fetchCustomerOrders(selectedCustomer.id)
        await fetchCustomers()
      }

      setShowPaymentUpdate(false)
      setPaymentData({ orderId: '', newPaidAmount: 0, paymentMethod: 'cash', notes: '' })
      setSelectedOrder(null)

      // Thông báo phù hợp dựa trên tình trạng thanh toán
      const newPaidTotal = selectedOrder.paid_amount + paymentData.newPaidAmount
      const isFullyPaid = newPaidTotal >= selectedOrder.total_amount

      if (isFullyPaid) {
        alert('Thanh toán thành công! Đơn hàng đã hoàn thành.')
      } else {
        alert('Cập nhật thanh toán thành công!')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Có lỗi xảy ra khi cập nhật thanh toán!')
    } finally {
      setPaymentLoading(false)
    }
  }

  // View customer detail
  const handleViewCustomer = async (customer: CustomerDebtDetail) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer.id)
      .single()

    if (error) {
      console.error('Error fetching customer detail:', error)
      return
    }

    setSelectedCustomer(data)
    await fetchCustomerOrders(customer.id)
    setShowCustomerDetail(true)
  }

  // Edit customer
  const handleEditCustomer = (customer: CustomerDebtDetail) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: ''
    })

    // Fetch full customer data for editing
    supabase
      .from('customers')
      .select('*')
      .eq('id', customer.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSelectedCustomer(data)
          setFormData({
            name: data.name,
            phone: data.phone || '',
            address: data.address || ''
          })
        }
      })

    setShowEditForm(true)
  }

  // Handle payment update for order
  const handleOrderPaymentUpdate = (order: Order) => {
    setSelectedOrder(order)
    setPaymentData({
      orderId: order.id,
      newPaidAmount: 0,
      paymentMethod: 'cash',
      notes: ''
    });
    setShowCustomerDetail(false);
    setShowPaymentUpdate(true);
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_revenue, 0)
  const totalProfit = customers.reduce((sum, customer) => sum + customer.total_profit, 0)
  const totalDebt = customers.reduce((sum, customer) => sum + customer.outstanding_debt, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Quản lý Khách hàng & Công nợ
              </h1>
              <p className="text-gray-600 mt-1">Theo dõi và quản lý thông tin khách hàng một cách hiệu quả</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng lợi nhuận</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalProfit)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng công nợ</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                <p className="text-xs text-red-600 mt-1">⚠ Cần theo dõi</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Thêm khách hàng
          </button>
        </div>

        {/* Customer List */}
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
                {filteredCustomers.map((customer, index) => (
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
                      <div className={`text-sm font-semibold ${customer.outstanding_debt > 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
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
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {/* Thêm button sửa công nợ */}
                        <button
                          onClick={() => handleDebtEdit(customer)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                          title="Sửa công nợ"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(customer)
                            setShowDeleteConfirm(true)
                          }}
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
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Thêm khách hàng mới</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nhập địa chỉ khách hàng"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang thêm...' : 'Thêm khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Sửa thông tin khách hàng</h3>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentUpdate && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Cập nhật thanh toán</h3>
                <button
                  onClick={() => setShowPaymentUpdate(false)}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedOrder.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedOrder.status === 'partial_paid'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedOrder.status === 'completed' ? 'Hoàn thành' :
                        selectedOrder.status === 'partial_paid' ? 'Trả một phần' :
                          'Chờ thanh toán'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handleUpdatePayment}>
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
                      onChange={(e) => setPaymentData({ ...paymentData, newPaidAmount: parseFloat(e.target.value) || 0 })}
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
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
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
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Ghi chú về khoản thanh toán này..."
                    />
                  </div>

                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, newPaidAmount: selectedOrder.debt_amount / 2 })}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Trả 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, newPaidAmount: selectedOrder.debt_amount })}
                      className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      Trả hết nợ
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentUpdate(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading || paymentData.newPaidAmount <= 0}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentLoading ? (
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
      )}

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-gray-600">Chi tiết thông tin khách hàng</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Tổng doanh thu</p>
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedCustomer.total_revenue)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-700">Tổng lợi nhuận</p>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(selectedCustomer.total_profit)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-700">Công nợ hiện tại</p>
                    <CreditCard className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(selectedCustomer.outstanding_debt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50/80 p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-700" />
                    Thông tin liên hệ
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Số điện thoại</p>
                      <p className="text-gray-900 font-semibold">{selectedCustomer.phone || 'Chưa có'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Địa chỉ</p>
                      <p className="text-gray-900">{selectedCustomer.address || 'Chưa có'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Ngày tạo</p>
                      <p className="text-gray-900">{formatDate(selectedCustomer.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-700" />
                    Thống kê đơn hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{customerOrders.length}</p>
                      <p className="text-sm text-blue-700">Tổng đơn hàng</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">
                        {customerOrders.filter(order => order.status === 'completed').length}
                      </p>
                      <p className="text-sm text-green-700">Đã hoàn thành</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-xl">
                      <p className="text-2xl font-bold text-yellow-600">
                        {customerOrders.filter(order => order.status === 'partial_paid').length}
                      </p>
                      <p className="text-sm text-yellow-700">Trả một phần</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <p className="text-2xl font-bold text-red-600">
                        {customerOrders.filter(order => order.debt_amount > 0).length}
                      </p>
                      <p className="text-sm text-red-700">Có công nợ</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  Lịch sử đơn hàng
                </h4>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Ngày đặt
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Tổng tiền
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Đã thanh toán
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Còn nợ
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
                        {customerOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                              {formatCurrency(order.paid_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-red-600">
                              {formatCurrency(order.debt_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                              {formatCurrency(order.profit)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${order.status === 'completed'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : order.status === 'partial_paid'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {order.status === 'completed' ? 'Hoàn thành' :
                                  order.status === 'partial_paid' ? 'Trả một phần' :
                                    order.status === 'pending' ? 'Chờ thanh toán' :
                                      'Đã hủy'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {order.debt_amount > 0 && (
                                <button
                                  onClick={() => handleOrderPaymentUpdate(order)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Cập nhật thanh toán"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  Thanh toán
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {customerOrders.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Chưa có đơn hàng nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-red-600">Xác nhận xóa khách hàng</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
                    {customerToDelete.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{customerToDelete.name}</p>
                    <p className="text-sm text-gray-600">{customerToDelete.phone}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tổng doanh thu:</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(customerToDelete.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Số đơn hàng:</p>
                    <p className="font-semibold">{customerToDelete.total_orders}</p>
                  </div>
                </div>

                {customerToDelete.outstanding_debt > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ Khách hàng còn công nợ: {formatCurrency(customerToDelete.outstanding_debt)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
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
      )}

      {/* Debt Edit Modal */}
      {showDebtEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-orange-600">Điều chỉnh công nợ</h3>
                <button
                  onClick={() => setShowDebtEdit(false)}
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
                    <p className="text-sm text-gray-600">Công nợ hiện tại: {formatCurrency(debtEditData.currentDebt)}</p>
                  </div>
                </div>
              </div>

              {/* Debt Edit Form */}
              <form onSubmit={handleUpdateDebt}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Công nợ mới *
                    </label>
                    <NumericFormat
                      value={debtEditData.newDebt || ''}
                      onValueChange={(values) => {
                        setDebtEditData({
                          ...debtEditData,
                          newDebt: values.value ? parseFloat(values.value) : 0, // giá trị thật (không có dấu chấm)
                        });
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
                      onChange={(e) => setDebtEditData({ ...debtEditData, reason: e.target.value })}
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
                      onChange={(e) => setDebtEditData({ ...debtEditData, notes: e.target.value })}
                      placeholder="Nhập ghi chú chi tiết về việc điều chỉnh công nợ..."
                    />
                  </div>

                  {/* Quick adjustment buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDebtEditData({ ...debtEditData, newDebt: 0 })}
                      className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    >
                      Xóa hết nợ
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtEditData({ ...debtEditData, newDebt: debtEditData.currentDebt / 2 })}
                      className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      Giảm 50%
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDebtEdit(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={debtEditLoading || debtEditData.reason === ''}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {debtEditLoading ? (
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
      )}
    </div>
  )
}