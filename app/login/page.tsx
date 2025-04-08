'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/app/Components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/app/services/api';
import Link from 'next/link';
import BackendConnectionTest from '@/app/Components/BackendConnectionTest';

// Create a separate component that uses useSearchParams
function LoginWithParams() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authService.handleGoogleCallback(code);
      if (response.data.token) {
        signIn(response.data.token);
        router.push('/scheduling');
      }
    } catch (err: any) {
      console.error('Google authentication error:', err);
      setError(err.response?.data?.error || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegister) {
        // Register new user
        const response = await authService.register(name, email, password);
        if (response.data.token) {
          signIn(response.data.token);
          router.push('/scheduling');
        }
      } else {
        // Login existing user
        const response = await authService.login(email, password);
        if (response.data.token) {
          signIn(response.data.token);
          router.push('/scheduling');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authService.googleAuth();
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
      setError('Failed to initiate Google sign-in');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <span className="text-4xl font-bold text-purple-400 mr-2">♦</span>
            <h1 className="text-3xl font-bold text-white">Astra Scheduling</h1>
          </div>
          <h2 className="text-xl text-gray-300 font-medium">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
        
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-xl animate-fadeIn">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="label">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="Enter your password"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRegister ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center items-center mb-6">
          <span className="text-4xl font-bold text-purple-400 mr-2">♦</span>
          <h1 className="text-3xl font-bold text-white">Astra Scheduling</h1>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-xl">
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-300">Loading authentication...</p>
        </div>
      </div>
    </div>
  );
}

// Main component that uses Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginWithParams />
    </Suspense>
  );
}