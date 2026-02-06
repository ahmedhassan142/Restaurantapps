// components/PaymentMethodsDialog.tsx - IMPROVED LAYOUT
'use client';

import { useState, useEffect } from 'react';
import { 
  X, CreditCard, Trash2, Plus, Shield, 
  CheckCircle, Settings, Wallet, Lock, 
  DollarSign, Smartphone, Globe, Info,
  ChevronRight, Home, Key, AlertCircle
} from 'lucide-react';

enum PaymentPlatform {
  XPAY = 'xpay',
  PAYPRO = 'paypro',
  PAYFAST = 'payfast',
  JAZZCASH = 'jazzcash',
  EASYPAISA = 'easypaisa',
  STRIPE = 'stripe',
  OTHER = 'other'
}

interface PaymentMethod {
  id: string;
  platform: PaymentPlatform;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  cardholderName: string;
  isDefault: boolean;
  isActive: boolean;
}

interface PaymentMethodsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethodsDialog = ({ isOpen, onClose, onSuccess }: PaymentMethodsDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSidebar, setActiveSidebar] = useState<'methods' | 'add' | 'info'>('methods');
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatform>(PaymentPlatform.XPAY);

  // Initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      resetForm();
      setActiveSidebar('methods');
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/user/payment', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
        if (data.paymentMethods.length === 0) {
          setActiveSidebar('add'); // Auto-show add form if no methods
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      setError('All fields are required');
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13) {
      setError('Invalid card number');
      return;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      setError('Expiry date must be in MM/YY format');
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setError('CVV must be 3 or 4 digits');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/user/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cardNumber: cleanedCardNumber,
          expiryDate,
          cvv,
          cardholderName,
          isDefault,
          platform: selectedPlatform
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Payment method added successfully!');
        await fetchPaymentMethods();
        resetForm();
        setActiveSidebar('methods'); // Go back to methods view
        onSuccess();
      } else {
        setError(data.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Add payment method error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const res = await fetch(`/api/user/payment/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Payment method deleted successfully');
        fetchPaymentMethods();
      } else {
        setError(data.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Delete payment method error:', error);
      setError('Failed to delete payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/payment/${id}/default`, {
        method: 'PUT',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Default payment method updated');
        fetchPaymentMethods();
      } else {
        setError(data.error || 'Failed to update default payment method');
      }
    } catch (error) {
      console.error('Set default error:', error);
      setError('Failed to update default payment method');
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    setIsDefault(false);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    setActiveSidebar('methods');
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const getPlatformName = (platform: PaymentPlatform) => {
    switch (platform) {
      case PaymentPlatform.XPAY: return 'XPay';
      case PaymentPlatform.PAYPRO: return 'PayPro';
      case PaymentPlatform.PAYFAST: return 'PayFast';
      case PaymentPlatform.JAZZCASH: return 'JazzCash';
      case PaymentPlatform.EASYPAISA: return 'Easypaisa';
      case PaymentPlatform.STRIPE: return 'Stripe';
      default: return 'Other';
    }
  };

  const getPlatformIcon = (platform: PaymentPlatform) => {
    switch (platform) {
      case PaymentPlatform.XPAY: return <Globe className="w-4 h-4" />;
      case PaymentPlatform.PAYPRO: return <DollarSign className="w-4 h-4" />;
      case PaymentPlatform.JAZZCASH: return <Smartphone className="w-4 h-4" />;
      case PaymentPlatform.EASYPAISA: return <Smartphone className="w-4 h-4" />;
      case PaymentPlatform.STRIPE: return <CreditCard className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Dialog with Improved Layout */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '85vh' }}>
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Payment Methods</h2>
                <p className="text-blue-100 mt-1 text-sm">Manage your saved payment methods</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Content Area - Scrollable */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Fixed Width */}
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Payment Menu</h3>
                </div>
                
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveSidebar('methods')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeSidebar === 'methods'
                        ? 'bg-white shadow-sm border border-blue-200 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Saved Cards</span>
                    </div>
                    {paymentMethods.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {paymentMethods.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveSidebar('add')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeSidebar === 'add'
                        ? 'bg-white shadow-sm border border-green-200 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add New</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setActiveSidebar('info')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeSidebar === 'info'
                        ? 'bg-white shadow-sm border border-purple-200 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Info className="w-5 h-5" />
                      <span className="font-medium">Information</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Cards</span>
                    <span className="font-semibold">{paymentMethods.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Default Card</span>
                    <span className="font-semibold text-green-600">
                      {paymentMethods.find(m => m.isDefault) ? 'Set' : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Cards</span>
                    <span className="font-semibold">
                      {paymentMethods.filter(m => m.isActive).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Secure & Encrypted</span>
                </div>
                <p className="text-xs text-blue-800">
                  All payment data is encrypted with 256-bit SSL security.
                </p>
              </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Status Messages - Fixed Position */}
              {(error || success) && (
                <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start">
                    {error ? (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                        {error || success}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Payment Methods View */}
              {activeSidebar === 'methods' && (
                <div className="min-h-full">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Saved Payment Methods</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Manage your saved cards and payment methods
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSidebar('add')}
                      className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Card
                    </button>
                  </div>

                  {loading && paymentMethods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Loading payment methods...</p>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-10 h-10 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods Yet</h4>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        You haven't added any payment methods. Add your first card to make checkout faster.
                      </p>
                      <button
                        onClick={() => setActiveSidebar('add')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                      >
                        Add Your First Payment Method
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-xl p-5 transition-all hover:shadow-md ${
                            method.isDefault 
                              ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-white' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-4">
                                <div className={`w-14 h-9 rounded flex items-center justify-center mr-4 ${
                                  method.brand === 'Visa' ? 'bg-gradient-to-r from-blue-600 to-blue-800' :
                                  method.brand === 'Mastercard' ? 'bg-gradient-to-r from-red-600 to-yellow-500' :
                                  method.brand === 'American Express' ? 'bg-gradient-to-r from-green-600 to-blue-600' :
                                  'bg-gradient-to-r from-gray-700 to-gray-900'
                                }`}>
                                  <span className="text-xs font-bold text-white">
                                    {method.brand === 'Visa' ? 'VISA' : 
                                     method.brand === 'Mastercard' ? 'MC' : 
                                     method.brand === 'American Express' ? 'AMEX' : 'CARD'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <h4 className="font-bold text-gray-900 text-lg">
                                      •••• {method.last4}
                                    </h4>
                                    {method.isDefault && (
                                      <span className="ml-3 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {method.cardholderName}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-600">
                                    Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <div className="flex items-center space-x-1">
                                    {getPlatformIcon(method.platform)}
                                    <span className="text-gray-700 font-medium">
                                      {getPlatformName(method.platform)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                  {!method.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(method.id)}
                                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                                    >
                                      Set as Default
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    className="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add New Payment Method Form */}
              {activeSidebar === 'add' && (
                <div className="min-h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Add New Payment Method</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Securely add a new card to your account
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSidebar('methods')}
                      className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                      Back to Cards
                    </button>
                  </div>

                  <div className="max-w-2xl">
                    <form onSubmit={handleAddPaymentMethod} className="space-y-6">
                      {/* Platform Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Payment Platform
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.values(PaymentPlatform).map(platform => (
                            <button
                              type="button"
                              key={platform}
                              onClick={() => setSelectedPlatform(platform)}
                              className={`p-4 border rounded-xl text-center transition-all ${
                                selectedPlatform === platform
                                  ? 'border-blue-500 bg-blue-50 shadow-sm text-blue-700'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                  {getPlatformIcon(platform)}
                                </div>
                                <span className="text-sm font-medium">
                                  {getPlatformName(platform)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-6">Card Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Cardholder Name */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cardholder Name *
                            </label>
                            <input
                              type="text"
                              value={cardholderName}
                              onChange={(e) => setCardholderName(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          {/* Card Number */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Card Number *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                required
                              />
                              <CreditCard className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                            </div>
                          </div>

                          {/* Expiry Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date (MM/YY) *
                            </label>
                            <input
                              type="text"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              placeholder="MM/YY"
                              maxLength={5}
                              required
                            />
                          </div>

                          {/* CVV */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV *
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="123"
                                maxLength={4}
                                required
                              />
                              <Key className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Set as default */}
                        {paymentMethods.length > 0 && (
                          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="default"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="default" className="ml-3 text-gray-700 font-medium">
                                Set as default payment method
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Security Note */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <Lock className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">Secure Submission</p>
                              <p className="text-xs text-blue-800">
                                Your card details are encrypted and never stored on our servers. 
                                We use industry-standard security protocols.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Fixed at bottom of content */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setActiveSidebar('methods')}
                            className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              'Add Payment Method'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Information View */}
              {activeSidebar === 'info' && (
                <div className="min-h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Payment Information</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Learn about payment security and features
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSidebar('methods')}
                      className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                      Back to Cards
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <h4 className="text-lg font-semibold text-blue-900">Security Features</h4>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">256-bit SSL encryption for all data</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">PCI DSS compliant payment processing</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">No full card numbers stored on servers</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">Regular security audits and monitoring</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <CreditCard className="w-6 h-6 text-green-600" />
                        <h4 className="text-lg font-semibold text-green-900">Supported Cards</h4>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded mr-3 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">VISA</span>
                          </div>
                          <span className="text-green-800">Visa Credit & Debit Cards</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-6 bg-gradient-to-r from-red-600 to-yellow-500 rounded mr-3 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">MC</span>
                          </div>
                          <span className="text-green-800">Mastercard</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-6 bg-gradient-to-r from-green-600 to-blue-600 rounded mr-3 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">AMEX</span>
                          </div>
                          <span className="text-green-800">American Express</span>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Info className="w-6 h-6 text-purple-600" />
                        <h4 className="text-lg font-semibold text-purple-900">Payment Platform Support</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.values(PaymentPlatform).map(platform => (
                          <div key={platform} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            {getPlatformIcon(platform)}
                            <div>
                              <p className="font-medium text-gray-900">{getPlatformName(platform)}</p>
                              <p className="text-xs text-gray-500">
                                {platform === PaymentPlatform.XPAY || platform === PaymentPlatform.PAYPRO 
                                  ? 'Online Payments' 
                                  : platform === PaymentPlatform.JAZZCASH || platform === PaymentPlatform.EASYPAISA
                                  ? 'Mobile Wallet'
                                  : 'Payment Gateway'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Always Visible */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Encrypted Data</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {activeSidebar === 'methods' && `${paymentMethods.length} saved cards`}
                {activeSidebar === 'add' && 'Add new payment method'}
                {activeSidebar === 'info' && 'Payment information'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsDialog;