// hooks/useCustomerManagement.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Customer, CustomerDebtDetail, Order, CustomerFormData, PaymentUpdateData, DebtEditData } from '@/types/customer'

export function useCustomerManagement() {
  const [customers, setCustomers] = useState<CustomerDebtDetail[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDebtEdit, setShowDebtEdit] = useState(false)

  // Selected data
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerDebtDetail | null>(null)

  // Loading states
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [debtEditLoading, setDebtEditLoading] = useState(false)

  // Form data
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

  const [debtEditData, setDebtEditData] = useState<DebtEditData>({
    customerId: '',
    customerName: '',
    currentDebt: 0,
    newDebt: 0,
    reason: '',
    notes: ''
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

  // Delete customer
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

  // Update payment for order
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setPaymentLoading(true)
    try {
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

      if (selectedCustomer) {
        await fetchCustomerOrders(selectedCustomer.id)
        await fetchCustomers()
      }

      setShowPaymentUpdate(false)
      setPaymentData({ orderId: '', newPaidAmount: 0, paymentMethod: 'cash', notes: '' })
      setSelectedOrder(null)

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

  // Update debt
  const handleUpdateDebt = async (e: React.FormEvent) => {
    e.preventDefault()

    setDebtEditLoading(true)
    try {
      const adjustmentAmount = debtEditData.newDebt - debtEditData.currentDebt

      if (adjustmentAmount !== 0) {
        const { error: adjustmentError } = await supabase
          .from('debt_adjustments')
          .insert([{
            customer_id: debtEditData.customerId,
            adjustment_amount: adjustmentAmount,
            reason: debtEditData.reason,
            notes: debtEditData.notes,
            created_by: 'admin'
          }])

        if (adjustmentError) throw adjustmentError
      }

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

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  // Action handlers
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

  const handleEditCustomer = (customer: CustomerDebtDetail) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: ''
    })

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

  const handleOrderPaymentUpdate = (order: Order) => {
    setSelectedOrder(order)
    setPaymentData({
      orderId: order.id,
      newPaidAmount: 0,
      paymentMethod: 'cash',
      notes: ''
    })
    setShowCustomerDetail(false)
    setShowPaymentUpdate(true)
  }

  const handleDeleteConfirm = (customer: CustomerDebtDetail) => {
    setCustomerToDelete(customer)
    setShowDeleteConfirm(true)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return {
    // State
    customers: filteredCustomers,
    selectedCustomer,
    customerOrders,
    loading,
    searchTerm,
    
    // Modal states
    showAddForm,
    showEditForm,
    showCustomerDetail,
    showPaymentUpdate,
    showDeleteConfirm,
    showDebtEdit,
    
    // Selected data
    selectedOrder,
    customerToDelete,
    
    // Loading states
    paymentLoading,
    deleteLoading,
    debtEditLoading,
    
    // Form data
    formData,
    paymentData,
    debtEditData,
    
    // Actions
    setSearchTerm,
    setShowAddForm,
    setShowEditForm,
    setShowCustomerDetail,
    setShowPaymentUpdate,
    setShowDeleteConfirm,
    setShowDebtEdit,
    setFormData,
    setPaymentData,
    setDebtEditData,
    
    // Handlers
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleUpdatePayment,
    handleUpdateDebt,
    handleViewCustomer,
    handleEditCustomer,
    handleDebtEdit,
    handleOrderPaymentUpdate,
    handleDeleteConfirm,
    
    // Utils
    fetchCustomers,
    fetchCustomerOrders
  }
}