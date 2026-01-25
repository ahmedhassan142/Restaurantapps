// app/order-confirmation/[orderNumber]/page.tsx - FIXED VERSION (SERVER COMPONENT)

import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient';
import React from 'react';
// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h1>
        <p className="text-gray-600">Fetching your order details</p>
      </div>
    </div>
  );
}

// Main page - SERVER COMPONENT
export default function OrderConfirmationPage({
  params
}: {
  params: Promise<{ orderNumber: string }>
}) {
  // Await params in server component
  const resolvedParams = React.use(params);
  const orderNumber = resolvedParams.orderNumber;
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderConfirmationClient orderNumber={orderNumber} />
    </Suspense>
  );
}