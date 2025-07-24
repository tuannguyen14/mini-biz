// types/customer.ts
export interface Customer {
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
  
  export interface CustomerDebtDetail {
    id: string
    name: string
    phone: string | null
    outstanding_debt: number
    total_revenue: number
    total_profit: number
    total_orders: number
    unpaid_orders: number
  }
  
  export interface Order {
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
  
  export interface CustomerFormData {
    name: string
    phone: string
    address: string
  }
  
  export interface PaymentUpdateData {
    orderId: string
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