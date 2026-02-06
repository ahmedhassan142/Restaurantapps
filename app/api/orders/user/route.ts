// app/api/orders/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Order from '../../../../models/order';
import { verifyToken } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    // Get user's orders by email (since your model stores customer email directly)
    const orders = await Order.find({ 'customer.email': decoded.email })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('items.menuItem', 'name price image description')
      .lean();

    // Transform the orders to match what the frontend expects
    const transformedOrders = orders.map(order => ({
        //@ts-ignore
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.total,
      total: order.total, // Keep both for compatibility
      customer: order.customer,
      items: order.items.map((item: any) => ({
        _id: item._id?.toString(),
        menuItem: item.menuItem ? {
          _id: item.menuItem._id.toString(),
          name: item.menuItem.name,
          price: item.menuItem.price,
          image: item.menuItem.image,
          description: item.menuItem.description
        } : {
          _id: item.menuItem?.toString() || '',
          name: item.name,
          price: item.price
        },
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      type: order.type,
      deliveryFee: order.deliveryFee || 0,
      pickupTime: order.pickupTime,
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.specialInstructions,
      estimatedReadyTime: order.estimatedReadyTime,
      payment: order.payment,
      readyAt: order.readyAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      adminNotes: order.adminNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// If you want to support POST for creating orders (optional)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    
    // Get user info from token or fetch from database
    const userResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        Cookie: `auth-token=${token}`
      }
    });
    
    let userInfo: any = null;
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userInfo = userData.user;
    }

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order must contain at least one item'
      }, { status: 400 });
    }

    if (!body.type || !['pickup', 'delivery'].includes(body.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order type. Must be "pickup" or "delivery"'
      }, { status: 400 });
    }

    // Calculate total
    const itemsTotal = body.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    const deliveryFee = body.type === 'delivery' ? (body.deliveryFee || 5.99) : 0;
    const total = itemsTotal + deliveryFee;

    // Create order data
    const orderData: any = {
      customer: {
        name: body.customer?.name || userInfo?.name || 'Customer',
        email: body.customer?.email || userInfo?.email || decoded.email,
        phone: body.customer?.phone || userInfo?.phone || ''
      },
      items: body.items.map((item: any) => ({
        menuItem: item.menuItemId || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      total: total,
      deliveryFee: deliveryFee,
      type: body.type,
      status: 'pending',
      payment: {
        method: body.payment?.method || 'card',
        lastFour: body.payment?.lastFour || '4242'
      },
      specialInstructions: body.specialInstructions
    };

    // Add delivery address if delivery order
    if (body.type === 'delivery' && body.deliveryAddress) {
      orderData.deliveryAddress = body.deliveryAddress;
    }

    // Add pickup time if pickup order
    if (body.type === 'pickup' && body.pickupTime) {
      orderData.pickupTime = new Date(body.pickupTime);
    }

    // Create order
    const order = new Order(orderData);
    await order.save();

    // Populate menu items for response
    await order.populate('items.menuItem', 'name price image description');

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        customer: order.customer,
        items: order.items.map((item: any) => ({
          _id: item._id.toString(),
          menuItem: item.menuItem ? {
            _id: item.menuItem._id.toString(),
            name: item.menuItem.name,
            price: item.menuItem.price,
            image: item.menuItem.image
          } : {
            _id: item.menuItem?.toString() || '',
            name: item.name,
            price: item.price
          },
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        type: order.type,
        deliveryFee: order.deliveryFee,
        pickupTime: order.pickupTime,
        deliveryAddress: order.deliveryAddress,
        estimatedReadyTime: order.estimatedReadyTime,
        payment: order.payment,
        createdAt: order.createdAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        error: errors.join(', ')
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}