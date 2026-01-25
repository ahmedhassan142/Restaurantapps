// app/admin/menu-items/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, Loader2, Utensils } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    preparationTime: 20,
    ingredients: ['']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching menu items and categories...');
      
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch('/api/menu?includeInactive=true'),
        fetch('/api/categories')
      ]);

      console.log('Menu items response:', itemsRes.status);
      console.log('Categories response:', categoriesRes.status);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        console.log('Menu items data:', itemsData);
        setMenuItems(itemsData.menuItems || []);
      } else {
        console.error('Failed to fetch menu items');
        alert('Failed to load menu items');
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        console.log('Categories data:', categoriesData);
        setCategories(categoriesData.categories || []);
      } else {
        console.error('Failed to fetch categories');
        alert('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Check console for details.');
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
      const url = editingItem 
        ? `/api/menu/${editingItem._id}`
        : '/api/menu';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const ingredients = formData.ingredients.filter(ing => ing.trim() !== '');
      
      const payload = { ...formData, ingredients };
      
      console.log('Submitting menu item:', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Submit response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Submit success:', result);
        
        // Close form and reset
        setShowForm(false);
        setEditingItem(null);
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isSpicy: false,
          preparationTime: 20,
          ingredients: ['']
        });
        
        // Refresh data
        await fetchData();
        
        alert(editingItem ? 'Menu item updated successfully!' : 'Menu item created successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit failed:', errorData);
        alert(errorData.error || errorData.message || 'Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('An error occurred while saving. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    console.log('Editing menu item:', item);
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      isSpicy: item.isSpicy,
      preparationTime: item.preparationTime,
      ingredients: item.ingredients.length > 0 ? item.ingredients : ['']
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    setDeleting(itemId);
    
    try {
      console.log('Deleting menu item:', itemId);
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });

      console.log('Delete response:', response.status);

      if (response.ok) {
        await fetchData();
        alert('Menu item deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        alert(errorData.error || errorData.message || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('An error occurred while deleting. Check console for details.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setToggling(itemId);
    
    try {
      console.log('Toggling availability:', { itemId, currentStatus });
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });

      console.log('Toggle response:', response.status);

      if (response.ok) {
        await fetchData();
        alert(`Menu item ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Toggle failed:', errorData);
        alert('Failed to update menu item status');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('An error occurred while updating. Check console for details.');
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
            console.log('Opening add menu item form');
            setEditingItem(null);
            setFormData({
              name: '',
              description: '',
              price: 0,
              category: '',
              isAvailable: true,
              isVegetarian: false,
              isVegan: false,
              isGlutenFree: false,
              isSpicy: false,
              preparationTime: 20,
              ingredients: ['']
            });
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
              <div className="flex items-center justify-between">
                <div className="flex-1">
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