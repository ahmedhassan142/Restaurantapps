// components/AdminSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Utensils, 
  Tags, 
  Star, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AdminSidebarProps {
  user: User;
  onLogout: () => Promise<void>;
}

const AdminSidebar = ({ user, onLogout }: AdminSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Menu Items',
      href: '/admin/menu-items',
      icon: Utensils
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Tags
    },
    {
      name: 'Featured Items',
      href: '/admin/featured-items',
      icon: Star
    },
    {
      name: 'Reservations',
      href: '/admin/reservations',
      icon: Calendar
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: Users
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings
    }
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (user?.role === 'staff') {
      return ['Dashboard', 'Reservations', 'Customers'].includes(item.name);
    }
    // Show all for admin and manager
    if (user?.role === 'admin' || user?.role === 'manager') {
      return true;
    }
    return false;
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Link href="/admin/dashboard" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Epicurean Admin</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {user?.name || 'User'}
              </p>
              <p className="text-gray-500 text-xs">
                {user?.email || ''}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full capitalize">
                {user?.role || 'staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4">
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-orange-600 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                <span className="font-medium">Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AdminSidebar;