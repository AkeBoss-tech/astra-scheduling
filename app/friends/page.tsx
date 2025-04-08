'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/Components/AuthProvider';
import { useRouter } from 'next/navigation';

// Types for friends and shared schedules
interface Friend {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface SharedSchedule {
  id: string;
  name: string;
  owner: string;
  courses: any[];
}

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sharedSchedules, setSharedSchedules] = useState<Record<string, SharedSchedule[]>>({});
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load friends and shared schedules
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  // Mock function to load friends - would be replaced with API call
  const loadFriends = async () => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockFriends = [
        { id: '1', name: 'Alex Johnson', email: 'alex@example.com', image: 'https://i.pravatar.cc/150?img=1' },
        { id: '2', name: 'Sam Smith', email: 'sam@example.com', image: 'https://i.pravatar.cc/150?img=2' },
        { id: '3', name: 'Taylor Wilson', email: 'taylor@example.com', image: 'https://i.pravatar.cc/150?img=3' },
      ];
      
      const mockPendingRequests = [
        { id: '4', name: 'Jordan Lee', email: 'jordan@example.com', image: 'https://i.pravatar.cc/150?img=4' },
      ];
      
      const mockSharedSchedules = {
        '1': [
          { id: 's1', name: 'Fall 2023 Schedule', owner: 'Alex Johnson', courses: [] },
          { id: 's2', name: 'Spring 2024 Plan', owner: 'Alex Johnson', courses: [] },
        ],
        '2': [
          { id: 's3', name: 'Computer Science Track', owner: 'Sam Smith', courses: [] },
        ],
      };
      
      setFriends(mockFriends);
      setPendingRequests(mockPendingRequests);
      setSharedSchedules(mockSharedSchedules);
      
      if (mockFriends.length > 0 && !selectedFriend) {
        setSelectedFriend(mockFriends[0].id);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchFriend = async () => {
    if (!searchEmail.trim()) return;
    
    try {
      setIsSearching(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const results = [
        { id: '5', name: 'Jamie Parker', email: searchEmail, image: 'https://i.pravatar.cc/150?img=5' },
      ];
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching for friend:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSendFriendRequest = async (friendId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from search results
      setSearchResults(prev => prev.filter(friend => friend.id !== friendId));
      
      // Show success message or notification
      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };
  
  const handleAcceptFriendRequest = async (friendId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Move from pending to friends
      const friend = pendingRequests.find(req => req.id === friendId);
      if (friend) {
        setFriends(prev => [...prev, friend]);
        setPendingRequests(prev => prev.filter(req => req.id !== friendId));
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };
  
  const handleDeclineFriendRequest = async (friendId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== friendId));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };
  
  const renderSchedule = (friendId: string) => {
    const schedules = sharedSchedules[friendId] || [];
    
    if (schedules.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <p>No shared schedules from this friend.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {schedules.map(schedule => (
          <div key={schedule.id} className="card hover:border-purple-500/50">
            <h3 className="text-lg font-semibold text-white mb-2">{schedule.name}</h3>
            <p className="text-sm text-gray-400 mb-4">Shared by {schedule.owner}</p>
            
            <button className="btn-primary">
              View Schedule
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Friends & Shared Schedules</h1>
          <p className="text-gray-300">Connect with friends and view their shared schedules</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Friend list */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add friend section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Add Friend</h2>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="input flex-1"
                />
                <button 
                  onClick={handleSearchFriend}
                  disabled={isSearching || !searchEmail.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {isSearching ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Search Results</h3>
                  {searchResults.map(result => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                          {result.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{result.name}</p>
                          <p className="text-xs text-gray-400">{result.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(result.id)}
                        className="text-sm btn-primary py-1 px-3"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Friend requests section */}
            {pendingRequests.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-white mb-4">Friend Requests</h2>
                <div className="space-y-3">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                          {request.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{request.name}</p>
                          <p className="text-xs text-gray-400">{request.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request.id)}
                          className="text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="text-sm bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded-md"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Friends list */}
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">My Friends</h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>You don't have any friends yet.</p>
                  <p className="text-sm mt-2">Search for friends to connect with them.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div 
                      key={friend.id} 
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFriend === friend.id 
                          ? 'bg-purple-600/20 border border-purple-500' 
                          : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedFriend(friend.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                        {friend.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">{friend.name}</p>
                        <p className="text-xs text-gray-400">{friend.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right section - Shared schedules */}
          <div className="lg:col-span-2">
            <div className="card h-full">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : !selectedFriend ? (
                <div className="text-center py-16 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-300 mb-2">No Friend Selected</h3>
                  <p>Select a friend to view their shared schedules</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {friends.find(f => f.id === selectedFriend)?.name}'s Shared Schedules
                    </h2>
                    <p className="text-gray-400">View and explore schedules shared with you</p>
                  </div>
                  
                  {renderSchedule(selectedFriend)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
