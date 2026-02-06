// app/api/orders/by-number/[orderNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Order from '../../../../../models/order';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    await connectDB();
    
    console.log('🔍 Fetching order by number:', orderNumber);
    
    // Find order by orderNumber (case-insensitive)
    const order = await Order.findOne({ 
      orderNumber: { $regex: new RegExp(`^${orderNumber}$`, 'i') }
    })
    .populate('items.menuItem', 'name description image category price isVegetarian isSpicy')
    .select('-__v')
    .lean();

    if (!order) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      order 
    });
    
  } catch (error) {
    console.error('Get order by number error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch order' 
      },
      { status: 500 }
    );
  }
}