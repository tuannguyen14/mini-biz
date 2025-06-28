'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Eye, Phone, DollarSign, TrendingUp, Users, X, Calendar, Package, CreditCard } from 'lucide-react'

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

// Mock data for demo
const mockCustomers: CustomerDebtDetail[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    phone: '0987654321',
    outstanding_debt: 2500000,
    total_revenue: 15000000,
    total_profit: 3000000,
    total_orders: 12,
    unpaid_orders: 2
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    phone: '0976543210',
    outstanding_debt: 1200000,
    total_revenue: 8000000,
    total_profit: 1600000,
    total_orders: 8,
    unpaid_orders: 1
  },
  {
    id: '3',
    name: 'Lê Hoàng Cường',
    phone: '0965432109',
    outstanding_debt: 0,
    total_revenue: 12000000,
    total_profit: 2400000,
    total_orders: 10,
    unpaid_orders: 0
  }
]

const mockOrders: Order[] = [
  {
    id: '1',
    order_date: '2024-06-20',
    total_amount: 1500000,
    total_cost: 1200000,
    profit: 300000,
    paid_amount: 1500000,
    debt_amount: 0,
    status: 'completed',
    notes: null
  },
  {
    id: '2',
    order_date: '2024-06-15',
    total_amount: 2000000,
    total_cost: 1600000,
    profit: 400000,
    paid_amount: 1000000,
    debt_amount: 1000000,
    status: 'pending',
    notes: 'Thanh toán một phần'
  }
]

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerDebtDetail[]>(mockCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    address: ''
  })

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
                <p className="text-xs text-green-600 mt-1">↗ +12.5% so với tháng trước</p>
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
                <p className="text-xs text-green-600 mt-1">↗ +8.3% so với tháng trước</p>
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
                <p className="text-xs text-blue-600 mt-1">↗ +3 khách hàng mới</p>
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
                      <div className={`text-sm font-semibold ${
                        customer.outstanding_debt > 0 ? 'text-red-600' : 'text-gray-900'
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
                        {customerOrders.filter(order => order.status === 'pending').length}
                      </p>
                      <p className="text-sm text-yellow-700">Đang xử lý</p>
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
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 border border-green-200' :
                                order.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {order.status === 'completed' ? 'Hoàn thành' :
                                 order.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
                              </span>
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
    </div>
  )
}