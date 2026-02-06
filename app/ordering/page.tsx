// app/ordering/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Mail, MapPin, Home, CreditCard, 
  Shield, Lock, ArrowLeft, CheckCircle, Clock, ChefHat ,Plus
} from 'lucide-react';
import { useCart } from '../context/cart';
import { CartItem } from '../../types';

type DeliveryType = 'pickup' | 'delivery';
type CheckoutStep = 'customer' | 'delivery' | 'payment' | 'confirmation';

export default function OrderingPage() {
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    type: 'pickup' as DeliveryType,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: '',
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    saveCard: false,
  });

  useEffect(() => {
    // Redirect to menu if cart is empty
    if (cart.length === 0 && currentStep !== 'confirmation') {
      router.push('/menu');
    }
  }, [cart, currentStep, router]);

  const getDeliveryFee = () => {
    return deliveryInfo.type === 'delivery' ? 5.00 : 0;
  };

  const getTaxAmount = () => {
    return getTotalPrice() * 0.08;
  };

  const getGrandTotal = () => {
    return getTotalPrice() + getDeliveryFee() + getTaxAmount();
  };

  // Form validation helpers
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\D/g, ''));
  };

  const validateCard = (cardNumber: string) => {
    return cardNumber.replace(/\s/g, '').length >= 13;
  };

  // Handle form submissions
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim()) {
      alert('Please enter your full name');
      return;
    }
    
    if (!validateEmail(customerInfo.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (!validatePhone(customerInfo.phone)) {
      alert('Please enter a valid phone number');
      return;
    }
    
    setCurrentStep('delivery');
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deliveryInfo.type === 'delivery') {
      if (!deliveryInfo.address.trim() || !deliveryInfo.city.trim() || !deliveryInfo.zipCode.trim()) {
        alert('Please fill all delivery address details');
        return;
      }
    }
    
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment
    if (!paymentInfo.cardName.trim()) {
      alert('Please enter cardholder name');
      return;
    }
    
    if (!validateCard(paymentInfo.cardNumber)) {
      alert('Please enter a valid card number');
      return;
    }
    
    if (!paymentInfo.expiry || paymentInfo.expiry.length < 5) {
      alert('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (!paymentInfo.cvv || paymentInfo.cvv.length < 3) {
      alert('Please enter a valid CVV');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderData = {
        customer: customerInfo,
        items: cart.map((item:CartItem) => ({
          menuItemId: item.menuItem._id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          specialInstructions: item.specialInstructions
        })),
        delivery: deliveryInfo,
        payment: {
          method: 'card',
          lastFour: paymentInfo.cardNumber.replace(/\s/g, '').slice(-4),
          cardName: paymentInfo.cardName
        },
        totals: {
          subtotal: getTotalPrice(),
          deliveryFee: getDeliveryFee(),
          tax: getTaxAmount(),
          total: getGrandTotal()
        }
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrderNumber(data.orderNumber);
        localStorage.setItem('lastOrderNumber', data.orderNumber);
        localStorage.setItem('lastOrderEmail', customerInfo.email);
        clearCart();
        setCurrentStep('confirmation');
      } else {
        alert(data.error || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === 'delivery') {
      setCurrentStep('customer');
    } else if (currentStep === 'payment') {
      setCurrentStep('delivery');
    }
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
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

  if (cart.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add some delicious items to your cart before proceeding to checkout.
          </p>
          <button
            onClick={() => router.push('/menu')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors w-full"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        {currentStep !== 'customer' && currentStep !== 'confirmation' && (
          <button
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-orange-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        )}

        {/* Checkout Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {['customer', 'delivery', 'payment', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step 
                    ? 'bg-orange-600 border-orange-600 text-white' 
                    : index < ['customer', 'delivery', 'payment', 'confirmation'].indexOf(currentStep)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                  currentStep === step ? 'text-orange-600' : 
                  index < ['customer', 'delivery', 'payment', 'confirmation'].indexOf(currentStep) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    index < ['customer', 'delivery', 'payment', 'confirmation'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Customer Information Step */}
            {currentStep === 'customer' && (
              <form onSubmit={handleCustomerSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Information</h2>
                <p className="text-gray-600 mb-6">Enter your details to continue</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="(123) 456-7890"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-lg"
                >
                  Continue to Delivery
                </button>
              </form>
            )}

            {/* Delivery Options Step */}
            {currentStep === 'delivery' && (
              <form onSubmit={handleDeliverySubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Options</h2>
                <p className="text-gray-600 mb-6">Choose how you'd like to receive your order</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <button
                    type="button"
                    onClick={() => setDeliveryInfo({...deliveryInfo, type: 'pickup'})}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      deliveryInfo.type === 'pickup'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Home className="w-8 h-8 text-orange-600" />
                      {deliveryInfo.type === 'pickup' && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Pickup</h3>
                    <p className="text-sm text-gray-600 mb-3">Pick up your order at our restaurant</p>
                    <div className="flex items-center text-orange-600">
                      <span className="font-bold">Free</span>
                      <span className="text-sm text-gray-500 ml-2">• 15-20 min ready</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setDeliveryInfo({...deliveryInfo, type: 'delivery'})}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      deliveryInfo.type === 'delivery'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <MapPin className="w-8 h-8 text-orange-600" />
                      {deliveryInfo.type === 'delivery' && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                    <p className="text-sm text-gray-600 mb-3">Get your order delivered to your address</p>
                    <div className="flex items-center text-orange-600">
                      <span className="font-bold">$5.00</span>
                      <span className="text-sm text-gray-500 ml-2">• 30-45 min delivery</span>
                    </div>
                  </button>
                </div>

                {/* Delivery Address Form */}
                {deliveryInfo.type === 'delivery' && (
                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Address *
                      </label>
                      <div className="relative">
                        <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={deliveryInfo.address}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="123 Main Street"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={deliveryInfo.city}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <input
                          type="text"
                          value={deliveryInfo.state}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="NY"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        value={deliveryInfo.zipCode}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, zipCode: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={deliveryInfo.instructions}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, instructions: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Any special instructions for your order (allergies, delivery notes, etc.)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-lg"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Secure Payment</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-8">Complete your order with secure payment</p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={paymentInfo.cardName}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formatCardNumber(paymentInfo.cardNumber)}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date (MM/YY) *
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setPaymentInfo({...paymentInfo, expiry: value});
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center space-x-3 mb-8 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={paymentInfo.saveCard}
                    onChange={(e) => setPaymentInfo({...paymentInfo, saveCard: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-5 h-5"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Save card for future purchases</span>
                    <p className="text-sm text-gray-500 mt-1">Your card details will be securely stored</p>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Order...
                    </>
                  ) : (
                    `Pay $${getGrandTotal().toFixed(2)}`
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </form>
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirmation' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Thank you for your order. We'll send a confirmation email to {customerInfo.email}
                </p>
                
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Order Number</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {orderNumber || localStorage.getItem('lastOrderNumber') || 'ORD-123456'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="text-left">
                      <p className="text-gray-500">Order Type</p>
                      <p className="font-semibold text-gray-900">
                        {deliveryInfo.type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Estimated Time</p>
                      <p className="font-semibold text-gray-900">
                        {deliveryInfo.type === 'delivery' ? '30-45 minutes' : '15-20 minutes'}
                      </p>
                    </div>
                  </div>
                  
                  {deliveryInfo.type === 'delivery' ? (
                    <div className="text-left border-t pt-4">
                      <p className="text-gray-500 mb-1">Delivery Address</p>
                      <p className="font-medium text-gray-900">
                        {deliveryInfo.address}, {deliveryInfo.city}, {deliveryInfo.state} {deliveryInfo.zipCode}
                      </p>
                    </div>
                  ) : (
                    <div className="text-left border-t pt-4">
                      <p className="text-gray-500 mb-1">Pickup Location</p>
                      <p className="font-medium text-gray-900">
                        123 Restaurant Street, Food City, FC 10001
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      router.push('/menu');
                    }}
                    className="px-8 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors text-lg"
                  >
                    Order Again
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-lg"
                  >
                    Back to Home
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mt-8 pt-6 border-t">
                  Need help? Call us at (123) 456-7890 or email support@epicurean.com
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                
                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                  {cart.map((item:CartItem) => (
                    <div key={item.menuItem._id} className="flex justify-between items-start pb-4 border-b border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-900">{item.quantity}x</span>
                          <div>
                            <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                            <p className="text-sm text-gray-500">
                              ${parseFloat(item.menuItem.price.toString()).toFixed(2)} each
                            </p>
                          </div>
                        </div>
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Order Totals */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">${getDeliveryFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="font-medium">${getTaxAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t">
                    <span>Total</span>
                    <span className="text-orange-600">${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Add More Items Button */}
                {currentStep !== 'payment' && (
                  <button
                    onClick={() => router.push('/menu')}
                    className="w-full mt-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add More Items
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}