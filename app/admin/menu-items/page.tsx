// app/admin/menu-items/page.tsx - UPDATED WITH IMAGE UPLOAD
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, 
  Loader2, Utensils, Upload, X, Image as ImageIcon 
} from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  preparationTime: number;
  ingredients: string[];
}

interface Category {
  _id: string;
  name: string;
  children: Category[];
}

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '/images/default-food.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    preparationTime: 20,
    ingredients: ['']
  });

  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch('/api/menu?includeInactive=true'),
        fetch('/api/categories')
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setMenuItems(itemsData.menuItems || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  const getAllCategories = (categories: Category[]): Category[] => {
    let all: Category[] = [];
    categories.forEach(cat => {
      all.push(cat);
      if (cat.children) {
        all = [...all, ...getAllCategories(cat.children)];
      }
    });
    return all;
  };

  const flatCategories = getAllCategories(categories);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && item.isAvailable) ||
                               (availabilityFilter === 'unavailable' && !item.isAvailable);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        setImagePreview(data.imageUrl);
        return data.imageUrl;
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setFormImage(file);
  };

  const removeImage = () => {
    setFormImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '/images/default-food.jpg' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Item name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }
    
    if (formData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    
    if (formData.preparationTime < 5) {
      alert('Preparation time must be at least 5 minutes');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let finalImageUrl = formData.image;
      
      // Upload new image if selected
      if (formImage) {
        const uploadedUrl = await handleImageUpload(formImage);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }
      
      const url = editingItem 
        ? `/api/menu/${editingItem._id}`
        : '/api/menu';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const ingredients = formData.ingredients.filter(ing => ing.trim() !== '');
      
      const payload = { 
        ...formData, 
        image: finalImageUrl,
        ingredients 
      };
      
      console.log('Submitting menu item:', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Close form and reset
        setShowForm(false);
        setEditingItem(null);
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          image: '/images/default-food.jpg',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isSpicy: false,
          preparationTime: 20,
          ingredients: ['']
        });
        setFormImage(null);
        setImagePreview('');
        
        // Refresh data
        await fetchData();
        
        alert(editingItem ? 'Menu item updated successfully!' : 'Menu item created successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || errorData.message || 'Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      isSpicy: item.isSpicy,
      preparationTime: item.preparationTime,
      ingredients: item.ingredients.length > 0 ? item.ingredients : ['']
    });
    setImagePreview(item.image);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    setDeleting(itemId);
    
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Menu item deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || errorData.message || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('An error occurred while deleting.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setToggling(itemId);
    
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });

      if (response.ok) {
        await fetchData();
        alert(`Menu item ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('Failed to update menu item status');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('An error occurred while updating.');
    } finally {
      setToggling(null);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Add to your .env.local file:
  /*
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  */

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse mt-14">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mt-14 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant's menu items</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              name: '',
              description: '',
              price: 0,
              category: '',
              image: '/images/default-food.jpg',
              isAvailable: true,
              isVegetarian: false,
              isVegan: false,
              isGlutenFree: false,
              isSpicy: false,
              preparationTime: 20,
              ingredients: ['']
            });
            setFormImage(null);
            setImagePreview('');
            setShowForm(true);
          }}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          <span>{loading ? 'Loading...' : 'Add Menu Item'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {flatCategories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Menu Items ({filteredItems.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredItems.map((item) => (
            <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={!item.image.startsWith('/')}
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <div className="flex items-center space-x-2">
                          {item.isVegetarian && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Vegetarian
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                              Vegan
                            </span>
                          )}
                          {item.isGlutenFree && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Gluten Free
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              Spicy
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>${item.price.toFixed(2)}</span>
                        <span>•</span>
                        <span>{item.preparationTime} min prep</span>
                        <span>•</span>
                        <span className={`font-medium ${
                          item.isAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      
                      {item.ingredients.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Ingredients: {item.ingredients.join(', ')}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAvailability(item._id, item.isAvailable)}
                        disabled={toggling === item._id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          item.isAvailable 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={item.isAvailable ? 'Make Unavailable' : 'Make Available'}
                      >
                        {toggling === item._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : item.isAvailable ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deleting === item._id || toggling === item._id}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleting === item._id || toggling === item._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === item._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No menu items found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image
                </label>
                <div className="space-y-4">
                  {(imagePreview || formData.image) && (
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={imagePreview || formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || submitting}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingImage || submitting}
                    />
                    
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WebP, GIF • Max 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Margherita Pizza"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Describe the menu item..."
                  disabled={submitting}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="">Select a category</option>
                    {flatCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
              </div>
              
              {/* Dietary Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dietary Information
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">Vegetarian</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isVegan}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVegan: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">Vegan</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isGlutenFree}
                      onChange={(e) => setFormData(prev => ({ ...prev, isGlutenFree: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">Gluten Free</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isSpicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, isSpicy: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">Spicy</span>
                  </label>
                </div>
              </div>
              
              {/* Ingredients */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ingredients
                  </label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    + Add Ingredient
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Ingredient name"
                        disabled={submitting}
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={submitting}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-700">Available for ordering</span>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Update' : 'Create'} Menu Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}