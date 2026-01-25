// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, Home, Receipt } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    } else {
      // No order number, redirect to home
      setTimeout(() => router.push('/'), 3000);
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.orders[0]);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for your order. We're preparing your food with care.
            </p>
          </div>

          {orderDetails && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-semibold">{orderDetails.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Type</p>
                  <p className="font-semibold capitalize">{orderDetails.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold">${orderDetails.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Ready Time</p>
                  <p className="font-semibold">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {new Date(orderDetails.estimatedReadyTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              You'll receive an order confirmation email shortly with all the details.
            </p>
            <p className="text-sm text-gray-500">
              Need to make changes? Call us at (555) 123-4567
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
            <button
              onClick={() => router.push('/track-order')}
              className="border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              Track Your Order
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Order Confirmation</h3>
                <p className="text-gray-600">Check your email for order details and receipt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Preparation</h3>
                <p className="text-gray-600">Our chefs are preparing your order</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Ready for {orderDetails?.type === 'delivery' ? 'Delivery' : 'Pickup'}</h3>
                <p className="text-gray-600">
                  {orderDetails?.type === 'delivery' 
                    ? 'We\'ll deliver to your address'
                    : 'Come to our restaurant to pick up'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}