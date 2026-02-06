// app/order-confirmation/[orderNumber]/OrderConfirmationContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, Clock, Home, ShoppingBag, Package, 
  CreditCard, MapPin, Phone, Mail, AlertCircle,
  Loader2, Calendar, Shield, Printer, Download,
  ArrowLeft, Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  type: 'pickup' | 'delivery';
  status: string;
  estimatedReadyTime: string;
  createdAt: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions?: string;
  payment: {
    method: string;
    lastFour: string;
  };
}

interface OrderConfirmationContentProps {
  orderNumber: string;
}

export default function OrderConfirmationContent({ orderNumber }: OrderConfirmationContentProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetchOrder();
    
    // Check if coming from checkout
    const fromCheckout = sessionStorage.getItem('fromCheckout');
    if (fromCheckout === 'true') {
      // Clear cart and session data
      clearCartData();
      sessionStorage.removeItem('fromCheckout');
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
      const data = await response.json();
      
      if (data.success && data.orders && data.orders.length > 0) {
        setOrder(data.orders[0]);
        
        // Store in localStorage for easy access
        localStorage.setItem('lastOrderNumber', orderNumber);
        localStorage.setItem('lastOrderEmail', data.orders[0].customer.email);
      } else {
        setError('Order not found. Please check your order number.');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearCartData = () => {
    // Clear all cart-related localStorage
    const cartKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('epicurean_cart_')
    );
    cartKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear guest session
    localStorage.removeItem('guest_session_id');
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResendEmail = async () => {
    if (!order) return;
    
    try {
      setEmailSent(true);
      const response = await fetch('/api/orders/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          setEmailSent(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error resending email:', err);
      setEmailSent(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Create printable receipt HTML
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${order?.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .order-number { font-size: 24px; font-weight: bold; color: #ea580c; }
            .details { margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Epicurean Restaurant</h1>
            <div class="order-number">Order #${order?.orderNumber}</div>
            <div>${format(new Date(order?.createdAt || ''), 'PPP p')}</div>
          </div>
          
          <div class="details">
            <p><strong>Customer:</strong> ${order?.customer.name}</p>
            <p><strong>Email:</strong> ${order?.customer.email}</p>
            <p><strong>Order Type:</strong> ${order?.type}</p>
            <p><strong>Status:</strong> ${order?.status}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order?.items.map(item => `
                <tr>
                  <td>${item.name}${item.specialInstructions ? `<br><small>${item.specialInstructions}</small>` : ''}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Subtotal: $${(order?.total || 0 - (order?.deliveryFee || 0)).toFixed(2)}<br>
            ${order?.deliveryFee ? `Delivery Fee: $${order.deliveryFee.toFixed(2)}<br>` : ''}
            <strong>Total: $${order?.total.toFixed(2)}</strong>
          </div>
          
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>For any questions, contact: support@epicurean.com</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(receiptContent);
    printWindow?.document.close();
    printWindow?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            
            <p className="text-gray-600 mb-6">
              {error || 'We couldn\'t find your order details.'}
            </p>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-sm text-gray-500">Order Number:</p>
                <p className="font-mono text-lg font-bold">{orderNumber}</p>
              </div>
              
              <button
                onClick={() => router.push('/ordering')}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Place New Order
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.total - order.deliveryFee;
  const estimatedTime = new Date(order.estimatedReadyTime);
  const currentTime = new Date();
  const minutesRemaining = Math.max(0, Math.ceil((estimatedTime.getTime() - currentTime.getTime()) / (1000 * 60)));

  return (
    <div className=" mt-14 min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Order Confirmed!</h1>
                <p className="text-green-100">Your order has been placed successfully</p>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm">Order #</span>
                <button
                  onClick={handleCopyOrderNumber}
                  className="flex items-center gap-2 font-mono font-bold text-lg hover:opacity-90 transition-opacity"
                >
                  {order.orderNumber}
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-green-100 mt-1">
                {format(new Date(order.createdAt), 'PPP p')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Status Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Order Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {order.status !== 'pending' ? <CheckCircle className="w-4 h-4" /> : '1'}
                    </div>
                    <div>
                      <p className="font-medium">Order Received</p>
                      <p className="text-sm text-gray-500">We've received your order</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(order.createdAt), 'h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['confirmed', 'preparing', 'ready', 'completed'].includes(order.status) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {['confirmed', 'preparing', 'ready', 'completed'].includes(order.status) ? <CheckCircle className="w-4 h-4" /> : '2'}
                    </div>
                    <div>
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-gray-500">Restaurant is preparing your food</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">--:--</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['ready', 'completed'].includes(order.status) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {['ready', 'completed'].includes(order.status) ? <CheckCircle className="w-4 h-4" /> : '3'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {order.type === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Estimated: {format(estimatedTime, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">--:--</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {order.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : '4'}
                    </div>
                    <div>
                      <p className="font-medium">Order Completed</p>
                      <p className="text-sm text-gray-500">Enjoy your meal!</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">--:--</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Order Summary
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-gray-700 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm mt-1">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-600 italic mt-1">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions:</p>
                  <p className="text-yellow-700">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Info & Actions */}
          <div className="space-y-8">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
              
              <div className="space-y-4">
                {/* Customer Info */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer</p>
                  <p className="font-medium">{order.customer.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="w-3 h-3" />
                    {order.customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-3 h-3" />
                    {order.customer.phone}
                  </div>
                </div>
                
                {/* Order Type */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Type</p>
                  <div className="flex items-center gap-2">
                    {order.type === 'pickup' ? (
                      <>
                        <Home className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Pickup</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Delivery</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Delivery Address (if applicable) */}
                {order.type === 'delivery' && order.deliveryAddress && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-sm">{order.deliveryAddress.street}</p>
                    <p className="text-sm">
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                    </p>
                  </div>
                )}
                
                {/* Payment Info */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span>Card ending in {order.payment.lastFour}</span>
                  </div>
                </div>
                
                {/* Time Estimate */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Estimated Ready Time</span>
                  </div>
                  <p className="text-blue-600">
                    {format(estimatedTime, 'h:mm a')}
                    <span className="text-sm ml-2">({minutesRemaining} minutes remaining)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Totals Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Total</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Receipt Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full border border-orange-600 text-orange-600 py-3 rounded-lg hover:bg-orange-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                 </button>
                
                {/* <button
                  onClick={handleResendEmail}
                  disabled={emailSent}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {emailSent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </button>  */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/Menu')}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Order Again
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
                
                <button
                  onClick={() => router.push('/Contact')}
                  className="w-full border border-blue-300 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Need Help? Contact Support
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Secure Transaction</span>
              </div>
              <p className="text-xs text-green-600">
                Your order and payment information are securely processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}