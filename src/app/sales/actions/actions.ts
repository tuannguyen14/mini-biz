// lib/sales/actions.ts
'use server';

import { supabase } from '@/lib/supabase';
import { Customer, Product, Material } from './types';
import { OrderItem } from './types';

export async function fetchInitialData() {
  try {
    const [{ data: customersData }, { data: productsData }, { data: materialsData }] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      supabase.from('materials').select('*').order('name')
    ]);

    return {
      customers: customersData || [],
      products: productsData || [],
      materials: materialsData || [],
    };
  } catch (err) {
    console.error('Error fetching data:', err);
    throw new Error('Không thể tải dữ liệu. Vui lòng thử lại.');
  }
}

export async function getLatestCostPrice(itemId: string, itemType: 'product' | 'material') {
  try {
    if (itemType === 'material') {
      const { data } = await supabase
        .from('material_imports')
        .select('unit_price')
        .eq('material_id', itemId)
        .order('import_date', { ascending: false })
        .limit(1);
      return data?.[0]?.unit_price || 0;
    } else {
      return await calculateProductCost(itemId);
    }
  } catch (err) {
    console.error('Error getting cost price:', err);
    return 0;
  }
}

export async function calculateProductCost(productId: string) {
  try {
    const { data } = await supabase
      .rpc('calculate_product_cost', { p_product_id: productId });
    return data || 0;
  } catch (err) {
    console.error('Error calculating product cost:', err);
    return 0;
  }
}

export async function saveOrder({
  customerId,
  orderItems,
  totalAmount,
  totalCost,
  paidAmount,
  orderNotes,
  paymentMethod
}: {
  customerId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  totalCost: number;
  paidAmount: number;
  orderNotes: string;
  paymentMethod: string;
}) {
  try {
    // Determine status based on debt
    let orderStatus = 'pending';
    if (totalAmount - paidAmount <= 0) {
      orderStatus = 'completed';
    } else if (paidAmount > 0) {
      orderStatus = 'partial_paid';
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        total_amount: totalAmount,
        total_cost: totalCost,
        paid_amount: paidAmount,
        notes: orderNotes,
        status: orderStatus
      }])
      .select()
      .single();
    
    if (orderError) throw orderError;

    const orderItemsData = orderItems.map(item => ({
      order_id: orderData.id,
      item_type: item.item_type,
      product_id: item.product_id || null,
      material_id: item.material_id || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      discount: item.discount
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);
    if (itemsError) throw itemsError;

    if (paidAmount > 0) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          order_id: orderData.id,
          amount: paidAmount,
          payment_method: paymentMethod
        }]);
      if (paymentError) throw paymentError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving order:', error);
    throw new Error('Có lỗi xảy ra khi lưu đơn hàng');
  }
}