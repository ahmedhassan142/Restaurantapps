// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FolderOpen, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string; slug: string };
  children: Category[];
  isActive: boolean;
  order: number;
  level: number;
  path: string[];
  slug: string;
  fullPath?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parent: '',
    order: 0,
    isActive: true
  });

  // Check user authentication and role on mount
  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  // Check user authentication and role
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserRole(data.user.role);
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/admin/login';
        }
      } else {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/admin/login';
    }
  };

  // Fetch categories function
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching categories...');
      
      const response = await fetch('/api/categories?includeInactive=true');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Categories data:', data);
        if (data.success) {
          setCategories(data.categories || []);
        } else {
          alert(data.error || 'Failed to load categories');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Error loading categories. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Get all categories for dropdown (flat list)
  const getAllCategories = (categories: Category[]): Category[] => {
    let all: Category[] = [];
    categories.forEach(cat => {
      all.push(cat);
      if (cat.children && cat.children.length > 0) {
        all = [...all, ...getAllCategories(cat.children)];
      }
    });
    return all;
  };

  // Handle image upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check user role before proceeding
    if (userRole !== 'admin' && userRole !== 'manager') {
      alert('You do not have permission to perform this action');
      return;
    }
    
    // Validation
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }
    
    if (formData.order < 0) {
      alert('Order cannot be negative');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory._id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      console.log('Submitting category:', { url, method, formData });
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify(formData)
      });

      console.log('Submit response:', response.status);
      
      const result = await response.json();
      console.log('Submit result:', result);
      
      if (response.ok && result.success) {
        // Close form and reset
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ 
          name: '', 
          description: '', 
          image: '', 
          parent: '', 
          order: 0, 
          isActive: true 
        });
        setImagePreview(null);
        
        // Refresh categories
        await fetchCategories();
        
        alert(result.message || 'Category saved successfully!');
      } else {
        alert(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('An error occurred while saving. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit category
  const handleEdit = (category: Category) => {
    // Check user role before allowing edit
    if (userRole !== 'admin' && userRole !== 'manager') {
      alert('You do not have permission to edit categories');
      return;
    }
    
    console.log('Editing category:', category);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parent: category.parent?._id || '',
      order: category.order,
      isActive: category.isActive
    });
    setImagePreview(category.image || null);
    setShowForm(true);
  };

  // Handle delete category
  const handleDelete = async (categoryId: string) => {
    // Check user role before allowing delete
    if (userRole !== 'admin') {
      alert('Only administrators can delete categories');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    setDeleting(categoryId);
    
    try {
      console.log('Deleting category:', categoryId);
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include' // Important for sending cookies
      });

      console.log('Delete response:', response.status);
      
      const result = await response.json();
      console.log('Delete result:', result);
      
      if (response.ok && result.success) {
        await fetchCategories();
        alert(result.message || 'Category deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('An error occurred while deleting. Check console for details.');
    } finally {
      setDeleting(null);
    }
  };

  // Toggle category active status
  const toggleActiveStatus = async (categoryId: string, currentStatus: boolean) => {
    // Check user role before allowing toggle
    if (userRole !== 'admin' && userRole !== 'manager') {
      alert('You do not have permission to modify category status');
      return;
    }
    
    setToggling(categoryId);
    
    try {
      console.log('Toggling category status:', categoryId);
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify({ isActive: !currentStatus })
      });

      console.log('Toggle response:', response.status);
      
      const result = await response.json();
      console.log('Toggle result:', result);
      
      if (response.ok && result.success) {
        await fetchCategories();
        alert(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert(result.error || 'Failed to update category status');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      alert('An error occurred while updating. Check console for details.');
    } finally {
      setToggling(null);
    }
  };

  // Render category tree
  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category._id);
      const Icon = hasChildren ? (isExpanded ? FolderOpen : Folder) : Folder;

      return (
        <div key={category._id}>
          <div 
            className="flex mt-14 items-center space-x-3 py-3 px-4 hover:bg-gray-50 rounded-lg"
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleCategory(category._id)}
                className="p-1 hover:bg-gray-200 rounded"
                type="button"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${
                category.isActive ? 'text-orange-600' : 'text-gray-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {category.image && (
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className={`font-medium truncate ${
                    category.isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {category.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 flex-wrap">
                    <span>Slug: {category.slug}</span>
                    <span>•</span>
                    <span>Level: {category.level}</span>
                    <span>•</span>
                    <span className="truncate max-w-xs">
                      Path: {category.fullPath || category.path?.join(' > ') || category.name}
                    </span>
                  </div>
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-gray-500 mt-1 truncate">{category.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
              
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Order: {category.order}
              </span>
              
              <button
                onClick={() => toggleActiveStatus(category._id, category.isActive)}
                disabled={toggling === category._id}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  category.isActive 
                    ? 'text-yellow-600 hover:bg-yellow-50' 
                    : 'text-green-600 hover:bg-green-50'
                }`}
                type="button"
                title={category.isActive ? 'Deactivate' : 'Activate'}
              >
                {toggling === category._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : category.isActive ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              
              {userRole && (userRole === 'admin' || userRole === 'manager') && (
                <>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={deleting === category._id || toggling === category._id}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      disabled={deleting === category._id || toggling === category._id}
                    >
                      {deleting === category._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {hasChildren && isExpanded && renderCategoryTree(category.children, level + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-2">Manage your menu categories and subcategories</p>
        </div>
        {userRole && (userRole === 'admin' || userRole === 'manager') ? (
          <button
            onClick={() => {
              console.log('Opening add category form');
              setEditingCategory(null);
              setFormData({ 
                name: '', 
                description: '', 
                image: '', 
                parent: '', 
                order: 0, 
                isActive: true 
              });
              setImagePreview(null);
              setShowForm(true);
            }}
            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            type="button"
          >
            <Plus className="w-5 h-5" />
            <span>{loading ? 'Loading...' : 'Add Category'}</span>
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            {userRole ? 'Read-only access' : 'Loading permissions...'}
          </div>
        )}
      </div>

      {/* Categories Tree */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Category Structure</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {categories.length} categories
              </span>
              {userRole && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userRole === 'admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : userRole === 'manager'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.length > 0 ? (
            renderCategoryTree(categories)
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No categories found. Create your first category to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-lg border border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="category-image"
                      disabled={submitting}
                    />
                    <label
                      htmlFor="category-image"
                      className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Choose Image
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, image: '' }));
                        }}
                        className="ml-3 text-sm text-red-600 hover:text-red-800"
                        disabled={submitting}
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 500×500px, Max 2MB, JPG or PNG
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Appetizers, Main Courses"
                  disabled={submitting}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Optional category description"
                  disabled={submitting}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>
              
              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="">No Parent (Top Level)</option>
                  {getAllCategories(categories)
                    .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {'- '.repeat(cat.level)} {cat.name}
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create a top-level category
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers display first
                  </p>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setImagePreview(null);
                  }}
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
                    <span>{editingCategory ? 'Update' : 'Create'} Category</span>
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