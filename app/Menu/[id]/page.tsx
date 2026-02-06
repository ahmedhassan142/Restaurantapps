// app/menu/[id]/page.tsx (Updated)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Clock, 
  ChefHat, 
  Flame, 
  Leaf, 
  Wheat, 
  Droplets, 
  ShoppingCart, 
  ArrowLeft,
  Star,
  Share2,
  Heart,
  Shield,
  CheckCircle,
  Utensils
} from 'lucide-react';
import { useCart } from '../../context/cart';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  preparationTime: number;
  ingredients: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  image?: string;
  tags?: string[];
}

interface RelatedItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  isVegetarian: boolean;
  isSpicy: boolean;
}

export default function MenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Use CartContext instead of localStorage
  const { addToCart, openCart } = useCart();

  const itemId = params.id as string;

  useEffect(() => {
    fetchMenuItem();
  }, [itemId]);

  const fetchMenuItem = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/menu/${itemId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu item');
      }
      
      const data = await response.json();
      
      if (data.success && data.menuItem) {
        setMenuItem(data.menuItem);
        fetchRelatedItems(data.menuItem.category._id, data.menuItem._id);
      } else {
        throw new Error(data.error || 'Menu item not found');
      }
    } catch (err) {
      console.error('Error fetching menu item:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu item');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedItems = async (categoryId: string, excludeId: string) => {
    try {
      const response = await fetch(`/api/menu?category=${categoryId}&limit=4`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.menuItems) {
          // Filter out current item and get available items only
          const filtered = data.menuItems
            .filter((item: any) => item._id !== excludeId && item.isAvailable)
            .slice(0, 3); // Show max 3 related items
          setRelatedItems(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching related items:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!menuItem?.isAvailable) {
      alert('This item is currently unavailable');
      return;
    }

    setAddingToCart(true);
    
    try {
      // Use CartContext to add item
      //@ts-ignore
      addToCart(menuItem, quantity);
      
      // Show success message
      alert(`Added ${quantity} ${menuItem.name} to cart!`);
      
      // Open cart modal
      openCart();
      
      // Reset quantity
      setQuantity(1);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: menuItem?.name,
        text: `Check out ${menuItem?.name} at Epicurean Restaurant!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // You could save favorites to localStorage or send to API
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (!isFavorite) {
      localStorage.setItem('favorites', JSON.stringify([
        ...favorites,
        { id: menuItem?._id, name: menuItem?.name }
      ]));
    } else {
      localStorage.setItem('favorites', JSON.stringify(
        favorites.filter((fav: any) => fav.id !== menuItem?._id)
      ));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-12 bg-gray-200 rounded w-48 mt-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !menuItem) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Item Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The menu item you are looking for does not exist.'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                View All Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div>
            <div className="relative h-96 lg:h-full rounded-2xl overflow-hidden shadow-xl bg-gray-100">
              {menuItem.image ? (
                <Image
                  src={menuItem.image}
                  alt={menuItem.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                  <Utensils className="w-32 h-32 text-orange-300" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {!menuItem.isAvailable && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Unavailable
                  </span>
                )}
                {menuItem.category && (
                  <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {menuItem.category.name}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/90 text-gray-700 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {menuItem.name}
              </h1>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-orange-600">
                    ${menuItem.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500">/ serving</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-lg leading-relaxed">
                {menuItem.description}
              </p>
            </div>

            {/* Dietary Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {menuItem.isVegetarian && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-xl">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Vegetarian</span>
                </div>
              )}
              
              {menuItem.isVegan && (
                <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-xl">
                  <Droplets className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Vegan</span>
                </div>
              )}
              
              {menuItem.isGlutenFree && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-xl">
                  <Wheat className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Gluten-Free</span>
                </div>
              )}
              
              {menuItem.isSpicy && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-xl">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">Spicy</span>
                </div>
              )}
            </div>

            {/* Preparation Time */}
            <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">Preparation Time</p>
                <p className="text-amber-700">{menuItem.preparationTime} minutes</p>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Ingredients</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {menuItem.ingredients.map((ingredient, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutritional Info */}
            {menuItem.nutritionalInfo && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">Nutritional Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {menuItem.nutritionalInfo.calories !== undefined && (
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-orange-600">{menuItem.nutritionalInfo.calories}</p>
                      <p className="text-sm text-gray-600">Calories</p>
                    </div>
                  )}
                  {menuItem.nutritionalInfo.protein !== undefined && (
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-blue-600">{menuItem.nutritionalInfo.protein}g</p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                  )}
                  {menuItem.nutritionalInfo.carbs !== undefined && (
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-green-600">{menuItem.nutritionalInfo.carbs}g</p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                  )}
                  {menuItem.nutritionalInfo.fat !== undefined && (
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-red-600">{menuItem.nutritionalInfo.fat}g</p>
                      <p className="text-sm text-gray-600">Fat</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="sticky bottom-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Total: ${(menuItem.price * quantity).toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!menuItem.isAvailable || addingToCart}
                  className={`flex items-center justify-center px-8 py-4 rounded-xl font-semibold transition-all w-full sm:w-auto ${
                    menuItem.isAvailable
                      ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } ${addingToCart ? 'opacity-70' : ''}`}
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {menuItem.isAvailable ? 'Add to Cart' : 'Unavailable'}
                    </>
                  )}
                </button>
              </div>
              
              {/* Safety Note */}
              <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-100">
                <Shield className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">
                  Allergen information available upon request
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {relatedItems.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedItems.map((item) => (
                <Link
                  key={item._id}
                  href={`/menu/${item._id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200"
                >
                  <div className="relative h-48 bg-gray-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ChefHat className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      <span className="font-bold text-orange-600">${item.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.isVegetarian && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Vegetarian
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Spicy
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Quick Prep</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}