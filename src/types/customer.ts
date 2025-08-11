// types/customer.ts - Extended version
export interface Customer {
  id: string
  name: string
  phone?: string
  address?: string
  total_revenue: number
  total_profit: number
  outstanding_debt: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  order_date: string
  total_amount: number
  total_cost: number
  profit: number
  paid_amount: number
  debt_amount: number
  status: 'pending' | 'partial_paid' | 'completed'
  notes?: string
  created_at: string
  updated_at: string
}

// New OrderItem interface for detailed order items
export interface OrderItem {
  id: string
  order_id: string
  item_type: 'product' | 'material'
  product_id?: string
  material_id?: string
  product_name?: string  // For display purposes
  material_name?: string // For display purposes
  quantity: number
  unit: string
  unit_price: number
  unit_cost: number
  discount: number
  total_price: number
  total_cost: number
  profit: number
  created_at: string
}

export interface CustomerDebtDetail extends Customer {
  total_orders: number
  unpaid_orders: number
}

export interface CustomerFormData {
  name: string
  phone: string
  address: string
}

export interface PaymentUpdateData {
  newPaidAmount: number
  paymentMethod: string
  notes: string
}

export interface DebtEditData {
  customerId: string
  customerName: string
  currentDebt: number
  newDebt: number
  reason: string
  notes: string
}

// New interfaces for order management
export interface OrderEditData {
  orderId: string
  customerName: string
  orderDate: string
  totalAmount: number
  totalCost: number
  paidAmount: number
  status: string
  notes: string
}

export interface OrderDeleteData {
  orderId: string
  customerName: string
  orderDate: string
  totalAmount: number
  hasPayments: boolean
  itemCount: number
}