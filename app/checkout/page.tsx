'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'pickup',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    specialInstructions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get cart from localStorage or context
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          items: cart.map((item: any) => ({
            menuItemId: item.menuItem._id,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions
          })),
          type: formData.type,
          deliveryAddress: formData.type === 'delivery' ? formData.deliveryAddress : undefined,
          specialInstructions: formData.specialInstructions
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.removeItem('cart');
        router.push(`/order-confirmation/${data.order.orderNumber}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info Fields */}
          {/* Order Type Selection */}
          {/* Address Fields (conditional) */}
          {/* Submit Button */}
        </form>
      </div>
    </div>
  );
}