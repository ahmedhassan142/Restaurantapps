'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

interface Availability {
  time: string;
  isAvailable: boolean;
  availableTables: number;
  remainingCapacity: number;
}

interface AvailabilityResponse {
  date: string;
  guests: number;
  availability: Availability[];
  allTimeSlots: string[];
}

export default function ReservationsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Check availability when date or guests change
  useEffect(() => {
    if (formData.date) {
      checkAvailability();
    }
  }, [formData.date, formData.guests]);

  const checkAvailability = async () => {
    if (!formData.date) return;
    
    setCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/availability?date=${formData.date}&guests=${formData.guests}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      
      const data: AvailabilityResponse = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reservation');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        specialRequests: ''
      });
      setAvailability(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isTimeSlotAvailable = (time: string) => {
    if (!availability) return true;
    const slot = availability.availability.find(s => s.time === time);
    return slot ? slot.isAvailable : false;
  };

  return (
    <div 
      className="pt-20 min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/images/reservations-bg.jpg")'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Make a Reservation
          </h1>
          <p className="text-xl text-gray-200">
            Book your table for an unforgettable dining experience
          </p>
        </div>

        {/* Reservation Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Reservation Submitted Successfully!
              </h3>
              <p className="text-green-700">
                We've received your reservation request and will send a confirmation email shortly.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <select
                    id="guests"
                    name="guests"
                    required
                    value={formData.guests}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <select
                    id="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select time</option>
                    {availability?.allTimeSlots.map(time => (
                      <option 
                        key={time} 
                        value={time}
                        disabled={!isTimeSlotAvailable(time)}
                        className={!isTimeSlotAvailable(time) ? 'text-gray-400' : ''}
                      >
                        {time} {!isTimeSlotAvailable(time) && '(Unavailable)'}
                      </option>
                    ))}
                  </select>
                  
                  {checkingAvailability && (
                    <p className="text-sm text-gray-500 mt-2">Checking availability...</p>
                  )}
                  
                  {availability && !checkingAvailability && (
                    <p className="text-sm text-gray-600 mt-2">
                      {availability.availability.filter(s => s.isAvailable).length} time slots available
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  rows={4}
                  value={formData.specialRequests}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Any special requirements, dietary restrictions, or celebrations..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !formData.date || !formData.time}
                className="w-full bg-orange-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Reserve Table'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}