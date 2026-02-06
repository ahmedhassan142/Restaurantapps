// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/order';
import MenuItem from '../../../models/menu';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate menu items and calculate total
    let total = 0;
    const validatedItems = [];
    
    for (const item of body.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.menuItemId}` },
          { status: 400 }
        );
      }
      
      if (!menuItem.isAvailable) {
        return NextResponse.json(
          { error: `Menu item not available: ${menuItem.name}` },
          { status: 400 }
        );
      }
      
      validatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      });
      
      total += menuItem.price * item.quantity;
    }

    const order = new Order({
      customer: body.customer,
      items: validatedItems,
      total: total,
      type: body.type,
      deliveryAddress: body.deliveryAddress,
      specialInstructions: body.specialInstructions
    });

    await order.save();

    // Populate the saved order to return complete data
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name description image')
      .lean();

    return NextResponse.json(
      { 
        message: 'Order placed successfully',
        order: populatedOrder,
        estimatedReadyTime: order.estimatedReadyTime
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');
    
    let query: any = {};
    
    if (orderNumber) {
      query.orderNumber = orderNumber;
    }
    
    if (email) {
      query['customer.email'] = email.toLowerCase();
    }
    
    const orders = await Order.find(query)
      .populate('items.menuItem', 'name description image category')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}