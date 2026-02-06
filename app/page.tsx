// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Clock, Users, Award, TrendingUp } from 'lucide-react';
import Image from 'next/image'; // Add this import

interface FeaturedItem {
  _id: string;
  title: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  menuItem: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
  };
}

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      const response = await fetch('/api/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedItems(data.featuredItems || []);
      }
    } catch (error) {
      console.error('Error fetching featured items:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Award Winning',
      description: 'Recognized for culinary excellence and exceptional service'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fresh Daily',
      description: 'All ingredients sourced fresh daily from local producers'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Expert Chefs',
      description: 'Our talented chefs create unforgettable dining experiences'
    }
  ];

  const getBadgeColor = (color: string) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colors[color as keyof typeof colors] || colors.orange;
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-lg">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-2 text-sm font-semibold">Rated 4.9/5 by 1200+ diners</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Exquisite
                <span className="block text-orange-600">Dining</span>
                Experience
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                Discover the perfect blend of traditional flavors and modern culinary artistry. 
                Where every dish tells a story and every meal becomes a memory.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/Reservation"
                  className="bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Reserve a Table
                </Link>
                <Link
                  href="/Menu"
                  className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all duration-200 transform hover:-translate-y-1"
                >
                  View Our Menu
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* Replace this Image component with your actual photo */}
                <div className="w-full h-96 lg:h-[500px] relative">
                  <Image
                    src="/images/hero-image.jpg" // Replace with your image path
                    alt="Exquisite dining experience at our restaurant"
                    fill
                    className="object-cover"
                    priority // This ensures the hero image loads first
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              </div>
              
              {/* Optional: Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-200 rounded-full opacity-50"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-orange-100 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of your existing code remains the same */}
      {/* Featured Items Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Trending Now
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most popular dishes loved by our customers
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(item.badgeColor)}`}>
                        {item.badgeText}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {item.menuItem.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {item.description || item.menuItem.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-orange-600">
                        ${item.menuItem.price}
                      </span>
                      <Link
                        href={`/ordering?item=${item.menuItem._id}`}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured items available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 bg-white"
              >
                <div className="text-orange-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready for an Unforgettable Experience?
          </h2>
          <p className="text-orange-100 text-xl mb-8">
            Book your table now and let us create something special for you.
          </p>
          <Link
            href="/reservations"
            className="inline-block bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Make Reservation
          </Link>
        </div>
      </section>
    </main>
  );
}