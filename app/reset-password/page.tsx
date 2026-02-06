// app/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setTokenValid(false);
      setTokenLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(data.error || 'Invalid or expired reset token');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to validate reset token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Reset token is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Toaster position="top-right" />
        
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center"
              >
                Request New Reset Link
              </Link>
              
              <Link
                href="/login"
                className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {success ? 'Password Reset!' : 'Create New Password'}
          </h2>
          <p className="mt-2 text-gray-600">
            {success 
              ? 'Your password has been successfully reset' 
              : 'Enter your new password below'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600">
                  Your password has been reset successfully. You will be redirected to login page shortly.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">Security Tips:</p>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• Use a unique password for each account</li>
                  <li>• Enable two-factor authentication if available</li>
                  <li>• Never share your password with anyone</li>
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="block w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12"
                    placeholder="Enter new password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                      At least 8 characters
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2">
                  {password && confirmPassword && (
                    <p className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}