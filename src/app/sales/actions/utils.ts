// lib/sales/utils.ts
import { OrderItem, OrderSummary } from './types';

export function calculateItemTotals(item: OrderItem) {
  const subtotal = item.quantity * item.unit_price;
  const total_price = subtotal - item.discount;
  const total_cost = item.quantity * item.unit_cost;
  const profit = total_price - total_cost;
  return { subtotal, total_price, total_cost, profit };
}

export function calculateOrderSummary(orderItems: OrderItem[], paymentAmount: string): OrderSummary {
  const subtotalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = orderItems.reduce((sum, item) => sum + item.discount, 0);
  const totalAmount = orderItems.reduce((sum, item) => sum + calculateItemTotals(item).total_price, 0);
  const totalCost = orderItems.reduce((sum, item) => sum + calculateItemTotals(item).total_cost, 0);
  const profit = totalAmount - totalCost;
  const debt = totalAmount - (parseFloat(paymentAmount) || 0);

  return {
    subtotalAmount,
    totalDiscount,
    totalAmount,
    totalCost,
    profit,
    debt
  };
}