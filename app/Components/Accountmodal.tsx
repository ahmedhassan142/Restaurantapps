// components/AccountModal.tsx - UPDATED SETTINGS TAB
'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Edit, Lock, CreditCard, Package, Settings, LogOut, Bell, Shield, Calendar, Key, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChangePasswordDialog from './ChangePasswordDialogue';
import PaymentMethodsDialog from './PaymentMethodDialogue';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  isEmailVerified: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onSignOut: () => void;
}

const AccountModal = ({ isOpen, onClose, user, onSignOut }: AccountModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    email: user.email || '',
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetchOrders();
    }
    if (isOpen && activeTab === 'settings') {
      fetchPaymentMethods();
    }
  }, [isOpen, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders/user', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/user/payment', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        // Refresh user data
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordDialog(false);
    setMessage({ type: 'success', text: 'Password changed successfully!' });
  };

  const handlePaymentMethodAdded = () => {
    setShowPaymentDialog(false);
    setMessage({ type: 'success', text: 'Payment method updated successfully!' });
    fetchPaymentMethods();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Verification email sent!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </div>
                      {!user.isEmailVerified && (
                        <div className="px-3 py-1 bg-yellow-500 rounded-full text-sm font-medium">
                          Unverified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="px-6 flex space-x-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Profile tab"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'orders'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Orders tab"
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Settings tab"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message.text}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center text-orange-600 hover:text-orange-700 font-medium"
                      aria-label={isEditing ? 'Cancel editing' : 'Edit profile'}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-3 text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                            aria-label="Full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-3 text-gray-400">
                            <Mail className="w-5 h-5" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled={true}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            aria-label="Email address"
                          />
                        </div>
                        {!user.isEmailVerified && (
                          <div className="mt-2 flex items-center">
                            <span className="text-sm text-yellow-600 mr-2">Email not verified</span>
                            <button
                              onClick={handleResendVerification}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              disabled={loading}
                              aria-label="Resend verification email"
                            >
                              Resend verification
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-3 text-gray-400">
                            <Phone className="w-5 h-5" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                            placeholder="+1 (555) 123-4567"
                            aria-label="Phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <div className="pl-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                          placeholder="Enter your delivery address"
                          aria-label="Delivery address"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                          aria-label="Cancel"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                          aria-label="Save changes"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Order History</h3>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                      <button
                        onClick={() => {
                          onClose();
                          router.push('/Menu');
                        }}
                        className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                        aria-label="Browse menu"
                      >
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <span className="font-bold">${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </div>
                              {/* <button
                                onClick={() => {
                                  onClose();
                                  router.push(`/order/${order._id}`);
                                }}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                aria-label="View order details"
                              >
                                View Details
                              </button> */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab - UPDATED */}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Change Password Section */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <Key className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Change Password</h4>
                            <p className="text-sm text-gray-500">Update your account password</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPasswordDialog(true)}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                          aria-label="Change password"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Payment Methods Section */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Payment Methods</h4>
                            <p className="text-sm text-gray-500">Manage your payment methods</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPaymentDialog(true)}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                          aria-label="Manage payment methods"
                        >
                          Manage
                        </button>
                      </div>
                      
                      {/* Display saved payment methods */}
                      {paymentMethods.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm text-gray-600">Saved payment methods:</p>
                          {paymentMethods.map((method, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-2">
                                  <CreditCard className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-sm">
                                  {method.brand} ending in {method.last4}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                Expires {method.exp_month}/{method.exp_year}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sign Out Section */}
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={onSignOut}
                        className="flex items-center text-red-600 hover:text-red-700 font-medium"
                        aria-label="Sign out"
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  aria-label="Close modal"
                >
                  Close
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/admin/dashboard');
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                    aria-label="Go to admin dashboard"
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ChangePasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <PaymentMethodsDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onSuccess={handlePaymentMethodAdded}
      />
    </>
  );
};

export default AccountModal;