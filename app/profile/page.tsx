'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/Components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [courseLists, setCourseLists] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadUserData();
    }
  }, [user, loading, router]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/login');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-300">Manage your account and view your saved content</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left sidebar - User info and navigation */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">{user?.name || 'User'}</h2>
                <p className="text-gray-400 mb-4">{user?.email || 'user@example.com'}</p>
                <button 
                  onClick={handleSignOut}
                  className="btn-secondary w-full"
                >
                  Sign Out
                </button>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                    activeTab === 'profile' 
                      ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500 pl-2' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Profile Information
                </button>
                <button 
                  onClick={() => setActiveTab('schedules')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                    activeTab === 'schedules' 
                      ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500 pl-2' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Saved Schedules
                </button>
                <button 
                  onClick={() => setActiveTab('courses')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                    activeTab === 'courses' 
                      ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500 pl-2' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  Course Lists
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                    activeTab === 'settings' 
                      ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500 pl-2' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Settings
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3">
            <div className="card min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="label">Full Name</label>
                      <input 
                        type="text" 
                        value={user?.name || ''} 
                        className="input" 
                        placeholder="Your name"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="label">Email Address</label>
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        className="input" 
                        placeholder="Your email"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="label">Account Type</label>
                      <div className="p-3 bg-gray-700 rounded-lg text-white">
                        Student
                      </div>
                    </div>
                    
                    <div>
                      <label className="label">Member Since</label>
                      <div className="p-3 bg-gray-700 rounded-lg text-white">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'schedules' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">Saved Schedules</h2>
                  
                  {savedSchedules.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-xl font-medium text-gray-300 mb-2">No Saved Schedules</h3>
                      <p>You haven't saved any schedules yet.</p>
                      <button 
                        onClick={() => router.push('/scheduling')}
                        className="btn-primary mt-4"
                      >
                        Create a Schedule
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedSchedules.map((schedule: any) => (
                        <div key={schedule.id} className="border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
                          <h3 className="text-lg font-semibold text-white mb-1">{schedule.name}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            Created on {new Date(schedule.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex space-x-2">
                            <button className="btn-primary py-1 px-3 text-sm">View</button>
                            <button className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm transition-colors">Share</button>
                            <button className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1 px-3 rounded text-sm transition-colors">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'courses' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">Course Lists</h2>
                  
                  {courseLists.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="text-xl font-medium text-gray-300 mb-2">No Course Lists</h3>
                      <p>You haven't created any course lists yet.</p>
                      <button 
                        onClick={() => router.push('/explore')}
                        className="btn-primary mt-4"
                      >
                        Explore Courses
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courseLists.map((list: any) => (
                        <div key={list.id} className="border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
                          <h3 className="text-lg font-semibold text-white mb-1">{list.name}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            Created on {new Date(list.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex space-x-2">
                            <button className="btn-primary py-1 px-3 text-sm">View</button>
                            <button className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm transition-colors">Share</button>
                            <button className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1 px-3 rounded text-sm transition-colors">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Preferences</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500 bg-gray-700" />
                          <span className="ml-2 text-gray-300">Email notifications for friend requests</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500 bg-gray-700" />
                          <span className="ml-2 text-gray-300">Email notifications for shared schedules</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500 bg-gray-700" />
                          <span className="ml-2 text-gray-300">Dark mode (always on)</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Account Security</h3>
                      
                      <button className="btn-secondary">
                        Change Password
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Danger Zone</h3>
                      
                      <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 