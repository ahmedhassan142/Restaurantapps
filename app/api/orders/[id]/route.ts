import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Order from '../../../../models/order';

// GET - Get single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const order = await Order.findById(params.id)
      .populate('items.menuItem', 'name description image category price isVegetarian isSpicy')
      .select('-__v')
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
    
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific order fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Add authentication middleware here in production
    
    await connectDB();
    
    const body = await request.json();
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['specialInstructions', 'pickupTime', 'customer.phone'];
    const updates = Object.keys(body).filter(key => 
      allowedUpdates.some(allowed => key.startsWith(allowed))
    );
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    updates.forEach(key => {
      updateData[key] = body[key];
    });
    
    const order = await Order.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('items.menuItem');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
    
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}