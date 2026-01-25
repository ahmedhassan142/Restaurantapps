'use client';

import { useState } from 'react';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/orders?orderNumber=${orderNumber}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.orders[0]);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>
        
        <form onSubmit={handleTrack} className="space-y-4 mb-8">
          <div>
            <input
              type="text"
              placeholder="Order Number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold"
            disabled={loading}
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>

        {order && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Display order status and details */}
          </div>
        )}
      </div>
    </div>
  );
}