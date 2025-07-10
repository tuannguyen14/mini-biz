// lib/sales/types.ts
export type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    outstanding_debt?: number;
    [key: string]: any;
  };
  
  export type Product = {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    [key: string]: any;
  };
  
  export type Material = {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    [key: string]: any;
  };
  
  export type OrderItem = {
    id: string;
    item_type: 'product' | 'material';
    product_id?: string;
    material_id?: string;
    name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    discount: number;
    available_stock: number;
  };
  
  export type OrderSummary = {
    subtotalAmount: number;
    totalDiscount: number;
    totalAmount: number;
    totalCost: number;
    profit: number;
    debt: number;
  };
  
  export type PaymentMethod = 'cash' | 'transfer' | 'card';