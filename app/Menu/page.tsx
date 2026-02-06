// app/menu/page.tsx - COMPLETE UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Clock, ChefHat, Star, 
  Leaf, Flame, Wheat, Droplets, 
  ShoppingCart, Sparkles, Award, TrendingUp,
  ArrowRight, ChevronRight, Menu as MenuIcon,
  ChevronDown, Check
} from 'lucide-react';
import { useCart } from '../context/cart';
import { MenuItem } from '../../types';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function MenuPage() {
  const router = useRouter();
  const { addToCart, openCart } = useCart();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilters, setActiveFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false,
    available: true,
  });
  
  // Hero images from public/images/hero folder
  const heroImages = [
    '/images/hero/food-1.jpg',
    '/images/hero/food-2.jpg',
    '/images/hero/food-3.jpg',
    '/images/hero/food-4.jpg',
  ];
  
  // Default categories with fallbacks
  const defaultCategories = [
    { _id: 'all', name: 'All Menu', icon: '🍽️' },
    { _id: 'starters', name: 'Starters', icon: '🥗' },
    { _id: 'main', name: 'Main Courses', icon: '🍝' },
    { _id: 'desserts', name: 'Desserts', icon: '🍰' },
    { _id: 'drinks', name: 'Drinks', icon: '🥤' },
    { _id: 'specials', name: "Chef's Specials", icon: '🌟' },
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu?includeInactive=false');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems || []);
        setFilteredItems(data.menuItems || []);
        
        // Extract unique categories from menu items
        const uniqueCategories = Array.from(
          new Set(data.menuItems?.map((item: MenuItem) => item.category) || [])
        );
        
        // If we have categories from API, use them
        if (data.categories && data.categories.length > 0) {
          setCategories([
            { _id: 'all', name: 'All Menu', icon: '🍽️' },
            ...data.categories.map((cat: any) => ({
              _id: cat._id,
              name: cat.name,
              icon: getCategoryIcon(cat.name)
            }))
          ]);
        } else if (uniqueCategories.length > 0) {
          // Use categories from menu items with icons
          const categoryList = [
            { _id: 'all', name: 'All Menu', icon: '🍽️' },
            //@ts-ignore
            ...uniqueCategories.map((catId: string, index: number) => {
              // Find first item in this category to get category name
              const categoryItem = data.menuItems.find((item: MenuItem) => item.category === catId);
              const categoryName = categoryItem?.categoryName || `Category ${index + 1}`;
              return {
                _id: catId,
                name: categoryName,
                icon: getCategoryIcon(categoryName)
              };
            })
          ];
          setCategories(categoryList);
        } else {
          // Fallback to default categories
          setCategories(defaultCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterAndSortItems();
  }, [menuItems, searchTerm, selectedCategory, sortBy, activeFilters]);

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      'Starters': '🥗',
      'Appetizers': '🥗',
      'Main Courses': '🍝',
      'Main': '🍝',
      'Entrees': '🍝',
      'Desserts': '🍰',
      'Sweets': '🍰',
      'Drinks': '🥤',
      'Beverages': '🥤',
      'Specials': '🌟',
      'Chef Specials': '🌟',
      'Vegetarian': '🥬',
      'Vegan': '🌱',
      'Seafood': '🐟',
      'Pizza': '🍕',
      'Burgers': '🍔',
      'Pasta': '🍝',
      'Salads': '🥗',
      'Soups': '🍲',
      'Sides': '🍟',
    };
    
    return iconMap[categoryName] || '🍽️';
  };

  const filterAndSortItems = () => {
    let filtered = [...menuItems];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Apply dietary filters
    if (activeFilters.vegetarian) {
      filtered = filtered.filter(item => item.isVegetarian);
    }
    if (activeFilters.vegan) {
      filtered = filtered.filter(item => item.isVegan);
    }
    if (activeFilters.glutenFree) {
      filtered = filtered.filter(item => item.isGlutenFree);
    }
    if (activeFilters.spicy) {
      filtered = filtered.filter(item => item.isSpicy);
    }

    // Apply availability filter
    if (activeFilters.available) {
      filtered = filtered.filter(item => item.isAvailable);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'prep-time':
          return (a.preparationTime || 20) - (b.preparationTime || 20);
        case 'popular':
          // For now, sort by price as placeholder
          return b.price - a.price;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item, 1);
    openCart();
  };

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
    setActiveFilters({
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      spicy: false,
      available: true,
    });
  };

  const getCategoryItemCount = (categoryId: string): number => {
    if (categoryId === 'all') return menuItems.length;
    return menuItems.filter(item => item.category === categoryId).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            {/* Hero Section Skeleton */}
            <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl"></div>
            
            {/* Filters Skeleton */}
            <div className="h-12 bg-gray-200 rounded-xl w-1/3 mb-8"></div>
            
            {/* Menu Items Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      {/* ========== HERO SECTION ========== */}
      <div className="relative overflow-hidden min-h-[600px] md:min-h-[700px]">
        {/* Background Images Grid - HIGH VISIBILITY */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0">
          {/* First image - Top left */}
          <div className="relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: "url('/images/hero/food-1.jpg')",
                backgroundPosition: 'center center'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/50 to-transparent mix-blend-multiply"></div>
          </div>
          
          {/* Second image - Top right */}
          <div className="relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: "url('/images/hero/food-2.jpg')",
                backgroundPosition: 'center center'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/50 to-transparent mix-blend-multiply"></div>
          </div>
          
          {/* Third image - Bottom left */}
          <div className="relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: "url('/images/hero/food-3.jpg')",
                backgroundPosition: 'center center'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/50 to-transparent mix-blend-multiply"></div>
          </div>
          
          {/* Fourth image - Bottom right */}
          <div className="relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: "url('/images/hero/food-4.jpg')",
                backgroundPosition: 'center center'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/50 to-transparent mix-blend-multiply"></div>
          </div>
        </div>
        
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/70 via-amber-600/65 to-orange-700/70"></div>
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-r from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 h-full flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4">
                  <Award className="w-4 h-4 mr-2" />
                  Award-Winning Cuisine
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block">Experience</span>
                <span className="text-amber-200 block mt-2">Culinary Magic</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-2xl">
                Where every dish is a masterpiece, crafted with passion, precision, 
                and the finest ingredients. Taste the difference.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 text-lg group"
                >
                  <MenuIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Explore Full Menu
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
                
                <button
                  onClick={() => router.push('/ordering')}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group"
                >
                  Order Online
                  <ChevronDown className="w-4 h-4 ml-2 inline group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start">
                <div className="flex items-center text-orange-100">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">{menuItems.length}</div>
                    <div className="text-sm opacity-90">Menu Items</div>
                  </div>
                </div>
                
                <div className="flex items-center text-orange-100">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">4.9</div>
                    <div className="text-sm opacity-90">Customer Rating</div>
                  </div>
                </div>
                
                <div className="flex items-center text-orange-100">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">15-30</div>
                    <div className="text-sm opacity-90">Min Prep</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Featured Dish Card */}
            {menuItems.length > 0 && (
              <div className="flex-1 max-w-lg">
                <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  {/* Card Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)',
                      backgroundSize: '40px 40px'
                    }}></div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-2xl">Today's Special</h3>
                        <p className="text-orange-100">Chef's recommendation</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 p-6 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-xl mb-2">
                            {menuItems[0].name}
                          </h4>
                          <p className="text-orange-100 text-sm line-clamp-2 mb-3">
                            {menuItems[0].description}
                          </p>
                          
                          {/* Dietary badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {menuItems[0].isVegetarian && (
                              <span className="inline-flex items-center px-3 py-1 bg-green-500/30 text-green-100 rounded-full text-xs font-semibold backdrop-blur-sm">
                                <Leaf className="w-3 h-3 mr-1" />
                                Vegetarian
                              </span>
                            )}
                            {menuItems[0].isSpicy && (
                              <span className="inline-flex items-center px-3 py-1 bg-red-500/30 text-red-100 rounded-full text-xs font-semibold backdrop-blur-sm">
                                <Flame className="w-3 h-3 mr-1" />
                                Spicy
                              </span>
                            )}
                            {menuItems[0].isVegan && (
                              <span className="inline-flex items-center px-3 py-1 bg-emerald-500/30 text-emerald-100 rounded-full text-xs font-semibold backdrop-blur-sm">
                                <Droplets className="w-3 h-3 mr-1" />
                                Vegan
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl text-xl font-bold shadow-lg ml-4 whitespace-nowrap">
                          ${parseFloat(menuItems[0].price.toString()).toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(menuItems[0])}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                      >
                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Add Special to Cart
                        <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
                          Limited Time
                        </span>
                      </button>
                    </div>
                    
                    <div className="flex items-center text-orange-200 text-sm">
                      <div className="flex items-center mr-6">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{menuItems[0].preparationTime || 20} min prep</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        <span>Freshly prepared</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white/70">
              <span className="text-sm mb-2">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="menu-grid">
        {/* Search and Filters Section */}
        <div className="mb-12">
          {/* Search Bar */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-3xl blur-xl"></div>
            <div className="relative">
              <Search className="w-6 h-6 absolute left-6 top-1/2 transform -translate-y-1/2 text-orange-500 z-10" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="What are you craving today? Search dishes, ingredients..."
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-transparent text-lg shadow-xl placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
                <p className="text-gray-600 mt-2">Discover our diverse menu offerings</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{getCategoryItemCount(selectedCategory)}</div>
                <div className="text-sm text-gray-500">items found</div>
              </div>
            </div>
            
            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide -mx-1 px-1">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all whitespace-nowrap flex-shrink-0 min-w-[200px] group ${
                    selectedCategory === cat._id
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-2xl shadow-orange-300 transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-lg'
                  }`}
                >
                  <span className="text-3xl transform group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-bold text-lg">{cat.name}</div>
                    <div className={`text-sm mt-1 ${
                      selectedCategory === cat._id ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {getCategoryItemCount(cat._id)} items
                    </div>
                  </div>
                  {selectedCategory === cat._id && (
                    <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 flex-wrap">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-3 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all border-2 border-orange-100"
                  >
                    <Filter className="w-5 h-5" />
                    <span className="font-bold">Filters</span>
                    {Object.values(activeFilters).filter(f => f).length > 0 && (
                      <span className="bg-orange-600 text-white text-sm px-2.5 py-1 rounded-full font-bold">
                        {Object.values(activeFilters).filter(f => f).length}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative group">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border-2 border-gray-300 rounded-xl px-5 py-3 pr-12 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-orange-400 transition-colors cursor-pointer"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="prep-time">Preparation Time</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <TrendingUp className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-orange-500" />
                  </div>

                  {/* Active Filter Badges */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    {activeFilters.vegetarian && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                        <Leaf className="w-3 h-3 mr-1.5" />
                        Vegetarian
                      </span>
                    )}
                    {activeFilters.spicy && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium border border-red-200">
                        <Flame className="w-3 h-3 mr-1.5" />
                        Spicy
                      </span>
                    )}
                    {activeFilters.vegan && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200">
                        <Droplets className="w-3 h-3 mr-1.5" />
                        Vegan
                      </span>
                    )}
                    {activeFilters.glutenFree && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                        <Wheat className="w-3 h-3 mr-1.5" />
                        Gluten-Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">Dietary Preferences</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={activeFilters.vegetarian}
                          onChange={() => toggleFilter('vegetarian')}
                          className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex items-center space-x-3">
                          <Leaf className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">Vegetarian</div>
                            <div className="text-xs text-gray-500">No meat</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={activeFilters.vegan}
                          onChange={() => toggleFilter('vegan')}
                          className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex items-center space-x-3">
                          <Droplets className="w-5 h-5 text-emerald-600" />
                          <div>
                            <div className="font-medium">Vegan</div>
                            <div className="text-xs text-gray-500">Plant-based</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={activeFilters.glutenFree}
                          onChange={() => toggleFilter('glutenFree')}
                          className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex items-center space-x-3">
                          <Wheat className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Gluten-Free</div>
                            <div className="text-xs text-gray-500">No gluten</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={activeFilters.spicy}
                          onChange={() => toggleFilter('spicy')}
                          className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex items-center space-x-3">
                          <Flame className="w-5 h-5 text-red-600" />
                          <div>
                            <div className="font-medium">Spicy</div>
                            <div className="text-xs text-gray-500">Hot & spicy</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={activeFilters.available}
                          onChange={() => toggleFilter('available')}
                          className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Available Now</div>
                            <div className="text-xs text-gray-500">Ready to order</div>
                          </div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={resetFilters}
                        className="px-5 py-2.5 text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
                      >
                        Clear all filters
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div 
                  key={item._id} 
                  className="group bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Item Image */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {item.image ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <ChefHat className="w-16 h-16 text-gray-300" />
                          <div className="absolute -inset-4 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-xl"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {!item.isAvailable ? (
                        <span className="bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                          Sold Out
                        </span>
                      ) : (
                        <>
                          {item.isVegetarian && (
                            <span className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                              Veg
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                              Spicy 🌶️
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Price Tag */}
                    <div className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-xl">
                      ${parseFloat(item.price.toString()).toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Item Details */}
                  <div className="p-6">
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-900 line-clamp-1">
                          {item.name}
                        </h3>
                        <div className="flex items-center bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4 mr-1.5" />
                          <span className="text-sm font-semibold">{item.preparationTime || 20}min</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      
                      {/* Dietary Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.isVegan && (
                          <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                            <Leaf className="w-3 h-3 mr-1.5" />
                            Vegan
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                            <Wheat className="w-3 h-3 mr-1.5" />
                            Gluten-Free
                          </span>
                        )}
                      </div>
                      
                      {/* Ingredients Preview */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mb-5">
                          <p className="text-sm text-gray-500 mb-2 font-medium">Key Ingredients:</p>
                          <p className="text-sm text-gray-700 line-clamp-1">
                            {item.ingredients.slice(0, 4).join(' • ')}
                            {item.ingredients.length > 4 && ' • ...'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push(`/Menu/${item._id}`)}
                        className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors hover:border-gray-400"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                          item.isAvailable
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        ) : (
                          'Unavailable'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Results Count */}
            <div className="mt-12 text-center">
              <p className="text-gray-600">
                Showing <span className="font-bold text-orange-600">{filteredItems.length}</span> of{" "}
                <span className="font-bold">{menuItems.length}</span> menu items
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-40 h-40 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ChefHat className="w-20 h-20 text-orange-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No items found</h3>
            <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
              {searchTerm 
                ? `No results found for "${searchTerm}". Try a different search term or browse our categories.`
                : 'No items match your current filters. Try adjusting your filters or browse all categories.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-10 py-4 rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-colors shadow-xl hover:shadow-2xl text-lg"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setSelectedCategory('all')}
                className="border-2 border-orange-600 text-orange-600 px-10 py-4 rounded-xl font-bold hover:bg-orange-50 transition-colors text-lg"
              >
                View All Items
              </button>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-20 bg-gradient-to-r from-gray-900 to-black rounded-3xl p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-12 h-12 text-amber-400" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Taste Excellence?
            </h2>
            <p className="text-gray-300 text-xl mb-10 max-w-2xl mx-auto">
              From farm to table, every ingredient is carefully selected to bring you an unforgettable dining experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => openCart()}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-12 py-5 rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-colors shadow-xl hover:shadow-2xl text-lg flex items-center justify-center gap-3 group"
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                View Cart & Checkout
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/Contact')}
                className="bg-transparent border-2 border-white text-white px-12 py-5 rounded-xl font-bold hover:bg-white/10 transition-colors text-lg"
              >
                Contact Us
              </button>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center gap-10 text-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span>Award-Winning Cuisine</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span>Fresh Daily Ingredients</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Quick Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}