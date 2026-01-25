// app/admin/featured-items/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Calendar, Eye, EyeOff, Loader2 } from 'lucide-react';

interface FeaturedItem {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  badgeText: string;
  badgeColor: string;
  menuItem: {
    _id: string;
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
  };
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export default function FeaturedItemsPage() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);

  const [formData, setFormData] = useState({
    menuItem: '',
    title: '',
    description: '',
    order: 0,
    isActive: true,
    startDate: '',
    endDate: '',
    badgeText: 'Featured',
    badgeColor: 'orange'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching featured items and menu items...');
      
      const [featuredRes, menuRes] = await Promise.all([
        fetch('/api/featured?includeInactive=true&admin=true'),
        fetch('/api/menu?includeInactive=true')
      ]);

      console.log('Featured response:', featuredRes.status);
      console.log('Menu response:', menuRes.status);

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json();
        console.log('Featured items data:', featuredData);
        setFeaturedItems(featuredData.featuredItems || []);
      } else {
        console.error('Failed to fetch featured items');
        alert('Failed to load featured items');
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        console.log('Menu items data:', menuData);
        setMenuItems(menuData.menuItems || []);
      } else {
        console.error('Failed to fetch menu items');
        alert('Failed to load menu items');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.menuItem) {
      alert('Please select a menu item');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (formData.order < 0) {
      alert('Order cannot be negative');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const url = editingItem 
        ? `/api/featured/${editingItem._id}`
        : '/api/featured';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
      };

      console.log('Submitting featured item:', { url, method, payload });

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
          menuItem: '',
          title: '',
          description: '',
          order: 0,
          isActive: true,
          startDate: '',
          endDate: '',
          badgeText: 'Featured',
          badgeColor: 'orange'
        });
        
        // Refresh data
        await fetchData();
        
        alert(editingItem ? 'Featured item updated successfully!' : 'Featured item created successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit failed:', errorData);
        alert(errorData.error || errorData.message || 'Failed to save featured item');
      }
    } catch (error) {
      console.error('Error saving featured item:', error);
      alert('An error occurred while saving. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: FeaturedItem) => {
    console.log('Editing featured item:', item);
    setEditingItem(item);
    setFormData({
      menuItem: item.menuItem._id,
      title: item.title,
      description: item.description,
      order: item.order,
      isActive: item.isActive,
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      badgeText: item.badgeText,
      badgeColor: item.badgeColor
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this featured item?')) return;

    setDeleting(itemId);
    
    try {
      console.log('Deleting featured item:', itemId);
      const response = await fetch(`/api/featured/${itemId}`, {
        method: 'DELETE'
      });

      console.log('Delete response:', response.status);

      if (response.ok) {
        await fetchData();
        alert('Featured item deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        alert(errorData.error || errorData.message || 'Failed to delete featured item');
      }
    } catch (error) {
      console.error('Error deleting featured item:', error);
      alert('An error occurred while deleting. Check console for details.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (itemId: string, currentStatus: boolean) => {
    setToggling(itemId);
    
    try {
      console.log('Toggling active status:', { itemId, currentStatus });
      const response = await fetch(`/api/featured/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      console.log('Toggle response:', response.status);

      if (response.ok) {
        await fetchData();
        alert(`Featured item ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Toggle failed:', errorData);
        alert('Failed to update featured item status');
      }
    } catch (error) {
      console.error('Error updating featured item:', error);
      alert('An error occurred while updating. Check console for details.');
    } finally {
      setToggling(null);
    }
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800'
    };
    return colors[color as keyof typeof colors] || colors.orange;
  };

  const isCurrentlyActive = (item: FeaturedItem) => {
    if (!item.isActive) return false;
    
    const now = new Date();
    if (item.startDate && new Date(item.startDate) > now) return false;
    if (item.endDate && new Date(item.endDate) < now) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Featured Items</h1>
          <p className="text-gray-600 mt-2">Manage featured and trending menu items</p>
        </div>
        <button
          onClick={() => {
            console.log('Opening add featured item form');
            setEditingItem(null);
            setFormData({
              menuItem: '',
              title: '',
              description: '',
              order: 0,
              isActive: true,
              startDate: '',
              endDate: '',
              badgeText: 'Featured',
              badgeColor: 'orange'
            });
            setShowForm(true);
          }}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          <span>{loading ? 'Loading...' : 'Add Featured Item'}</span>
        </button>
      </div>

      {/* Featured Items Grid */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Featured Items ({featuredItems.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {featuredItems.map((item) => {
            const currentlyActive = isCurrentlyActive(item);
            
            return (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className={`w-5 h-5 ${
                        currentlyActive ? 'text-yellow-500 fill-current' : 'text-gray-400'
                      }`} />
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(item.badgeColor)}`}>
                        {item.badgeText}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive 
                            ? currentlyActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.isActive 
                            ? currentlyActive ? 'Active' : 'Scheduled'
                            : 'Inactive'
                          }
                        </span>
                        {!item.menuItem.isAvailable && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Menu Item Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium text-gray-900">
                        {item.menuItem.name} - ${item.menuItem.price}
                      </span>
                      <span>•</span>
                      <span>Order: {item.order}</span>
                      {(item.startDate || item.endDate) && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No start'}
                              {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString()}`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(item._id, item.isActive)}
                      disabled={toggling === item._id}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        item.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={item.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {toggling === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.isActive ? (
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
            );
          })}
          
          {featuredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No featured items found. Create your first featured item to highlight special menu items.</p>
            </div>
          )}
        </div>
      </div>

      {/* Featured Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Featured Item' : 'Add New Featured Item'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Item *
                </label>
                <select
                  required
                  value={formData.menuItem}
                  onChange={(e) => {
                    const selectedItem = menuItems.find(item => item._id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      menuItem: e.target.value,
                      title: selectedItem?.name || prev.title,
                      description: selectedItem ? `Featured: ${selectedItem.name}` : prev.description
                    }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="">Select a menu item</option>
                  {menuItems
                    .filter(item => item.isAvailable)
                    .map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} - ${item.price} ({item.category})
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Featured item title"
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Description for the featured item"
                  disabled={submitting}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData(prev => ({ ...prev, badgeText: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Featured, Trending"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge Color
                  </label>
                  <select
                    value={formData.badgeColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="yellow">Yellow</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-700">Active</span>
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
                    <span>{editingItem ? 'Update' : 'Create'} Featured Item</span>
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