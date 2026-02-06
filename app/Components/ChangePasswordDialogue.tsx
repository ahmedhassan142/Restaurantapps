// components/PaymentMethodsDialog.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Trash2, Plus, Shield, CheckCircle } from 'lucide-react';

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
  const [showAddForm, setShowAddForm] = useState(false); // Changed: Not showing by default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatform>(PaymentPlatform.XPAY);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      // Reset form state
      resetForm();
      setShowAddForm(paymentMethods.length === 0); // Show form if no payment methods
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/payment', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched payment methods:', data);
        setPaymentMethods(data.paymentMethods || []);
        
        // If no payment methods, show add form automatically
        if (data.paymentMethods.length === 0) {
          setShowAddForm(true);
        }
      } else {
        console.error('Failed to fetch payment methods:', res.status);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simple validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      setError('All fields are required');
      return;
    }

    // Validate card number has at least 13 digits
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13) {
      setError('Invalid card number');
      return;
    }

    // Validate expiry date format
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      setError('Expiry date must be in MM/YY format');
      return;
    }

    // Validate CVV
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
        // Refresh payment methods
        await fetchPaymentMethods();
        
        // Reset form but keep it open for adding more
        resetForm();
        // Don't close the form automatically
        // setShowAddForm(false);
        
        // Trigger success callback
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
    setShowAddForm(false);
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

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MC';
      case 'american express': return 'AMEX';
      default: return 'CARD';
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
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Payment Methods</h2>
                <p className="text-blue-100 mt-1">Manage your saved payment methods</p>
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

          {/* Content */}
          <div className="p-6">
            {/* Messages */}
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Your payment information is securely encrypted. We never store your full card number.
                </p>
              </div>
            </div>

            {/* Payment Methods List */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h3>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    aria-label="Add payment method"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </button>
                )}
              </div>

              {loading && paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading payment methods...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No payment methods saved</p>
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                      aria-label="Add payment method"
                    >
                      Add your first payment method
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 ${method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                            <span className="text-xs font-semibold text-gray-700">
                              {getCardBrandIcon(method.brand)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {method.brand} •••• {method.last4}
                            </div>
                            <div className="text-sm text-gray-500">
                              Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {getPlatformName(method.platform)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefault(method.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                              aria-label="Set as default"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            aria-label="Delete payment method"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Payment Method Form */}
            {showAddForm && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Payment Method</h3>
                <form onSubmit={handleAddPaymentMethod}>
                  <div className="space-y-4">
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Platform
                      </label>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value as PaymentPlatform)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        aria-label="Payment platform"
                      >
                        {Object.values(PaymentPlatform).map(platform => (
                          <option key={platform} value={platform}>
                            {getPlatformName(platform)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                        required
                        aria-label="Cardholder name"
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                        aria-label="Card number"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Expiry Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date (MM/YY) *
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                          aria-label="Expiry date"
                        />
                      </div>

                      {/* CVV */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="123"
                          maxLength={4}
                          required
                          aria-label="CVV"
                        />
                      </div>
                    </div>

                    {/* Set as default (only show if there are existing cards) */}
                    {paymentMethods.length > 0 && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="default"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          aria-label="Set as default payment method"
                        />
                        <label htmlFor="default" className="ml-2 text-sm text-gray-700">
                          Set as default payment method
                        </label>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        aria-label="Cancel"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        aria-label="Add payment method"
                      >
                        {loading ? 'Adding...' : 'Add Payment Method'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsDialog;