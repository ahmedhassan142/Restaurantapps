// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/auth';
import Reservation from '../../../../models/reservation';
import MenuItem from '../../../../models/menu';
import Order from '../../../../models/order';
import FeaturedItem from '../../../../models/Featureditem';

export async function GET(request: NextRequest) {
  try {
    // Check authentication using JWT token
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has admin or manager role
    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total reservations
    const totalReservations = await Reservation.countDocuments();

    // Active reservations (today and future)
    const activeReservations = await Reservation.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Revenue calculations
    const monthlyOrders = await Order.find({
      createdAt: { $gte: startOfMonth },
      status: 'completed'
    });
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);

    const lastMonthOrders = await Order.find({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      status: 'completed'
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

    // Menu items count
    const totalMenuItems = await MenuItem.countDocuments({ isAvailable: true });
    const featuredItems = await FeaturedItem.countDocuments({ isActive: true });

    // Popular items (based on order frequency)
    const popularItems = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          orderCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    // Recent reservations
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name guests date time status')
      .lean();

    const stats = {
      totalReservations,
      activeReservations,
      totalRevenue: monthlyRevenue + lastMonthRevenue,
      monthlyRevenue,
      totalMenuItems,
      featuredItems,
      popularItems,
      recentReservations
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}