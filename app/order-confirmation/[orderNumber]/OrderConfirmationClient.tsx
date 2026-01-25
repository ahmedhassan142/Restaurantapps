// app/order-confirmation/[orderNumber]/OrderConfirmationClient.tsx - CLIENT COMPONENT
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Home, Package, MapPin, Phone } from 'lucide-react';

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
  deliveryFee?: number;
  status: string;
  type: 'pickup' | 'delivery';
  estimatedReadyTime?: string;
  payment: {
    method: string;
    lastFour: string;
  };
  createdAt: string;
  specialInstructions?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface OrderConfirmationClientProps {
  orderNumber: string;
}

export default function OrderConfirmationClient({ orderNumber }: OrderConfirmationClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setError('No order number provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching order:', orderNumber);
        const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`, {
          cache: 'no-store'
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        if (data.success && data.orders && data.orders.length > 0) {
          setOrder(data.orders[0]);
        } else {
          setError(data.error || 'Order not found');
        }
      } catch (err) {
        console.error('💥 Fetch error:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Loading Order Details...</h1>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'We couldn\'t find this order.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 block w-full"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 block w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your order, {order.customer.name}</p>
          </div>

          {/* Order Number */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-orange-600 mb-1">ORDER NUMBER</p>
            <p className="text-2xl font-bold text-orange-700">{order.orderNumber}</p>
          </div>

          {/* Order Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{order.type}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estimated Ready:</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {order.estimatedReadyTime 
                  ? new Date(order.estimatedReadyTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : 'Soon'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className="font-medium">
                {order.payment.method} •••• {order.payment.lastFour}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-600 italic mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              {order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span>${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-orange-600">${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-blue-600">
                  <span>📧</span>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Email</p>
                  <p className="font-medium text-blue-800">{order.customer?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-blue-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Phone</p>
                  <p className="font-medium text-blue-800">{order.customer?.phone}</p>
                </div>
              </div>
              
              {order.deliveryAddress && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Delivery Address</p>
                    <p className="font-medium text-blue-800">
                      {order.deliveryAddress.street}
                      <br />
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Special Instructions</h3>
              <p className="text-yellow-700">{order.specialInstructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
            
            <button
              onClick={() => router.push('/track-order')}
              className="w-full border border-orange-600 text-orange-600 py-3 rounded-lg hover:bg-orange-50 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Track Your Order
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>📍 123 Restaurant Street, Food City</p>
            <p>📞 (555) 123-4567</p>
            <p className="mt-2">Thank you for choosing us! ❤️</p>
          </div>
        </div>
      </div>
    </div>
  );
}