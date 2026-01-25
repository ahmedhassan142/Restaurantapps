// app/ordering/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, Trash2, Search, X, User, Phone, MapPin, Clock } from 'lucide-react';
import { MenuItem } from '../../types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export default function OrderingPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'customer' | 'delivery' | 'payment'>('cart');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    type: 'pickup' as 'pickup' | 'delivery',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: '',
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // You might want to fetch fresh menu item data here
        // For now, we'll use the saved cart
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    
    fetchMenuItems();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu?includeInactive=false');
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenuItems(data.menuItems || data.categories?.flatMap((cat: any) => cat.items) || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItem._id === item._id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menuItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.menuItem._id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('restaurant_cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return deliveryInfo.type === 'delivery' ? 5.00 : 0;
  };

  const getGrandTotal = () => {
    return getTotalPrice() + getDeliveryFee();
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory && item.isAvailable;
  });

  const categories = ['all', 'starters', 'mains', 'desserts', 'drinks', 'specials'];

  // Handle checkout process
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep('customer');
  };



// When submitting, validate email
const handleCustomerSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate email is a string and has proper format
  if (typeof customerInfo.email !== 'string' || !customerInfo.email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }
  
  setCheckoutStep('delivery');
};

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryInfo.type === 'delivery' && (!deliveryInfo.street || !deliveryInfo.city || !deliveryInfo.zipCode)) {
      alert('Please fill all delivery address details');
      return;
    }
    setCheckoutStep('payment');
  };

  // In your OrderingPage component, update the handlePaymentSubmit function:
// In your OrderingPage component, update the handlePaymentSubmit function:
const handlePaymentSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Basic payment validation
  if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName) {
    alert('Please fill all payment details');
    return;
  }

  // Validate card number (simple validation)
  if (paymentInfo.cardNumber.replace(/\s/g, '').length < 13) {
    alert('Please enter a valid card number');
    return;
  }

  try {
    const orderData = {
      customer: customerInfo,
      items: cart.map(item => ({
        menuItemId: item.menuItem._id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      type: deliveryInfo.type,
      deliveryAddress: deliveryInfo.type === 'delivery' ? {
        street: deliveryInfo.street,
        city: deliveryInfo.city,
        state: deliveryInfo.state,
        zipCode: deliveryInfo.zipCode
      } : undefined,
      specialInstructions: deliveryInfo.instructions,
      payment: {
        method: 'card',
        lastFour: paymentInfo.cardNumber.slice(-4)
      }
    };

    console.log('📤 Sending order data:', orderData);

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    console.log('📥 Order API Response:', data);

    if (data.success) {
      // Clear cart
      clearCart();
      
      // Store order info in localStorage
      localStorage.setItem('lastOrderNumber', data.orderNumber);
      localStorage.setItem('lastOrderEmail', customerInfo.email);
      
      // Redirect to email check page
      router.push(
        `/ordering/email-check?orderNumber=${data.orderNumber}&email=${encodeURIComponent(customerInfo.email)}`
      );
    } else {
      alert(`Error: ${data.error || 'Failed to place order'}`);
    }
  } catch (error) {
    console.error('Order submission error:', error);
    alert('Failed to place order. Please try again.');
  }
};

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cart Floating Button */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed top-24 right-4 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl z-40 transition-all duration-200"
        >
          <ShoppingCart className="w-6 h-6" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center">
              {getTotalItems()}
            </span>
          )}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeCategory === cat
                        ? 'bg-orange-100 text-orange-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Cart Summary in Sidebar */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Your Order</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    cart.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex gap-2 mt-2">
                        {item.isVegetarian && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Veg
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Spicy
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Vegan
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-orange-600 text-lg">${item.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {item.preparationTime} min
                    </span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No items found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {checkoutStep === 'cart' ? 'Your Order' : 
                   checkoutStep === 'customer' ? 'Customer Details' :
                   checkoutStep === 'delivery' ? 'Delivery Options' : 'Payment'}
                </h2>
                <button 
                  onClick={() => {
                    if (checkoutStep === 'cart') {
                      setIsCartOpen(false);
                    } else {
                      setCheckoutStep('cart');
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {checkoutStep === 'cart' ? (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">Your cart is empty</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map((item) => (
                          <div key={item.menuItem._id} className="flex justify-between items-center border-b pb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.menuItem.name}</h4>
                              <p className="text-gray-600 text-sm">${item.menuItem.price} each</p>
                              {item.specialInstructions && (
                                <p className="text-sm text-gray-500 italic">Note: {item.specialInstructions}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-3 font-semibold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.menuItem._id)}
                                className="p-1 text-red-500 hover:text-red-700 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span className="font-semibold">${getDeliveryFee().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-orange-600">${getGrandTotal().toFixed(2)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleCheckout}
                          className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors mb-3"
                        >
                          Proceed to Checkout
                        </button>
                        <button 
                          onClick={clearCart}
                          className="w-full border border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : checkoutStep === 'customer' ? (
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Continue to Delivery
                  </button>
                </form>
              ) : checkoutStep === 'delivery' ? (
                <form onSubmit={handleDeliverySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Order Type *</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryInfo({...deliveryInfo, type: 'pickup'})}
                        className={`flex-1 py-3 rounded-lg border font-semibold transition-colors ${
                          deliveryInfo.type === 'pickup'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryInfo({...deliveryInfo, type: 'delivery'})}
                        className={`flex-1 py-3 rounded-lg border font-semibold transition-colors ${
                          deliveryInfo.type === 'delivery'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Delivery (+$5.00)
                      </button>
                    </div>
                  </div>

                  {deliveryInfo.type === 'delivery' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={deliveryInfo.street}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, street: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            value={deliveryInfo.city}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                          <input
                            type="text"
                            value={deliveryInfo.state}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                        <input
                          type="text"
                          value={deliveryInfo.zipCode}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, zipCode: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={deliveryInfo.instructions}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, instructions: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Any special instructions for your order..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardName}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Name on card"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span>${getDeliveryFee().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-orange-600">${getGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mt-4"
                  >
                    Place Order & Pay ${getGrandTotal().toFixed(2)}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Your payment is secure. We use encryption to protect your information.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}