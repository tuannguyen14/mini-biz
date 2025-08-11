// hooks/useOrderManagement.ts
import { useState, useCallback } from 'react'
import { Order, OrderItem, OrderEditData, OrderDeleteData } from '@/types/customer'
import { toast } from 'react-hot-toast'

export function useOrderManagement() {
  const [loading, setLoading] = useState(false)
  const [showOrderEdit, setShowOrderEdit] = useState(false)
  const [showOrderDelete, setShowOrderDelete] = useState(false)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null)
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null)
  
  const [orderEditData, setOrderEditData] = useState<OrderEditData>({
    orderId: '',
    customerName: '',
    orderDate: '',
    totalAmount: 0,
    totalCost: 0,
    paidAmount: 0,
    status: 'pending',
    notes: ''
  })

  const [orderDeleteData, setOrderDeleteData] = useState<OrderDeleteData | null>(null)

  // Load order items for detailed view
  const loadOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    try {
      const response = await fetch(`/api/orders/${orderId}/items`)
      if (!response.ok) {
        throw new Error('Failed to load order items')
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading order items:', error)
      toast.error('Không thể tải chi tiết đơn hàng')
      return []
    }
  }, [])

  // Handle order edit
  const handleOrderEdit = useCallback(async (order: Order) => {
    setSelectedOrderForEdit(order)
    setOrderEditData({
      orderId: order.id,
      customerName: '', // This should be passed from parent component
      orderDate: new Date(order.order_date).toISOString().slice(0, 16),
      totalAmount: order.total_amount,
      totalCost: order.total_cost,
      paidAmount: order.paid_amount,
      status: order.status,
      notes: order.notes || ''
    })
    setShowOrderEdit(true)
  }, [])

  // Handle order delete
  const handleOrderDelete = useCallback(async (order: Order) => {
    try {
      setLoading(true)
      
      // Load order details for confirmation
      const [itemsResponse, paymentsResponse] = await Promise.all([
        fetch(`/api/orders/${order.id}/items`),
        fetch(`/api/orders/${order.id}/payments`)
      ])
      
      const items = itemsResponse.ok ? await itemsResponse.json() : []
      const payments = paymentsResponse.ok ? await paymentsResponse.json() : []
      
      setOrderDeleteData({
        orderId: order.id,
        customerName: '', // This will be set from parent component
        orderDate: order.order_date,
        totalAmount: order.total_amount,
        hasPayments: payments.length > 0,
        itemCount: items.length
      })
      
      setSelectedOrderForDelete(order)
      setShowOrderDelete(true)
    } catch (error) {
      console.error('Error preparing order deletion:', error)
      toast.error('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  // Submit order edit
  const submitOrderEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderForEdit) return false

    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${selectedOrderForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_date: new Date(orderEditData.orderDate).toISOString(),
          total_amount: orderEditData.totalAmount,
          total_cost: orderEditData.totalCost,
          paid_amount: orderEditData.paidAmount,
          status: orderEditData.status,
          notes: orderEditData.notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      toast.success('Đơn hàng đã được cập nhật thành công!')
      setShowOrderEdit(false)
      setSelectedOrderForEdit(null)
      
      // Trigger refresh of parent component data
      return true
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng')
      return false
    } finally {
      setLoading(false)
    }
  }, [orderEditData, selectedOrderForEdit])

  // Submit order delete
  const submitOrderDelete = useCallback(async () => {
    if (!selectedOrderForDelete) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${selectedOrderForDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      toast.success('Đơn hàng đã được xóa thành công!')
      setShowOrderDelete(false)
      setSelectedOrderForDelete(null)
      setOrderDeleteData(null)
      
      // Trigger refresh of parent component data
      return true
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Có lỗi xảy ra khi xóa đơn hàng')
      return false
    } finally {
      setLoading(false)
    }
  }, [selectedOrderForDelete])

  // Close modals
  const closeOrderEdit = useCallback(() => {
    setShowOrderEdit(false)
    setSelectedOrderForEdit(null)
    setOrderEditData({
      orderId: '',
      customerName: '',
      orderDate: '',
      totalAmount: 0,
      totalCost: 0,
      paidAmount: 0,
      status: 'pending',
      notes: ''
    })
  }, [])

  const closeOrderDelete = useCallback(() => {
    setShowOrderDelete(false)
    setSelectedOrderForDelete(null)
    setOrderDeleteData(null)
  }, [])

  // Update order delete data
  const updateOrderDeleteData = useCallback((data: Partial<OrderDeleteData>) => {
    setOrderDeleteData(prev => prev ? { ...prev, ...data } : null)
  }, [])

  return {
    // State
    loading,
    showOrderEdit,
    showOrderDelete,
    selectedOrderForEdit,
    selectedOrderForDelete,
    orderEditData,
    orderDeleteData,

    // Actions
    setOrderEditData,
    handleOrderEdit,
    handleOrderDelete,
    submitOrderEdit,
    submitOrderDelete,
    closeOrderEdit,
    closeOrderDelete,
    loadOrderItems,
    updateOrderDeleteData
  }
}