'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, Home, ShoppingBag, Clock } from 'lucide-react';
import EmailCheckContent from './EmailCheckContent';

// Loading component
function EmailCheckLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        <p className="text-gray-600">Preparing your order confirmation</p>
      </div>
    </div>
  );
}

// Main page with Suspense boundary
export default function EmailCheckPage() {
  return (
    <Suspense fallback={<EmailCheckLoading />}>
      <EmailCheckContent />
    </Suspense>
  );
}