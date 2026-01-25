// app/api/admin/customers/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Order from '../../../..//models/order';

export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/admin/customers called - Grouping by email');
  
  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Get all orders
    console.log('📊 Fetching orders from database...');
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .select('orderNumber customer total status type createdAt')
      .lean();

    console.log(`✅ Found ${orders.length} total orders`);

    // Group orders by customer EMAIL ONLY (unique email)
    const customerMap = new Map();

    orders.forEach((order: any) => {
      const customerEmail = order.customer.email.toLowerCase().trim();
      
      if (!customerMap.has(customerEmail)) {
        // First time seeing this customer email
        customerMap.set(customerEmail, {
          _id: customerEmail, // Use email as unique ID
          name: order.customer.name,
          email: customerEmail,
          phone: order.customer.phone,
          totalOrders: 1,
          totalSpent: order.total,
          firstOrder: order.createdAt,
          lastOrder: order.createdAt,
          orders: [{
            _id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
            type: order.type,
            createdAt: order.createdAt
          }]
        });
      } else {
        // Update existing customer (same email)
        const customer = customerMap.get(customerEmail);
        customer.totalOrders += 1;
        customer.totalSpent += order.total;
        
        // Update first/last order dates
        if (new Date(order.createdAt) < new Date(customer.firstOrder)) {
          customer.firstOrder = order.createdAt;
        }
        if (new Date(order.createdAt) > new Date(customer.lastOrder)) {
          customer.lastOrder = order.createdAt;
        }
        
        // Add order to recent orders (limit to 5)
        customer.orders.unshift({
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          type: order.type,
          createdAt: order.createdAt
        });
        
        // Keep only last 5 orders
        if (customer.orders.length > 5) {
          customer.orders = customer.orders.slice(0, 5);
        }
      }
    });

    // Convert map to array
    const customers = Array.from(customerMap.values());
    
    // Sort by total spent (descending)
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    console.log(`✅ Found ${customers.length} unique customers (by email)`);

    // Log sample of customers
    if (customers.length > 0) {
      console.log('📋 Sample customers:', customers.slice(0, 3).map(c => ({
        email: c.email,
        name: c.name,
        orders: c.totalOrders,
        spent: c.totalSpent
      })));
    }

    return NextResponse.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: `Found ${customers.length} unique customers by email`,
      isRealData: true
    });

  } catch (error: any) {
    console.error('❌ GET /api/admin/customers error:', error);
    
    // Return mock data for testing
    console.log('🔄 Returning mock data for testing');
    const mockCustomers = getMockCustomers();
    
    return NextResponse.json({
      success: true,
      customers: mockCustomers,
      count: mockCustomers.length,
      message: 'Using mock data for testing',
      isMock: true,
      error: error.message
    });
  }
}

// Mock data function
function getMockCustomers() {
  return [
    {
      _id: 'john@example.com',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      totalOrders: 5,
      totalSpent: 250.50,
      firstOrder: '2024-01-15T10:30:00.000Z',
      lastOrder: '2024-03-20T14:45:00.000Z',
      orders: [
        {
          _id: 'order1',
          orderNumber: 'ORD0001',
          total: 55.75,
          status: 'completed',
          type: 'delivery',
          createdAt: '2024-03-20T14:45:00.000Z'
        },
        {
          _id: 'order2',
          orderNumber: 'ORD0002',
          total: 45.25,
          status: 'completed',
          type: 'pickup',
          createdAt: '2024-02-15T12:30:00.000Z'
        }
      ]
    },
    {
      _id: 'jane@example.com',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      totalOrders: 3,
      totalSpent: 120.75,
      firstOrder: '2024-02-01T09:15:00.000Z',
      lastOrder: '2024-03-18T18:20:00.000Z',
      orders: [
        {
          _id: 'order3',
          orderNumber: 'ORD0003',
          total: 65.50,
          status: 'preparing',
          type: 'delivery',
          createdAt: '2024-03-18T18:20:00.000Z'
        }
      ]
    },
    {
      _id: 'bob@example.com',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '5551234567',
      totalOrders: 8,
      totalSpent: 420.80,
      firstOrder: '2024-01-05T11:00:00.000Z',
      lastOrder: '2024-03-22T19:30:00.000Z',
      orders: [
        {
          _id: 'order4',
          orderNumber: 'ORD0004',
          total: 85.25,
          status: 'ready',
          type: 'pickup',
          createdAt: '2024-03-22T19:30:00.000Z'
        }
      ]
    }
  ];
}