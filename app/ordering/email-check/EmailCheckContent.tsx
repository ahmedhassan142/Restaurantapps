// app/ordering/email-check/EmailCheckContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, Home, ShoppingBag, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmailCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  useEffect(() => {
    // Get order number from query parameters
    const orderNum = searchParams.get('orderNumber');
    const email = searchParams.get('email');
    
    if (orderNum) {
      setOrderNumber(orderNum);
      // Store in localStorage for reference
      localStorage.setItem('lastOrderNumber', orderNum);
    }
    
    if (email) {
      setCustomerEmail(email);
      localStorage.setItem('lastOrderEmail', email);
    }
    
    // Clear cart from localStorage
    localStorage.removeItem('restaurant_cart');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Email Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-blue-600" />
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Kindly Check Your Email 📧
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              Thank you for your order! We've sent a complete confirmation and receipt to your email address.
            </p>
            
            {orderNumber && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Your Order Number</p>
                <p className="text-2xl font-bold text-orange-600">{orderNumber}</p>
              </div>
            )}

            {/* Email Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">What's in the email?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Complete order confirmation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Itemized receipt
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Order tracking link
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Estimated ready time
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What to Do Next */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 mb-2">What to Do Next:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Check your inbox</p>
                    <p className="text-sm text-green-700">
                      Look for an email from <span className="font-semibold">Epicurean Restaurant</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Click the order link</p>
                    <p className="text-sm text-green-700">
                      Follow the link in the email to view your order details
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Track your order</p>
                    <p className="text-sm text-green-700">
                      Use the tracking link to see real-time updates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* If email doesn't arrive */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-1">Email not showing up?</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Verify the email address: <span className="font-medium">{customerEmail || 'your email'}</span></li>
                <li>• Wait 2-3 minutes, emails can sometimes be delayed</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Open Gmail
            </button>
            
            <button
              onClick={() => window.open('https://outlook.live.com', '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Open Outlook
            </button> */}
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => router.push('/')}
                className="border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Home
              </button>
              
              <button
                onClick={() => router.push('/ordering')}
                className="border border-orange-600 text-orange-600 py-3 rounded-lg hover:bg-orange-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Order Again
              </button>
            </div>
          </div>

          {/* Need Help */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <button 
                onClick={() => router.push('/contact')}
                className="text-orange-600 hover:text-orange-800 font-medium"
              >
                Contact our support team
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}