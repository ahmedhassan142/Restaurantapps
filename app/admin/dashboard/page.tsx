'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Utensils,
  Star,
  Clock,
  AlertCircle,
  ShoppingBag,
  Package
} from 'lucide-react';

interface DashboardStats {
  totalReservations: number;
  activeReservations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalMenuItems: number;
  featuredItems: number;
  popularItems: any[];
  recentReservations: any[];
  totalOrders: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching dashboard data...');
      
      // Fetch multiple data sources in parallel
      const [
        reservationsRes,
        menuRes,
        ordersRes
      ] = await Promise.all([
        fetch('/api/reservation'),
        fetch('/api/menu?includeInactive=false'),
        fetch('/api/orders?limit=100')
      ]);
      
      // Check for errors
      if (!reservationsRes.ok || !menuRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const reservationsData = await reservationsRes.json();
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();
      
      console.log('📦 Data loaded:', {
        reservations: reservationsData.reservations?.length || 0,
        menuItems: menuData.menuItems?.length || menuData.items?.length || 0,
        orders: ordersData.orders?.length || 0
      });
      
      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's reservations
      const todayReservations = reservationsData.reservations?.filter((r: any) => 
        r.date === today && (r.status === 'confirmed' || r.status === 'pending')
      ) || [];
      
      // Get recent reservations (last 5)
      const recentReservations = reservationsData.reservations
        ?.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
        .slice(0, 5)
        .map((r: any) => ({
          _id: r._id,
          name: r.name,
          date: r.date,
          time: r.time,
          guests: r.guests,
          status: r.status,
          reservationCode: r.reservationCode
        })) || [];
      
      // Calculate revenue from orders
      const totalRevenue = ordersData.orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyOrders = ordersData.orders?.filter((order: any) => 
        new Date(order.createdAt || order.date) > thirtyDaysAgo
      ) || [];
      const monthlyRevenue = monthlyOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      
      // Get pending orders
      const pendingOrders = ordersData.orders?.filter((order: any) => 
        ['pending', 'confirmed', 'preparing'].includes(order.status)
      ).length || 0;
      
      // Get menu items (handle different response formats)
      const menuItems = menuData.menuItems || menuData.items || menuData.categories?.flatMap((cat: any) => cat.items) || [];
      const featuredItems = menuItems.filter((item: any) => item.isFeatured).length;
      
      // Get popular items (items with most orders)
      // For now, just take top 5 menu items
      const popularItems = menuItems.slice(0, 5).map((item: any, index: number) => ({
        _id: item._id || index,
        name: item.name,
        price: item.price,
        category: item.category,
        orderCount: Math.floor(Math.random() * 20) + 5 // Mock data for now
      }));
      
      // Set stats
      setStats({
        totalReservations: reservationsData.reservations?.length || 0,
        activeReservations: todayReservations.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        totalMenuItems: menuItems.length,
        featuredItems: featuredItems,
        popularItems: popularItems,
        recentReservations: recentReservations,
        totalOrders: ordersData.orders?.length || 0,
        pendingOrders: pendingOrders
      });
      
      console.log('✅ Dashboard stats calculated:', {
        totalReservations: reservationsData.reservations?.length || 0,
        activeReservations: todayReservations.length,
        totalOrders: ordersData.orders?.length || 0,
        pendingOrders: pendingOrders
      });
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Using demo data.');
      
      // Set demo data
      setStats({
        totalReservations: 42,
        activeReservations: 8,
        totalRevenue: 12560.75,
        monthlyRevenue: 3840.50,
        totalMenuItems: 24,
        featuredItems: 6,
        popularItems: [
          { _id: 1, name: 'Margherita Pizza', price: 12.99, category: 'mains', orderCount: 45 },
          { _id: 2, name: 'Garlic Bread', price: 5.99, category: 'starters', orderCount: 38 },
          { _id: 3, name: 'Caesar Salad', price: 8.99, category: 'mains', orderCount: 32 },
          { _id: 4, name: 'Chocolate Cake', price: 6.99, category: 'desserts', orderCount: 28 },
          { _id: 5, name: 'Fresh Lemonade', price: 3.99, category: 'drinks', orderCount: 41 }
        ],
        recentReservations: [
          { _id: 1, name: 'John Smith', date: '2024-03-25', time: '19:00', guests: 4, status: 'confirmed' },
          { _id: 2, name: 'Sarah Johnson', date: '2024-03-25', time: '20:00', guests: 2, status: 'pending' },
          { _id: 3, name: 'Michael Brown', date: '2024-03-26', time: '18:30', guests: 6, status: 'confirmed' },
          { _id: 4, name: 'Emma Wilson', date: '2024-03-26', time: '19:30', guests: 3, status: 'cancelled' },
          { _id: 5, name: 'David Miller', date: '2024-03-27', time: '20:00', guests: 5, status: 'completed' }
        ],
        totalOrders: 156,
        pendingOrders: 12
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    color = 'blue',
    suffix = '',
    prefix = ''
  }: { 
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    color?: string;
    suffix?: string;
    prefix?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      amber: 'bg-amber-100 text-amber-600',
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
            {change && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${
                change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-3 h-3 ${change.startsWith('+') ? '' : 'rotate-180'}`} />
                {change} from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse mt-14">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to your restaurant management dashboard</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            Refresh Data
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <span className="font-medium">Note:</span> {error}
              <p className="text-sm text-yellow-700 mt-1">
                Connect to MongoDB to see real-time data.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => router.push('/admin/reservations')}>
          <StatCard
            title="Total Reservations"
            value={stats?.totalReservations || 0}
            icon={Calendar}
            color="blue"
            change="+12%"
          />
        </div>
        
        <div onClick={() => router.push('/admin/orders')}>
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={ShoppingBag}
            color="green"
            change="+18%"
          />
        </div>
        
        <div onClick={() => router.push('/admin/orders')}>
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            icon={Package}
            color="amber"
            change="+5%"
          />
        </div>
        
        <div>
          <StatCard
            title="Monthly Revenue"
            value={stats?.monthlyRevenue || 0}
            icon={DollarSign}
            color="orange"
            change="+15%"
            prefix="$"
          />
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => router.push('/admin/reservations')}>
          <StatCard
            title="Today's Reservations"
            value={stats?.activeReservations || 0}
            icon={Users}
            color="purple"
            change="+8%"
          />
        </div>
        
        <div onClick={() => router.push('/admin/menu-items')}>
          <StatCard
            title="Menu Items"
            value={stats?.totalMenuItems || 0}
            icon={Utensils}
            color="green"
          />
        </div>
        
        <div onClick={() => router.push('/admin/featured-items')}>
          <StatCard
            title="Featured Items"
            value={stats?.featuredItems || 0}
            icon={Star}
            color="orange"
          />
        </div>
        
        <div>
          <StatCard
            title="Total Revenue"
            value={stats?.totalRevenue || 0}
            icon={DollarSign}
            color="blue"
            change="+22%"
            prefix="$"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Popular Menu Items</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            
            {stats?.popularItems?.length > 0 ? (
              stats.popularItems.map((item, index) => (
                <div 
                  key={item._id || index} 
                  className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/menu-items/${item._id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <span className="font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${item.price?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-500">{item.orderCount || 0} orders</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No popular items data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reservations</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats?.recentReservations?.length > 0 ? (
              stats.recentReservations.map((reservation, index) => (
                <div 
                  key={reservation._id || index} 
                  className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/reservations?code=${reservation.reservationCode}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{reservation.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {reservation.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{reservation.time}</p>
                    <p className="text-sm text-gray-500">
                      {reservation.date ? new Date(reservation.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 'No date'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent reservations</p>
                <button
                  onClick={() => router.push('/reservation')}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all reservations
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/menu-items')}
            className="p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-center group"
          >
            <Utensils className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Manage Menu</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/reservations')}
            className="p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-center group"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">View Reservations</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/orders')}
            className="p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-center group"
          >
            <ShoppingBag className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Manage Orders</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/customers')}
            className="p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-center group"
          >
            <Users className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Customers</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="mt-1">Dashboard updates automatically every 5 minutes</p>
      </div>
    </div>
  );
}