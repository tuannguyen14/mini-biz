// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Update existing order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    console.log('Updating order:', orderId, body)

    const { data, error } = await supabase
      .from('orders')
      .update({
        order_date: body.order_date,
        total_amount: body.total_amount,
        total_cost: body.total_cost,
        paid_amount: body.paid_amount,
        status: body.status,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order', details: error.message },
        { status: 500 }
      )
    }

    console.log('Order updated successfully:', data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in order update API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    console.log('Attempting to delete order:', orderId)

    // First check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single()

    if (checkError) {
      console.error('Error checking order existence:', checkError)
      return NextResponse.json(
        { error: 'Order not found', details: checkError.message },
        { status: 404 }
      )
    }

    if (!existingOrder) {
      console.log('Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('Order found, proceeding with deletion:', existingOrder)

    // Delete order (cascade should handle order_items and payments)
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json(
        { error: 'Failed to delete order', details: error.message },
        { status: 500 }
      )
    }

    console.log('Order deleted successfully:', orderId)
    return NextResponse.json({ 
      success: true, 
      message: 'Order deleted successfully',
      deletedOrderId: orderId 
    })
  } catch (error: any) {
    console.error('Error in order delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Order not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error in order GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}