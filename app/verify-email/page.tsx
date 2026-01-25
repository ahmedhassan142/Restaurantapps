// app/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // If token is in URL, verify it automatically
    if (token) {
      verifyToken(token);
    } else {
      // Check if user is logged in and needs verification
      checkVerificationStatus();
    }
  }, [token]);

  const checkVerificationStatus = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.user.email);
        
        if (data.user.isEmailVerified) {
          setStatus('success');
          setMessage('Your email is already verified. You can now place orders.');
        } else {
          setStatus('idle');
          setMessage('Please verify your email to activate your account.');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const verifyToken = async (verificationToken: string) => {
    setStatus('loading');
    
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        toast.success('Email verified! You can now place orders.');
        
        // Redirect to customer dashboard after 3 seconds
        setTimeout(() => {
          router.push('/customer/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
        toast.error('Verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      toast.error('An error occurred. Please try again.');
    }
  };

  const resendVerificationEmail = async () => {
    setStatus('loading');
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Verification email sent! Please check your inbox.');
        toast.success('Verification email sent!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send verification email.');
        toast.error('Failed to send email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
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
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">Complete your account setup</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Email Verified!</h3>
              <p className="text-gray-600">{message}</p>
              <div className="pt-4">
                <Link
                  href="/customer/dashboard"
                  className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verification Failed</h3>
              <p className="text-gray-600">{message}</p>
              <div className="pt-4 space-y-3">
                <button
                  onClick={resendVerificationEmail}
                  className="w-full flex items-center justify-center bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </button>
                <Link
                  href="/login"
                  className="inline-block text-orange-600 hover:text-orange-700 font-medium"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {status === 'idle' && !token && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Email Verification Required</h3>
                <p className="text-gray-600">
                  We've sent a verification email to <strong>{userEmail || 'your email address'}</strong>.
                  Please check your inbox and click the verification link to activate your account.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-800 mb-2">📬 Can't find the email?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={resendVerificationEmail}
                  className="w-full flex items-center justify-center bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </button>
                
                <div className="text-sm text-gray-600">
                  <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                    Return to Login
                  </Link>
                  {' '}or{' '}
                  <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}