// components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, ShoppingCart, Bell } from 'lucide-react';
import SearchBar from './Searchbar';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  isEmailVerified: boolean;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/Menu' },
    // { name: 'Order Online', href: '/Order' },
    { name: 'About', href: '/About' },
    { name: 'Reservations', href: '/Reservation' },
    { name: 'Contact', href: '/Contact' },
  ];

  useEffect(() => {
    checkAuth();
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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAdminClick = () => {
    setIsMenuOpen(false);
    router.push('/admin/dashboard');
  };

  const handleSignInClick = () => {
    setIsMenuOpen(false);
    router.push('/login');
  };

  const handleDashboardClick = () => {
    setIsMenuOpen(false);
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/customer/dashboard');
    }
  };

  // Don't show header on login/signup pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/verify-email') {
    return null;
  }

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900">
                Epicurean
                <span className="text-orange-600">.</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-6 mx-8">
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
          </nav>

          {/* Search Bar - Center (on larger screens) */}
          <div className="hidden lg:block flex-1 max-w-xs mx-6">
            <SearchBar />
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Mobile and Tablet */}
            <div className="lg:hidden mr-2">
              <SearchBar />
            </div>

            {/* Cart Icon (for customers) */}
            {user?.role === 'customer' && (
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-orange-600">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>
            )}

            {/* Auth Section - Desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-3">
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
                    onClick={handleDashboardClick}
                    className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                  >
                    <User className="w-4 h-4 mr-1" />
                    <span>{user.role === 'admin' ? 'Dashboard' : ''}</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200 bg-white">
            {/* Mobile Navigation Links */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium py-2 px-3 rounded-lg text-sm text-center transition-colors ${
                    pathname === item.href 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Mobile Auth Links */}
            <div className="border-t border-gray-200 pt-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  {/* Email verification warning */}
                  {user.role === 'customer' && !user.isEmailVerified && (
                    <Link
                      href="/verify-email"
                      className="flex items-center justify-center text-yellow-700 bg-yellow-50 py-2 px-3 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      <span>Verify Email</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg w-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>{user.role === 'admin' ? 'Admin Dashboard' : 'My Account'}</span>
                  </button>
                  
                  {user.role === 'customer' && (
                    <Link
                      href="/cart"
                      className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      <span>Cart (3)</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleSignInClick}
                    className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg w-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>Sign In</span>
                  </button>
                  
                  <Link
                    href="/signup"
                    className="block w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              )}
              
              <Link
                href="/Reservation"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center mt-3"
                onClick={() => setIsMenuOpen(false)}
              >
                Reserve Table
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;