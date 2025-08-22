// lib/sales/actions.ts
'use server';

import { supabase } from '@/lib/supabase';
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
    // Kiểm tra tồn kho trước khi lưu đơn hàng
    for (const item of orderItems) {
      if (item.item_type === 'material') {
        // Kiểm tra tồn kho vật tư
        const { data: material, error } = await supabase
          .from('materials')
          .select('current_stock, name')
          .eq('id', item.material_id)
          .single();

        if (error) throw new Error(`Không thể kiểm tra tồn kho vật tư: ${error.message}`);
        
        if (!material || material.current_stock < item.quantity) {
          throw new Error(`Vật tư "${material?.name || 'Unknown'}" không đủ tồn kho. Hiện có: ${material?.current_stock || 0}, cần: ${item.quantity}`);
        }
      } else if (item.item_type === 'product') {
        // Kiểm tra vật tư cần thiết cho sản phẩm
        const { data: productMaterials, error: bomError } = await supabase
          .from('product_materials')
          .select(`
            quantity_required,
            materials!inner(id, name, current_stock)
          `)
          .eq('product_id', item.product_id);

        if (bomError) throw new Error(`Không thể kiểm tra công thức sản phẩm: ${bomError.message}`);

        if (productMaterials) {
          for (const pm of productMaterials) {
            const requiredQuantity = pm.quantity_required * item.quantity;
            const availableStock = pm.materials?.current_stock || 0;
            
            if (availableStock < requiredQuantity) {
              throw new Error(`Vật tư "${pm.materials?.name || 'Unknown'}" không đủ để sản xuất. Hiện có: ${availableStock}, cần: ${requiredQuantity}`);
            }
          }
        }
      }
    }

    // Determine status based on debt
    let orderStatus = 'pending';
    if (totalAmount - paidAmount <= 0) {
      orderStatus = 'completed';
    } else if (paidAmount > 0) {
      orderStatus = 'partial_paid';
    }

    console.log("orderItems: ", orderItems);

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

    console.log("orderItemsData: ", orderItemsData);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);
    if (itemsError) throw itemsError;

    // Trừ tồn kho sau khi lưu đơn hàng thành công
    // (Trigger trong database sẽ tự động xử lý việc trừ tồn kho)
    // Nhưng chúng ta cần refresh lại dữ liệu tồn kho ở frontend

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
    throw error instanceof Error ? error : new Error('Có lỗi xảy ra khi lưu đơn hàng');
  }
}