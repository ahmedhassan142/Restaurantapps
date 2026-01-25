'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '../../types';

interface ApiResponse {
  menuItems: MenuItem[];
  groupedItems: {
    [key: string]: MenuItem[];
  };
  categories: string[];
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuData, setMenuData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu');
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu data');
      }
      
      const data: ApiResponse = await response.json();
      setMenuData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Menu' },
    { id: 'starters', name: 'Starters' },
    { id: 'mains', name: 'Main Courses' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
    { id: 'specials', name: 'Specials' }
  ];

  // Get menu items or empty array if data is not available
  const menuItems = menuData?.menuItems || [];
  
  // Filter items based on active category
  const filteredItems = activeCategory === 'all' 
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div 
        className="pt-20 min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/menu-bg.jpg")'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="pt-20 min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/menu-bg.jpg")'
        }}
      >
        <div className="text-center">
          <p className="text-red-300 mb-4">Error: {error}</p>
          <button 
            onClick={fetchMenuData}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="pt-20 min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/images/menu-bg.jpg")'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Menu
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Carefully crafted dishes using the finest ingredients, prepared with passion and expertise.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No items found in this category.</p>
            <button 
              onClick={() => setActiveCategory('all')}
              className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
            >
              View All Menu Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item._id || item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group backdrop-blur-sm bg-white/95"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        {item.isVegetarian && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Vegetarian
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Vegan
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Gluten Free
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Spicy
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">
                      ${item.price}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.map((ingredient, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Prep time: {item.preparationTime || 20}min
                    </span>
                    <button 
                      onClick={() => window.location.href = `/ordering?item=${item._id || item.id}`}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}