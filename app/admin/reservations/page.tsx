'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  Phone, 
  Mail, 
  Filter, 
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react';

interface Reservation {
  _id: string;
  reservationCode: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching reservations...');
      
      let url = '/api/reservation';
      const params = new URLSearchParams();
      
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Reservations API response:', data);
      
      if (data.reservations) {
        setReservations(data.reservations);
      } else {
        setError('No reservations found');
      }
    } catch (error) {
      console.error('❌ Fetch reservations error:', error);
      setError('Failed to load reservations. Please try again.');
      // Load mock data for demo
      setReservations(getMockReservations());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo
  const getMockReservations = (): Reservation[] => {
    return [
      {
        _id: '1',
        reservationCode: 'RES2024001',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '1234567890',
        date: '2024-03-25',
        time: '19:00',
        guests: 4,
        status: 'confirmed',
        specialRequests: 'Window seat preferred',
        createdAt: '2024-03-20T10:30:00Z'
      },
      {
        _id: '2',
        reservationCode: 'RES2024002',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '0987654321',
        date: '2024-03-25',
        time: '20:00',
        guests: 2,
        status: 'pending',
        createdAt: '2024-03-21T14:45:00Z'
      },
      {
        _id: '3',
        reservationCode: 'RES2024003',
        name: 'Michael Brown',
        email: 'michael@example.com',
        phone: '5551234567',
        date: '2024-03-26',
        time: '18:30',
        guests: 6,
        status: 'confirmed',
        specialRequests: 'Celebrating anniversary',
        createdAt: '2024-03-22T09:15:00Z'
      },
      {
        _id: '4',
        reservationCode: 'RES2024004',
        name: 'Emma Wilson',
        email: 'emma@example.com',
        phone: '4449876543',
        date: '2024-03-26',
        time: '19:30',
        guests: 3,
        status: 'cancelled',
        createdAt: '2024-03-23T16:20:00Z'
      },
      {
        _id: '5',
        reservationCode: 'RES2024005',
        name: 'David Miller',
        email: 'david@example.com',
        phone: '3336549872',
        date: '2024-03-27',
        time: '20:00',
        guests: 5,
        status: 'completed',
        specialRequests: 'Allergic to nuts',
        createdAt: '2024-03-24T11:45:00Z'
      }
    ];
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter(reservation => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      reservation.name.toLowerCase().includes(searchLower) ||
      reservation.email.toLowerCase().includes(searchLower) ||
      reservation.phone.includes(search) ||
      reservation.reservationCode.toLowerCase().includes(searchLower);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    // Date filter (already handled in API, but double-check)
    const matchesDate = !dateFilter || reservation.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const updateReservationStatus = async (id: string, newStatus: Reservation['status']) => {
    try {
      const response = await fetch(`/api/reservation/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // Update local state
        setReservations(prev => 
          prev.map(res => 
            res._id === id ? { ...res, status: newStatus } : res
          )
        );
      } else {
        alert('Failed to update reservation status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      alert('Error updating status');
    }
  };

  const exportReservations = () => {
    const csv = [
      ['Reservation Code', 'Name', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Status', 'Special Requests'],
      ...reservations.map(r => [
        r.reservationCode,
        r.name,
        r.email,
        r.phone,
        r.date,
        r.time,
        r.guests.toString(),
        r.status,
        r.specialRequests || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
            <p className="text-gray-600">Manage and view all restaurant reservations</p>
          </div>
          <button
            onClick={fetchReservations}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error} (Showing demo data)</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reservations</p>
              <p className="text-2xl font-bold">{reservations.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">
                {reservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Reservations</p>
              <p className="text-2xl font-bold">
                {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
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
              placeholder="Search reservations by name, email, phone, or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={exportReservations}
              disabled={reservations.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                reservations.length === 0
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

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservation Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filter</p>
                    <button
                      onClick={fetchReservations}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Refresh data
                    </button>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-blue-600">
                        {reservation.reservationCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{reservation.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {reservation.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          {reservation.phone}
                        </div>
                        {reservation.specialRequests && (
                          <div className="text-xs text-gray-600 italic mt-1">
                            Note: {reservation.specialRequests}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">
                        {new Date(reservation.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {reservation.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{reservation.guests}</span>
                        <span className="text-sm text-gray-500">people</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          {reservation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert(`Viewing details for ${reservation.name}`)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => window.location.href = `mailto:${reservation.email}`}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Email
                        </button>
                        <select
                          value={reservation.status}
                          onChange={(e) => updateReservationStatus(reservation._id, e.target.value as Reservation['status'])}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirm</option>
                          <option value="cancelled">Cancel</option>
                          <option value="completed">Complete</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">{filteredReservations.length}</span> of{' '}
          <span className="font-semibold">{reservations.length}</span> reservations
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReservations}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}