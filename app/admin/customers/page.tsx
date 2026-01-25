'use client';

import { useEffect, useState } from 'react';
import React from 'react'
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  type: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  firstOrder: string;
  lastOrder: string;
  orders: Order[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      setIsMockData(false);
      console.log('🔄 Fetching customers...');
      
      // FIXED: Using correct endpoint /api/admin/customers
      const response = await fetch('/api/admin/customers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📦 Customers API response:', {
        success: data.success,
        count: data.count,
        message: data.message,
        isMock: data.isMock,
        isRealData: data.isRealData
      });
      
      if (data.success && data.customers) {
        setCustomers(data.customers);
        if (data.isMock) {
          setIsMockData(true);
          setError('Using demo data. Connect to MongoDB for real customer data.');
        }
        
        // Check for duplicate emails
        const emailSet = new Set();
        const duplicateEmails = data.customers.filter((customer: Customer) => {
          if (emailSet.has(customer.email)) {
            return true;
          }
          emailSet.add(customer.email);
          return false;
        });
        
        if (duplicateEmails.length > 0) {
          console.warn('⚠️ Found duplicate emails:', duplicateEmails.map((c: Customer) => c.email));
        } else {
          console.log('✅ All customers have unique emails');
        }
      } else {
        setError(data.error || 'Failed to fetch customers');
        setCustomers(getMockCustomers());
        setIsMockData(true);
      }
    } catch (error) {
      console.error('❌ Fetch customers error:', error);
      setError('Cannot connect to server. Showing demo data.');
      setCustomers(getMockCustomers());
      setIsMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for testing
  const getMockCustomers = (): Customer[] => {
    return [
      {
        _id: 'john@example.com',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        totalOrders: 5,
        totalSpent: 250.50,
        firstOrder: '2024-01-15T10:30:00Z',
        lastOrder: '2024-03-20T14:45:00Z',
        orders: [
          {
            _id: 'order1',
            orderNumber: 'ORD0001',
            total: 55.75,
            status: 'completed',
            type: 'delivery',
            createdAt: '2024-03-20T14:45:00Z'
          },
          {
            _id: 'order2',
            orderNumber: 'ORD0002',
            total: 45.25,
            status: 'completed',
            type: 'pickup',
            createdAt: '2024-02-15T12:30:00Z'
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
        firstOrder: '2024-02-01T09:15:00Z',
        lastOrder: '2024-03-18T18:20:00Z',
        orders: [
          {
            _id: 'order3',
            orderNumber: 'ORD0003',
            total: 65.50,
            status: 'preparing',
            type: 'delivery',
            createdAt: '2024-03-18T18:20:00Z'
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
        firstOrder: '2024-01-05T11:00:00Z',
        lastOrder: '2024-03-22T19:30:00Z',
        orders: [
          {
            _id: 'order4',
            orderNumber: 'ORD0004',
            total: 85.25,
            status: 'ready',
            type: 'pickup',
            createdAt: '2024-03-22T19:30:00Z'
          }
        ]
      }
    ];
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(search);
    
    // Status filter
    let matchesFilter = true;
    if (filter === 'frequent') {
      matchesFilter = customer.totalOrders >= 5;
    } else if (filter === 'highValue') {
      matchesFilter = customer.totalSpent >= 100;
    } else if (filter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesFilter = new Date(customer.lastOrder) > thirtyDaysAgo;
    }
    
    return matchesSearch && matchesFilter;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'totalOrders') {
      return sortOrder === 'asc'
        ? a.totalOrders - b.totalOrders
        : b.totalOrders - a.totalOrders;
    } else if (sortBy === 'totalSpent') {
      return sortOrder === 'asc'
        ? a.totalSpent - b.totalSpent
        : b.totalSpent - a.totalSpent;
    } else if (sortBy === 'lastOrder') {
      return sortOrder === 'asc'
        ? new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime()
        : new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime();
    }
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportCustomers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'First Order', 'Last Order'],
      ...customers.map(c => [
        c.name,
        c.email,
        c.phone,
        c.totalOrders.toString(),
        `$${c.totalSpent.toFixed(2)}`,
        new Date(c.firstOrder).toLocaleDateString(),
        new Date(c.lastOrder).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Function to check for duplicate emails
  const checkForDuplicates = () => {
    const emailMap = new Map();
    //@ts-ignore
    const duplicates = [];
    
    customers.forEach(customer => {
      if (emailMap.has(customer.email)) {
        duplicates.push(customer.email);
      } else {
        emailMap.set(customer.email, customer);
      }
    });
    //@ts-ignore
    return duplicates;
  };

  const duplicateEmails = checkForDuplicates();

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 mt-14">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage and view customer information</p>
          </div>
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
        
        {isMockData && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <span className="font-medium">Demo Mode:</span> Showing mock customer data
              <p className="text-sm text-yellow-700 mt-1">
                Connect to MongoDB to see real customer data from orders.
              </p>
            </div>
          </div>
        )}
        
        {error && !isMockData && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {duplicateEmails.length > 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Warning: Found {duplicateEmails.length} duplicate emails</p>
            <p className="text-sm mt-1">Emails: {duplicateEmails.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-gray-500 mt-1">Unique emails</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold">
                ${customers.length > 0 
                  ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Repeat Customers</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.totalOrders > 1).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">2+ orders</p>
            </div>
            <User className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Customers</option>
              <option value="frequent">Frequent (5+ orders)</option>
              <option value="highValue">High Value ($100+)</option>
              <option value="recent">Active (Last 30 days)</option>
            </select>
            
            <button
              onClick={exportCustomers}
              disabled={customers.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                customers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => toggleSort('name')}
                  >
                    Customer
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => toggleSort('totalOrders')}
                  >
                    Orders
                    {sortBy === 'totalOrders' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => toggleSort('totalSpent')}
                  >
                    Total Spent
                    {sortBy === 'totalSpent' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => toggleSort('lastOrder')}
                  >
                    Last Order
                    {sortBy === 'lastOrder' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filter</p>
                    <button
                      onClick={fetchCustomers}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Refresh data
                    </button>
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => (
                  <React.Fragment key={customer._id}>
                    {/* Main Customer Row */}
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer border-b"
                      onClick={() => setExpandedCustomer(
                        expandedCustomer === customer._id ? null : customer._id
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              Since {new Date(customer.firstOrder).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {customer.totalOrders}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600">
                          ${customer.totalSpent.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(customer.lastOrder).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(customer.lastOrder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Viewing details for ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nTotal Orders: ${customer.totalOrders}\nTotal Spent: $${customer.totalSpent}`);
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${customer.email}`;
                            }}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Email
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Orders Row */}
                    {expandedCustomer === customer._id && customer.orders && customer.orders.length > 0 && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div className="bg-gray-50 px-6 py-4">
                            <div className="ml-12">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span>Recent Orders</span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {customer.orders.length} of {customer.totalOrders} orders
                                </span>
                              </h4>
                              <div className="overflow-x-auto bg-white rounded-lg border">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {customer.orders.map((order) => (
                                      <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-medium text-blue-600">
                                          {order.orderNumber}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                            order.type === 'delivery' 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {order.type}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2">
                                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                            order.status === 'completed' 
                                              ? 'bg-green-100 text-green-800'
                                              : order.status === 'cancelled'
                                              ? 'bg-red-100 text-red-800'
                                              : order.status === 'ready'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {order.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm font-semibold">
                                          ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2">
                                          <button
                                            onClick={() => window.open(`/admin/orders/${order._id}`, '_blank')}
                                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                          >
                                            View Order
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">{sortedCustomers.length}</span> of{' '}
          <span className="font-semibold">{customers.length}</span> customers
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {error && (
            <button
              onClick={() => {
                setError('');
                fetchCustomers();
              }}
              className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              Retry API
            </button>
          )}
        </div>
      </div>
    </div>
  );
}