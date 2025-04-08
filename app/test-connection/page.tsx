'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/Components/AuthProvider';
import axios from 'axios';
import BackendConnectionTest from '@/app/Components/BackendConnectionTest';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TestConnectionPage() {
  const { user, loading } = useAuth();
  const [apiTests, setApiTests] = useState<{
    endpoint: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    response?: any;
    error?: string;
  }[]>([
    { endpoint: '/api/hello', status: 'idle' },
    { endpoint: '/api/courses/departments', status: 'idle' },
    { endpoint: '/api/auth/current-user', status: 'idle' }
  ]);

  const runApiTest = async (index: number) => {
    const test = apiTests[index];
    const updatedTests = [...apiTests];
    updatedTests[index] = { ...test, status: 'loading' };
    setApiTests(updatedTests);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      console.log(`Testing ${test.endpoint} with headers:`, headers);
      const response = await axios.get(`${API_URL}${test.endpoint}`, { headers });
      
      updatedTests[index] = { 
        ...test, 
        status: 'success', 
        response: response.data,
        error: undefined
      };
    } catch (err: any) {
      console.error(`Error testing ${test.endpoint}:`, err);
      updatedTests[index] = { 
        ...test, 
        status: 'error', 
        error: err.message || 'Unknown error',
        response: err.response?.data
      };
    }
    
    setApiTests(updatedTests);
  };

  const runAllTests = () => {
    apiTests.forEach((_, index) => {
      runApiTest(index);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Backend Connection Test Dashboard</h1>
        
        <div className="mb-8">
          <BackendConnectionTest />
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">API Connection Tests</h2>
            <button 
              onClick={runAllTests}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Run All Tests
            </button>
          </div>
          
          <div className="space-y-4">
            {apiTests.map((test, index) => (
              <div key={test.endpoint} className="bg-gray-700 rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-white">{test.endpoint}</h3>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      test.status === 'idle' ? 'bg-gray-600 text-gray-300' :
                      test.status === 'loading' ? 'bg-yellow-600 text-yellow-100' : 
                      test.status === 'success' ? 'bg-green-600 text-green-100' : 
                      'bg-red-600 text-red-100'
                    }`}>
                      {test.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => runApiTest(index)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                      disabled={test.status === 'loading'}
                    >
                      {test.status === 'loading' ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>
                
                {test.status === 'loading' && (
                  <div className="flex items-center text-yellow-400 text-sm">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing connection...
                  </div>
                )}
                
                {test.status === 'success' && (
                  <div className="mt-2">
                    <p className="text-green-400 text-sm mb-1">Success!</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-40">
                      {JSON.stringify(test.response, null, 2)}
                    </pre>
                  </div>
                )}
                
                {test.status === 'error' && (
                  <div className="mt-2">
                    <p className="text-red-400 text-sm mb-1">Error: {test.error}</p>
                    {test.response && (
                      <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-40">
                        {JSON.stringify(test.response, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
          
          {loading ? (
            <div className="flex items-center text-yellow-400">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking authentication status...
            </div>
          ) : user ? (
            <div>
              <div className="text-green-400 mb-2">✓ Authenticated</div>
              <div className="bg-gray-900 p-4 rounded">
                <p className="text-white mb-1"><span className="font-semibold">Name:</span> {user.name}</p>
                <p className="text-white mb-1"><span className="font-semibold">Email:</span> {user.email}</p>
                <p className="text-white"><span className="font-semibold">ID:</span> {user.id}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-red-400 mb-2">✗ Not authenticated</div>
              <p className="text-gray-300 mb-3">You are not currently signed in.</p>
              <Link href="/login" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded inline-block">
                Go to Login Page
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Google Auth Redirect Setup</h2>
          
          <div className="text-gray-300">
            <p className="mb-4">Check if the Google Auth redirection is properly configured:</p>
            
            <h3 className="text-white font-medium mb-2">Current Configuration:</h3>
            <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto mb-4">
              {`API_URL: ${API_URL}
Google Auth Endpoint: ${API_URL}/api/auth/login/google
Frontend Redirect URL: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}/auth/callback`}
            </pre>
            
            <h3 className="text-white font-medium mb-2">Test Google Auth Redirect:</h3>
            <button 
              onClick={() => window.location.href = `${API_URL}/api/auth/login/google`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Test Google Sign In
            </button>
            
            <div className="mt-6 text-sm border-t border-gray-700 pt-4">
              <p className="mb-2">Make sure your Flask backend has the following environment variables set:</p>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto">
                {`FRONTEND_URL=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
