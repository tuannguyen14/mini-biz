'use server';

import { supabase } from '@/lib/supabase';

export async function fetchStats() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data: overview, error: overviewError } = await supabase
      .from('system_overview')
      .select('*')
      .single();

    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .gte('order_date', `${today}T00:00:00`)
      .lt('order_date', `${today}T23:59:59`);

    return {
      totalProducts: overview?.total_products || 0,
      totalMaterials: overview?.total_materials || 0,
      totalMaterialStock: overview?.total_material_stock || 0,
      totalOrdersToday: (todayOrders || []).length
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalProducts: 0,
      totalMaterials: 0,
      totalMaterialStock: 0,
      totalOrdersToday: 0
    };
  }
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  return data || [];
}

export async function fetchMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name');

  return data || [];
}

export async function fetchRecentActivities() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    return (data || []).map(item => ({
      id: item.id,
      type: 'product_creation',
      product_name: item.name,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

export async function fetchProductPossibleQuantities() {
  const { data, error } = await supabase
    .from('product_possible_quantity')
    .select('*')
    .order('product_name');

  return data || [];
}

export async function fetchProductDetails(productId: string) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  const { data: materials, error: materialsError } = await supabase
    .from('product_materials')
    .select('material_id, quantity_required')
    .eq('product_id', productId);

  if (productError || materialsError) {
    console.error('Error fetching product details:', productError || materialsError);
    return null;
  }

  return {
    ...product,
    materials: materials || []
  };
}
export async function updateProduct(
  productId: string,
  updates: { name: string; unit: string }
) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductMaterials(
  productId: string,
  materials: { material_id: string; quantity_required: number }[]
) {
  // Xóa công thức cũ
  await supabase
    .from('product_materials')
    .delete()
    .eq('product_id', productId);

  // Thêm công thức mới
  if (materials.length > 0) {
    const { error } = await supabase
      .from('product_materials')
      .insert(materials.map(m => ({ ...m, product_id: productId })));

    if (error) throw error;
  }
}