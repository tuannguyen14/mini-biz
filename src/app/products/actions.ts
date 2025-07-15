'use server';

import { supabase } from '@/lib/supabase';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchStats() {
  noStore(); // Disable caching for this function
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

    if (overviewError) console.error('Overview error:', overviewError);
    if (ordersError) console.error('Orders error:', ordersError);

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
  noStore(); // Disable caching for this function
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    return [];
  }
}

export async function fetchMaterials() {
  noStore(); // Disable caching for this function
  
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    console.log('Fetched materials:', data, error);
    
    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchMaterials:', error);
    return [];
  }
}

export async function fetchRecentActivities() {
  noStore(); // Disable caching for this function
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      type: 'product_creation',
      product_name: item.name,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error in fetchRecentActivities:', error);
    return [];
  }
}

export async function fetchProductPossibleQuantities() {
  noStore(); // Disable caching for this function
  
  try {
    const { data, error } = await supabase
      .from('product_possible_quantity')
      .select('*')
      .order('product_name');

    if (error) {
      console.error('Error fetching product possible quantities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchProductPossibleQuantities:', error);
    return [];
  }
}

export async function fetchProductDetails(productId: string) {
  noStore(); // Disable caching for this function
  
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    const { data: materials, error: materialsError } = await supabase
      .from('product_materials')
      .select('material_id, quantity_required')
      .eq('product_id', productId);

    if (productError) {
      console.error('Error fetching product details:', productError);
      return null;
    }

    if (materialsError) {
      console.error('Error fetching product materials:', materialsError);
    }

    return {
      ...product,
      materials: materials || []
    };
  } catch (error) {
    console.error('Error in fetchProductDetails:', error);
    return null;
  }
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
  const { error: deleteError } = await supabase
    .from('product_materials')
    .delete()
    .eq('product_id', productId);

  if (deleteError) throw deleteError;

  // Thêm công thức mới
  if (materials.length > 0) {
    const { error: insertError } = await supabase
      .from('product_materials')
      .insert(materials.map(m => ({ ...m, product_id: productId })));

    if (insertError) throw insertError;
  }
}