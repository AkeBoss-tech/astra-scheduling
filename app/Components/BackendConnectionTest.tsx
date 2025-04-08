'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const BackendConnectionTest = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('loading');
        console.log('Testing connection to:', `${API_URL}/api/hello`);
        const response = await axios.get(`${API_URL}/api/hello`);
        
        if (response.status === 200) {
          setStatus('connected');
          setMessage(JSON.stringify(response.data));
          console.log('Backend connection successful:', response.data);
        } else {
          setStatus('error');
          setError(`Unexpected status: ${response.status}`);
          console.error('Backend connection error:', response.status);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Failed to connect to backend');
        console.error('Backend connection failed:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 rounded-lg bg-gray-800 mb-5">
      <h2 className="text-lg font-semibold mb-2">Backend Connection Status</h2>
      
      {status === 'loading' && (
        <div className="flex items-center text-yellow-400">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Testing connection to Flask backend...
        </div>
      )}
      
      {status === 'connected' && (
        <div className="text-green-400">
          <div className="font-semibold">✓ Connected to Flask backend</div>
          <div className="text-sm mt-1">Response: {message}</div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-red-400">
          <div className="font-semibold">✗ Failed to connect to Flask backend</div>
          <div className="text-sm mt-1">Error: {error}</div>
          <div className="text-sm mt-3 text-gray-400">
            Please ensure:
            <ul className="list-disc list-inside mt-1">
              <li>Flask server is running on {API_URL}</li>
              <li>CORS is properly configured on the backend</li>
              <li>Network connectivity is available</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendConnectionTest;
