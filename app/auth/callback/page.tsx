'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/Components/AuthProvider';
import { authService } from '@/app/services/api';

// Loading component to show while the callback is processing
function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
            <span className="text-purple-400">♦</span> Astra
          </h1>
          <h2 className="mt-6 text-xl font-bold text-white">Authentication</h2>
        </div>
        <div className="mt-8">
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white text-center">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// The actual callback component that uses searchParams
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorMsg = searchParams.get('error');

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      setIsLoading(false);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google');
      setIsLoading(false);
      return;
    }

    const handleCallback = async () => {
      try {
        console.log('Exchanging code for token...');
        const response = await authService.handleGoogleCallback(code);
        
        if (!response.data.token) {
          throw new Error('No token received from server');
        }

        console.log('Token received, signing in...');
        await signIn(response.data.token);
        
        console.log('Sign in successful, redirecting...');
        router.push('/scheduling');
      } catch (err: any) {
        console.error('Error during authentication:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Authentication failed';
        setError(`Authentication error: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, signIn, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg text-white">Processing your sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Authentication Error</h2>
          </div>
          <div className="bg-red-900/30 border border-red-500 rounded-md p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Main component that uses Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
