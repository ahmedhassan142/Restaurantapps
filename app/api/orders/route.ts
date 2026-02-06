import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Order, { IOrder } from '../../../models/order';
import MenuItem from '../../../models/menu';

import { sendOrderConfirmationEmail } from '../../../lib/email';


// GET - Fetch orders (with filters for customers or admin)
// app/api/orders/route.ts - Update GET method
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // Customer lookup (public)
    if (orderNumber) {
      query.orderNumber = orderNumber.toUpperCase();
    }
    
    if (email) {
      query['customer.email'] = email.toLowerCase();
    }
    
    if (phone) {
      query['customer.phone'] = phone.replace(/\D/g, '');
    }
    
    // Admin filters
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const total = await Order.countDocuments(query);
    
    const orders = await Order.find(query)
      .populate('items.menuItem', 'name description image category isVegetarian isSpicy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    return NextResponse.json({ 
      success: true, // IMPORTANT: Add success flag
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { 
        success: false, // IMPORTANT: Add success flag
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new order
// app/api/orders/route.ts - Alternative POST method
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: customer and items are required' 
        },
        { status: 400 }
      );
    }
    
    // Validate customer info
    if (!body.customer.name || !body.customer.email || !body.customer.phone) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Customer name, email, and phone are required' 
        },
        { status: 400 }
      );
    }
    
    // Validate order type
    if (!body.type || !['pickup', 'delivery'].includes(body.type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order type must be "pickup" or "delivery"' 
        },
        { status: 400 }
      );
    }
    
    // Validate delivery address for delivery orders
    if (body.type === 'delivery' && !body.deliveryAddress) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Delivery address is required for delivery orders' 
        },
        { status: 400 }
      );
    }
    
    // Validate payment info
    if (!body.payment || !body.payment.lastFour) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment information is required' 
        },
        { status: 400 }
      );
    }
    
    // Validate menu items and calculate total
    let itemsTotal = 0;
    const validatedItems = [];
    
    for (const item of body.items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Each item must have a menuItemId and quantity (minimum 1)' 
          },
          { status: 400 }
        );
      }
      
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        return NextResponse.json(
          { 
            success: false,
            error: `Menu item not found: ${item.menuItemId}` 
          },
          { status: 400 }
        );
      }
      
      if (!menuItem.isAvailable) {
        return NextResponse.json(
          { 
            success: false,
            error: `Menu item "${menuItem.name}" is currently unavailable` 
          },
          { status: 400 }
        );
      }
      
      // Check stock if applicable
      if (menuItem.stock !== undefined && menuItem.stock < item.quantity) {
        return NextResponse.json(
          { 
            success: false,
            error: `Insufficient stock for "${menuItem.name}". Available: ${menuItem.stock}` 
          },
          { status: 400 }
        );
      }
      
      // Validate quantity limits
      if (item.quantity > 20) {
        return NextResponse.json(
          { 
            success: false,
            error: `Maximum quantity per item is 20 for "${menuItem.name}"` 
          },
          { status: 400 }
        );
      }
      
      validatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions?.substring(0, 200)
      });
      
      itemsTotal += menuItem.price * item.quantity;
      
      // Update stock if applicable
      if (menuItem.stock !== undefined) {
        await MenuItem.findByIdAndUpdate(
          item.menuItemId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }
    }
    
    // Minimum order amount validation
    const MINIMUM_ORDER = 5.00;
    if (itemsTotal < MINIMUM_ORDER) {
      return NextResponse.json(
        { 
          success: false,
          error: `Minimum order amount is $${MINIMUM_ORDER.toFixed(2)}` 
        },
        { status: 400 }
      );
    }
    
    // Calculate delivery fee
    const deliveryFee = body.type === 'delivery' ? 5.00 : 0;
    const total = itemsTotal + deliveryFee;
    
    // GENERATE ORDER NUMBER HERE (before creating the order)
    const latestOrder = await Order.findOne()
      .sort({ createdAt: -1 })
      .exec();
    
    let orderNumber;
    if (latestOrder && latestOrder.orderNumber) {
      // Extract number from orderNumber (e.g., "ORD0015" -> 15)
      const match = latestOrder.orderNumber.match(/\d+/);
      if (match) {
        const nextNumber = parseInt(match[0]) + 1;
        orderNumber = `ORD${nextNumber.toString().padStart(4, '0')}`;
      } else {
        // Fallback if pattern doesn't match
        orderNumber = `ORD${(await Order.countDocuments() + 1).toString().padStart(4, '0')}`;
      }
    } else {
      // First order
      orderNumber = 'ORD0001';
    }
    
    // Set estimated ready time
    const readyMinutes = body.type === 'delivery' ? 45 : 30;
    const estimatedReadyTime = new Date(Date.now() + readyMinutes * 60 * 1000);
    
    // Create order data WITH orderNumber
    const orderData: any = {
      orderNumber: orderNumber,
      customer: {
        name: body.customer.name.trim(),
        email: body.customer.email.toLowerCase().trim(),
        phone: body.customer.phone.replace(/\D/g, '').trim()
      },
      items: validatedItems,
      total: total,
      deliveryFee: deliveryFee,
      type: body.type,
      specialInstructions: body.specialInstructions?.substring(0, 500) || '',
      estimatedReadyTime: estimatedReadyTime,
      payment: {
        method: body.payment.method || 'card',
        lastFour: body.payment.lastFour.slice(-4)
      }
    };
    
    // Add delivery address if applicable
    if (body.type === 'delivery' && body.deliveryAddress) {
      orderData.deliveryAddress = {
        street: body.deliveryAddress.street?.trim() || '',
        city: body.deliveryAddress.city?.trim() || '',
        state: body.deliveryAddress.state?.trim() || '',
        zipCode: body.deliveryAddress.zipCode?.trim() || ''
      };
    }
    
    // Create and save order
    const order = new Order(orderData);
    await order.save();
    
    // Populate order with menu item details
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name description image category isVegetarian isSpicy')
      .lean();
    
    // Send confirmation email
    try {
     
    await sendOrderConfirmationEmail({
    email: order.customer.email, // STRING email
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    items: validatedItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions
    })),
    total: order.total,
    type: order.type,
    estimatedReadyTime: order.estimatedReadyTime!,
    deliveryAddress: order.deliveryAddress,
    specialInstructions: order.specialInstructions
  });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the order if email fails
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Order placed successfully',
        order: populatedOrder,
        orderNumber: order.orderNumber,
        estimatedReadyTime: order.estimatedReadyTime
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false,
          error: errors.join(', ') 
        },
        { status: 400 }
      );
    }
    
    // Duplicate key error (order number)
    if (error.code === 11000) {
      // Generate a new order number and retry
      const retryOrderNumber = `ORD${Date.now().toString().slice(-9)}`;
      // You might want to implement retry logic here
      return NextResponse.json(
        { 
          success: false,
          error: 'Order number conflict. Please try again.' 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update order status (admin only)
export async function PUT(request: NextRequest) {
  try {
    // In production, add authentication here
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    await connectDB();
    
    const body = await request.json();
    const { orderId, status, adminNotes } = body;
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'orderId and status are required' },
        { status: 400 }
      );
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Prevent updating completed or cancelled orders
    if (order.status === 'completed' || order.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot update ${order.status} order` },
        { status: 400 }
      );
    }
    
    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await MenuItem.findByIdAndUpdate(
          item.menuItem,
          { $inc: { stock: item.quantity } }
        );
      }
    }
    
    // Update order status
    order.status = status;
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }
    
    // Update timestamps based on status
    const now = new Date();
    if (status === 'ready') {
      order.readyAt = now;
    } else if (status === 'completed') {
      order.completedAt = now;
    } else if (status === 'cancelled') {
      order.cancelledAt = now;
    }
    
    await order.save();
    
    // Populate updated order
    const updatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name description image')
      .lean();
    
    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel order (customer or admin)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');
    
    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }
    
    let query: any = {};
    if (orderId) {
      query._id = orderId;
    } else {
      query.orderNumber = orderNumber;
    }
    
    // Add email verification for customer cancellation
    if (email) {
      query['customer.email'] = email.toLowerCase();
    }
    
    const order = await Order.findOne(query);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if order can be cancelled
    const cannotCancelStatuses = ['ready', 'completed', 'cancelled'];
    if (cannotCancelStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      );
    }
    
    // Cancel order
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    
    // Restore stock
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(
        item.menuItem,
        { $inc: { stock: item.quantity } }
      );
    }
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      orderNumber: order.orderNumber
    });
    
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}