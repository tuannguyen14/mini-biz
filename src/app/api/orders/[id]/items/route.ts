// app/api/orders/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    console.log('Fetching items for order:', orderId)

    // Fetch order items with product/material details
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        *,
        products:product_id (
          name,
          unit
        ),
        materials:material_id (
          name,
          unit
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching order items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: error.message },
        { status: 500 }
      )
    }

    console.log('Order items fetched:', orderItems?.length || 0, 'items')

    // Transform the data to include product/material names
    const transformedItems = (orderItems || []).map(item => ({
      id: item.id,
      order_id: item.order_id,
      item_type: item.item_type,
      product_id: item.product_id,
      material_id: item.material_id,
      product_name: item.products?.name || null,
      material_name: item.materials?.name || null,
      quantity: item.quantity,
      unit: item.item_type === 'product' ? item.products?.unit : item.materials?.unit,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      discount: item.discount || 0,
      total_price: item.total_price,
      total_cost: item.total_cost,
      profit: item.profit,
      created_at: item.created_at
    }))

    console.log('Transformed items:', transformedItems.length)
    return NextResponse.json(transformedItems)
  } catch (error: any) {
    console.error('Error in order items API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}