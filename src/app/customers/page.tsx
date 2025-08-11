'use client'

import { Users } from 'lucide-react'
import { useCustomerManagement } from '@/hooks/useCustomerManagement'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import CustomerSummaryCards from './components/CustomerSummaryCards'
import CustomerSearchBar from './components/CustomerSearchBar'
import CustomerTable from './components/CustomerTable'
import CustomerFormModal from './components/CustomerFormModal'
import PaymentUpdateModal from './components/PaymentUpdateModal'
import DebtEditModal from './components/DebtEditModal'
import CustomerDetailModal from './components/CustomerDetailModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import OrderEditModal from './components/OrderEditModal'
import OrderDeleteModal from './components/OrderDeleteModal'

export default function CustomerManagement() {
  const {
    // State
    customers,
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
    
    // Other functions
    fetchCustomers,
    fetchCustomerOrders
  } = useCustomerManagement()

  const {
    // Order management state
    loading: orderLoading,
    showOrderEdit,
    showOrderDelete,
    selectedOrderForEdit,
    selectedOrderForDelete,
    orderEditData,
    orderDeleteData,

    // Order management actions
    setOrderEditData,
    handleOrderEdit,
    handleOrderDelete,
    submitOrderEdit,
    submitOrderDelete,
    closeOrderEdit,
    closeOrderDelete,
    loadOrderItems,
    updateOrderDeleteData
  } = useOrderManagement()

  // Enhanced order edit handler with customer name
  const handleOrderEditWithCustomer = (order: any) => {
    const customerName = selectedCustomer?.name || 'Unknown Customer'
    handleOrderEdit(order)
    setOrderEditData(prev => ({ ...prev, customerName }))
  }

  // Enhanced order delete handler with customer name
  const handleOrderDeleteWithCustomer = async (order: any) => {
    const customerName = selectedCustomer?.name || 'Unknown Customer'
    await handleOrderDelete(order)
    // Update the customer name in orderDeleteData
    updateOrderDeleteData({ customerName })
  }

  // Handle successful order operations
  const handleOrderEditSuccess = async (e: React.FormEvent) => {
    const success = await submitOrderEdit(e)
    if (success) {
      await fetchCustomers() // Use fetchCustomers instead of refreshCustomers
      // Refresh customer orders if viewing customer detail
      if (selectedCustomer) {
        await fetchCustomerOrders(selectedCustomer.id)
      }
    }
  }

  const handleOrderDeleteSuccess = async () => {
    const success = await submitOrderDelete()
    if (success) {
      await fetchCustomers() // Use fetchCustomers instead of refreshCustomers
      // Refresh customer orders if viewing customer detail
      if (selectedCustomer) {
        await fetchCustomerOrders(selectedCustomer.id)
      }
    }
  }

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
        <CustomerSummaryCards customers={customers} />

        {/* Search & Actions */}
        <CustomerSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddCustomer={() => setShowAddForm(true)}
        />

        {/* Customer Table */}
        <CustomerTable
          customers={customers}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={handleEditCustomer}
          onDebtEdit={handleDebtEdit}
          onDeleteCustomer={handleDeleteConfirm}
        />

        {/* Add Customer Modal */}
        <CustomerFormModal
          isOpen={showAddForm}
          isEdit={false}
          loading={loading}
          formData={formData}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddCustomer}
          onFormDataChange={setFormData}
        />

        {/* Edit Customer Modal */}
        <CustomerFormModal
          isOpen={showEditForm}
          isEdit={true}
          loading={loading}
          formData={formData}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateCustomer}
          onFormDataChange={setFormData}
        />

        {/* Payment Update Modal */}
        <PaymentUpdateModal
          isOpen={showPaymentUpdate}
          loading={paymentLoading}
          selectedOrder={selectedOrder}
          paymentData={paymentData}
          onClose={() => setShowPaymentUpdate(false)}
          onSubmit={handleUpdatePayment}
          onPaymentDataChange={setPaymentData}
        />

        {/* Debt Edit Modal */}
        <DebtEditModal
          isOpen={showDebtEdit}
          loading={debtEditLoading}
          debtEditData={debtEditData}
          onClose={() => setShowDebtEdit(false)}
          onSubmit={handleUpdateDebt}
          onDebtEditDataChange={setDebtEditData}
        />

        {/* Customer Detail Modal - Enhanced with Order Management */}
        <CustomerDetailModal
          isOpen={showCustomerDetail}
          customer={selectedCustomer}
          orders={customerOrders}
          onClose={() => setShowCustomerDetail(false)}
          onOrderPaymentUpdate={handleOrderPaymentUpdate}
          onOrderEdit={handleOrderEditWithCustomer}
          onOrderDelete={handleOrderDeleteWithCustomer}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          loading={deleteLoading}
          customer={customerToDelete}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteCustomer}
        />

        {/* Order Edit Modal */}
        <OrderEditModal
          isOpen={showOrderEdit}
          loading={orderLoading}
          orderEditData={orderEditData}
          onClose={closeOrderEdit}
          onSubmit={handleOrderEditSuccess}
          onOrderEditDataChange={setOrderEditData}
        />

        {/* Order Delete Modal */}
        <OrderDeleteModal
          isOpen={showOrderDelete}
          loading={orderLoading}
          orderDeleteData={orderDeleteData}
          onClose={closeOrderDelete}
          onConfirm={handleOrderDeleteSuccess}
        />
      </div>
    </div>
  )
}