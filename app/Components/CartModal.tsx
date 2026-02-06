// components/CartModal.tsx (UPDATED with multi-platform payment system)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Minus, Plus, Trash2, ShoppingBag, 
  CreditCard, User, Phone, Mail, MapPin, 
  Home, Lock, Calendar, Shield, CheckCircle,
  ArrowLeft, Loader2, Package, Clock, ChevronDown, Wallet
} from 'lucide-react';
import { useCart } from '../context/cart';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  saveCard: boolean;
  platform: string; // 'xpay', 'paypro', 'stripe', etc.
  useSavedCard: boolean;
  savedCardId?: string;
}

interface SavedPaymentMethod {
  id: string;
  platform: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  cardholderName: string;
  isDefault: boolean;
}

export default function CartModal() {
  const router = useRouter();
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    isCartOpen,
    closeCart
  } = useCart();
  
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'customer' | 'payment'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    apartment: '',
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    saveCard: false,
    platform: 'xpay', // Default to XPay
    useSavedCard: false,
  });

  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>(['xpay']);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(true);

  // Calculate totals
  const subtotal = getTotalPrice();
  const deliveryFee = deliveryType === 'delivery' ? 5.00 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  // Load saved payment methods when payment step is reached
  useEffect(() => {
    if (checkoutStep === 'payment') {
      loadSavedPaymentMethods();
    }
  }, [checkoutStep]);

  const loadSavedPaymentMethods = async () => {
    try {
      setLoadingSavedCards(true);
      const response = await fetch('/api/user/payment', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedPaymentMethods(data.paymentMethods || []);
        setAvailablePlatforms(data.platforms ? 
          Object.keys(data.platforms).filter((platform: string) => data.platforms[platform]?.isConfigured) : 
          ['xpay']);
      }
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
    } finally {
      setLoadingSavedCards(false);
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    setCheckoutStep('customer');
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!customerInfo.name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!customerInfo.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    
    if (!customerInfo.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    setCheckoutStep('payment');
    setError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Delivery validation
    if (deliveryType === 'delivery') {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zipCode) {
        setError('Please fill all delivery address fields');
        return;
      }
    }

    // Payment validation based on method
    if (paymentInfo.useSavedCard && paymentInfo.savedCardId) {
      // Using saved card - minimal validation
      const savedCard = savedPaymentMethods.find(card => card.id === paymentInfo.savedCardId);
      if (!savedCard) {
        setError('Selected payment method not found');
        return;
      }
    } else {
      // Using new card - full validation
      if (!paymentInfo.cardName.trim()) {
        setError('Please enter cardholder name');
        return;
      }
      
      if (paymentInfo.cardNumber.replace(/\s/g, '').length < 13) {
        setError('Please enter a valid card number');
        return;
      }
      
      if (!paymentInfo.expiryDate || paymentInfo.expiryDate.length < 5) {
        setError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      
      if (!paymentInfo.cvv || paymentInfo.cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orderData: any = {
        customer: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.toLowerCase().trim(),
          phone: customerInfo.phone.trim(),
        },
        items: cart.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: parseFloat(item.menuItem.price.toString()),
          specialInstructions: item.specialInstructions
        })),
        type: deliveryType,
        specialInstructions: specialInstructions,
        payment: {
          method: 'card',
          platform: paymentInfo.platform,
          useSavedCard: paymentInfo.useSavedCard,
          ...(paymentInfo.useSavedCard && paymentInfo.savedCardId && {
            savedCardId: paymentInfo.savedCardId
          }),
          ...(!paymentInfo.useSavedCard && {
            lastFour: paymentInfo.cardNumber.replace(/\s/g, '').slice(-4),
            cardName: paymentInfo.cardName
          })
        }
      };

      // Add delivery address if delivery type
      if (deliveryType === 'delivery') {
        orderData.deliveryAddress = {
          street: deliveryAddress.street.trim(),
          apartment: deliveryAddress.apartment.trim(),
          city: deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          zipCode: deliveryAddress.zipCode.trim()
        };
      }

      // If using new card and user wants to save it
      if (!paymentInfo.useSavedCard && paymentInfo.saveCard) {
        orderData.savePaymentMethod = {
          cardNumber: paymentInfo.cardNumber.replace(/\s/g, ''),
          expiryDate: paymentInfo.expiryDate,
          cvv: paymentInfo.cvv,
          cardholderName: paymentInfo.cardName,
          platform: paymentInfo.platform,
          isDefault: savedPaymentMethods.length === 0 // Set as default if no other cards
        };
      }

      console.log('Submitting order:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      console.log('Order response:', data);

      if (data.success) {
        // Clear cart
        clearCart();
        
        // Store order info for confirmation page
        localStorage.setItem('lastOrderNumber', data.orderNumber);
        localStorage.setItem('lastOrderEmail', customerInfo.email);
        localStorage.setItem('lastOrderName', customerInfo.name);
        
        // Reset form
        setCheckoutStep('cart');
        setCustomerInfo({ name: '', email: '', phone: '' });
        setDeliveryType('pickup');
        setDeliveryAddress({ street: '', city: '', state: '', zipCode: '', apartment: '' });
        setSpecialInstructions('');
        setPaymentInfo({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardName: '',
          saveCard: false,
          platform: 'xpay',
          useSavedCard: false,
        });
        
        // Close modal and redirect to confirmation
        closeCart();
        router.push(`/ordering/email-check?orderNumber=${data.orderNumber}&email=${encodeURIComponent(customerInfo.email)}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleSelectSavedCard = (cardId: string) => {
    const card = savedPaymentMethods.find(c => c.id === cardId);
    if (card) {
      setPaymentInfo({
        ...paymentInfo,
        useSavedCard: true,
        savedCardId: cardId,
        platform: card.platform,
        cardName: card.cardholderName,
      });
      setShowNewCardForm(false);
    }
  };

  const handleUseNewCard = () => {
    setPaymentInfo({
      ...paymentInfo,
      useSavedCard: false,
      savedCardId: undefined,
    });
    setShowNewCardForm(true);
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'xpay': return 'XPay';
      case 'paypro': return 'PayPro';
      case 'payfast': return 'PayFast';
      case 'jazzcash': return 'JazzCash';
      case 'easypaisa': return 'Easypaisa';
      case 'stripe': return 'Stripe';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  const goBack = () => {
    if (checkoutStep === 'customer') {
      setCheckoutStep('cart');
    } else if (checkoutStep === 'payment') {
      setCheckoutStep('customer');
    }
    setError(null);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeCart}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {checkoutStep === 'cart' ? 'Your Cart' : 
                     checkoutStep === 'customer' ? 'Customer Details' : 
                     'Payment & Delivery'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {checkoutStep === 'cart' ? `${getTotalItems()} items` :
                     checkoutStep === 'customer' ? 'Enter your information' :
                     'Complete your order'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Steps Indicator */}
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center ${checkoutStep === 'cart' ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'cart' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-xs ml-1 hidden sm:inline">Cart</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center ${checkoutStep === 'customer' || checkoutStep === 'payment' ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'customer' || checkoutStep === 'payment' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-xs ml-1 hidden sm:inline">Details</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center ${checkoutStep === 'payment' ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'payment' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className="text-xs ml-1 hidden sm:inline">Payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row h-[calc(90vh-8rem)]">
            {/* Left Content - Main Form */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Cart Items View */}
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-600 mb-6">Add items from the menu to get started</p>
                      <button
                        onClick={() => {
                          closeCart();
                          router.push('/menu');
                        }}
                        className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                      >
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.menuItem._id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-8 h-8 text-orange-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {item.menuItem.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  ${parseFloat(item.menuItem.price.toString()).toFixed(2)} each
                                </p>
                                {item.specialInstructions && (
                                  <p className="text-sm text-gray-600 italic mt-1">
                                    Note: {item.specialInstructions}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold text-gray-900 ml-4">
                                ${(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleQuantityChange(item.menuItem._id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3 text-gray-600" />
                                </button>
                                <span className="font-semibold text-gray-900 w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.menuItem._id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Plus className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.menuItem._id)}
                                className="p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Customer Information Form */}
              {checkoutStep === 'customer' && (
                <form onSubmit={handleCustomerSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="(123) 456-7890"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Order Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          deliveryType === 'pickup'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <Home className="w-5 h-5 mx-auto mb-2" />
                        <div className="font-semibold">Pickup</div>
                        <div className="text-sm mt-1">Free • 15-20 min</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          deliveryType === 'delivery'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <MapPin className="w-5 h-5 mx-auto mb-2" />
                        <div className="font-semibold">Delivery</div>
                        <div className="text-sm mt-1">$5.00 • 30-45 min</div>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Any special requests, allergies, or notes..."
                    />
                  </div>
                </form>
              )}

              {/* Payment & Delivery Form (Combined) */}
              {checkoutStep === 'payment' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-8">
                  {/* Delivery Address Section (for delivery orders) */}
                  {deliveryType === 'delivery' && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      <div className="flex items-center space-x-3 mb-4">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="123 Main Street"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apartment/Suite (Optional)
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.apartment}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, apartment: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Apt 4B"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.city}
                              onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="New York"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress.zipCode}
                              onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="10001"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Information Section */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <Shield className="w-4 h-4" />
                        <span>Secure Payment</span>
                      </div>
                    </div>

                    {/* Platform Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Platform
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availablePlatforms.map(platform => (
                          <button
                            type="button"
                            key={platform}
                            onClick={() => setPaymentInfo({...paymentInfo, platform})}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              paymentInfo.platform === platform
                                ? 'bg-orange-100 border-orange-600 text-orange-700'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center">
                              <Wallet className="w-4 h-4 mr-2" />
                              <span>{getPlatformName(platform)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Currently using: <span className="font-medium">{getPlatformName(paymentInfo.platform)}</span>
                      </p>
                    </div>

                    {/* Saved Payment Methods */}
                    {savedPaymentMethods.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Saved Payment Methods
                          </label>
                          {loadingSavedCards && (
                            <span className="text-sm text-gray-500">Loading...</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {savedPaymentMethods.map((card) => (
                            <div
                              key={card.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                paymentInfo.useSavedCard && paymentInfo.savedCardId === card.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => handleSelectSavedCard(card.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {card.brand} •••• {card.last4}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year.toString().slice(-2)}
                                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                        {getPlatformName(card.platform)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {card.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleUseNewCard}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Use new card
                        </button>
                      </div>
                    )}

                    {/* New Card Form */}
                    {showNewCardForm && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            value={paymentInfo.cardName}
                            onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="John Doe"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            value={formatCardNumber(paymentInfo.cardNumber)}
                            onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date (MM/YY) *
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                setPaymentInfo({...paymentInfo, expiryDate: value});
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
                            <input
                              type="text"
                              value={paymentInfo.cvv}
                              onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="123"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={paymentInfo.saveCard}
                            onChange={(e) => setPaymentInfo({...paymentInfo, saveCard: e.target.checked})}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="saveCard" className="text-sm text-gray-700">
                            Save this card for future purchases
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Right Sidebar - Order Summary */}
            <div className="lg:w-1/3 border-l border-gray-200 lg:h-full overflow-y-auto bg-gray-50">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.menuItem._id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ${parseFloat(item.menuItem.price.toString()).toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Delivery Type */}
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {deliveryType === 'pickup' ? (
                        <>
                          <Home className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-gray-900">Pickup</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-gray-900">Delivery</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm font-semibold">
                      {deliveryType === 'pickup' ? 'FREE' : '$5.00'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {deliveryType === 'pickup' 
                      ? 'Ready in 15-20 minutes' 
                      : 'Delivered in 30-45 minutes'}
                  </p>
                </div>

                {/* Customer Info Preview */}
                {checkoutStep === 'payment' && (
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {customerInfo.name}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {customerInfo.email}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Phone:</span> {customerInfo.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Platform Preview */}
                {checkoutStep === 'payment' && (
                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                    {paymentInfo.useSavedCard ? (
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {savedPaymentMethods.find(c => c.id === paymentInfo.savedCardId)?.brand} •••• 
                            {savedPaymentMethods.find(c => c.id === paymentInfo.savedCardId)?.last4}
                          </p>
                          <p className="text-xs text-gray-500">
                            Via {getPlatformName(paymentInfo.platform)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">New Card</p>
                          <p className="text-xs text-gray-500">
                            Via {getPlatformName(paymentInfo.platform)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Totals */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-300">
                    <span>Total</span>
                    <span className="text-orange-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Estimated Ready Time</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    {deliveryType === 'pickup' ? '15-20 minutes' : '30-45 minutes'}
                  </p>
                </div>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Secure Checkout</span>
                  </div>
                  <p className="text-xs text-green-600">
                    Your payment is protected with 256-bit SSL encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {checkoutStep === 'cart' && cart.length > 0 && (
                <button
                  onClick={handleCheckout}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </button>
              )}
              
              {checkoutStep === 'customer' && (
                <>
                  <button
                    type="submit"
                    onClick={handleCustomerSubmit}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                  <button
                    onClick={goBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Cart
                  </button>
                </>
              )}
              
              {checkoutStep === 'payment' && (
                <>
                  <button
                    type="submit"
                    onClick={handlePaymentSubmit}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </button>
                  <button
                    onClick={goBack}
                    disabled={isProcessing}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Details
                  </button>
                </>
              )}
              
              {checkoutStep === 'cart' && cart.length > 0 && (
                <>
                  <button
                    onClick={clearCart}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      closeCart();
                      router.push('/menu');
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </>
              )}
            </div>
            
            {/* Security Footer */}
            {checkoutStep === 'payment' && (
              <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-xs text-gray-500">
                  Your payment details are encrypted and secure
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}