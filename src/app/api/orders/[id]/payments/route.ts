import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// app/api/orders/[id]/payments/route.ts - Get order payments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: orderId } = await params
  
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false })
  
      if (error) {
        console.error('Error fetching payments:', error)
        return NextResponse.json(
          { error: 'Failed to fetch payments' },
          { status: 500 }
        )
      }
  
      return NextResponse.json(payments)
    } catch (error) {
      console.error('Error in payments API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }