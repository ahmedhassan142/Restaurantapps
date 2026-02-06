// components/Header.tsx - UPDATED WITH ADMIN DASHBOARD
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, ShoppingCart, Bell, Search, LayoutDashboard, Settings } from 'lucide-react';
import SearchBar from './Searchbar';
import CartModal from './CartModal';
import AccountModal from './Accountmodal';
import { useCart } from '../context/cart';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  isEmailVerified: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  const { getTotalItems, openCart } = useCart();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/Menu' },
    { name: 'About', href: '/About' },
    { name: 'Reservations', href: '/Reservation' },
    { name: 'Contact', href: '/Contact' },
  ];

  useEffect(() => {
    checkAuth();
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Get current user ID before clearing
      const userId = localStorage.getItem('current_user_id');
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear user-specific cart data
      if (userId) {
        localStorage.removeItem(`epicurean_cart_user_${userId}`);
        localStorage.removeItem('current_user_id');
      }
      
      // Create new guest session
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', guestId);
      
      // Clear user state
      setUser(null);
      setIsAccountModalOpen(false);
      
      // Clear cart context by triggering storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'current_user_id',
        oldValue: userId || '',
        newValue: null,
        url: window.location.href,
        storageArea: localStorage
      }));
      
      // Force refresh to ensure clean state
      router.push('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Still try to clear local data even if API fails
      localStorage.removeItem('current_user_id');
      router.push('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleMyAccountClick = () => {
    setIsMenuOpen(false);
    if (user) {
      setIsAccountModalOpen(true);
    } else {
      router.push('/login');
    }
  };

  const handleDashboardClick = () => {
    setIsMenuOpen(false);
    setIsAccountModalOpen(false);
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/customer/dashboard');
    }
  };

  // Don't show header on login/signup pages or admin pages
  if (pathname === '/login' || 
      pathname === '/signup' || 
      pathname === '/verify-email' ||
      pathname.startsWith('/admin/')) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo - Left */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Epicurean
                  <span className="text-orange-600">.</span>
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium text-sm transition-all duration-200 hover:text-orange-600 px-2 py-1 ${
                    pathname === item.href 
                      ? 'text-orange-600 border-b-2 border-orange-600' 
                      : 'text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Dashboard Link (only for admin users) */}
              {/* {user?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className={`font-medium text-sm transition-all duration-200 hover:text-purple-600 px-2 py-1 flex items-center gap-1 ${
                    pathname.startsWith('/admin/dashboard') 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-purple-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )} */}
            </nav>

            {/* Right Side Items */}
            <div className="flex items-center space-x-4">
              
              {/* Desktop Search Bar */}
              <div className="hidden lg:block flex-1 max-w-md">
                <SearchBar />
              </div>

              {/* Cart Icon */}
              <button 
                onClick={openCart}
                className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Admin Dashboard Button (Desktop) - Only for admin users */}
              {user?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
                  title="Admin Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Link>
              )}

              {/* Mobile Search Button */}
              <button 
                className="lg:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Auth Section - Desktop */}
              <div className="hidden md:flex items-center space-x-4">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ) : user ? (
                  <div className="flex items-center space-x-4">
                    {/* Notification for unverified email */}
                    {user.role === 'customer' && !user.isEmailVerified && (
                      <Link 
                        href="/verify-email" 
                        className="relative p-2 text-yellow-600 hover:text-yellow-700"
                        title="Verify your email"
                      >
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          !
                        </span>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleMyAccountClick}
                      className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                      aria-label="My Account"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden lg:inline">My Account</span>
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                      aria-label="Sign Out"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 bg-white">
              <div className="w-full px-4">
                <SearchBar onClose={() => setIsSearchOpen(false)} />
              </div>
            </div>
          )}

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
              <div className="px-4 py-4">
                {/* Mobile Navigation Links */}
                <div className="mb-6">
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                          pathname === item.href 
                            ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    {/* Admin Dashboard Link (Mobile) */}
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        className={`flex items-center py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                          pathname.startsWith('/admin/dashboard')
                            ? 'bg-purple-50 text-purple-600 border border-purple-200' 
                            : 'text-purple-700 hover:bg-purple-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        <span>Dashboard</span>
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>
                
                {/* Mobile Auth Section */}
                <div>
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      {/* Email verification warning */}
                      {user.role === 'customer' && !user.isEmailVerified && (
                        <Link
                          href="/verify-email"
                          className="flex items-center justify-between text-yellow-700 bg-yellow-50 py-3 px-4 rounded-lg mb-2"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <Bell className="w-5 h-5 mr-3" />
                            <span>Verify Email</span>
                          </div>
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">!</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={handleMyAccountClick}
                        className="flex items-center w-full text-gray-700 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-5 h-5 mr-3" />
                        <span>My Account</span>
                      </button>

                      {/* Customer Dashboard Link */}
                      {user.role === 'customer' && (
                        <button
                          onClick={handleDashboardClick}
                          className="flex items-center w-full text-gray-700 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span>My Dashboard</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full text-gray-700 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mt-2"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="flex items-center justify-center text-gray-700 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3" />
                        <span>Sign In</span>
                      </Link>
                      
                      <Link
                        href="/signup"
                        className="block w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cart Modal */}
      <CartModal />
      
      {/* Account Modal */}
      {user && (
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          user={user}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
};

export default Header;