'use client';

import { useState, useEffect } from 'react';
import { userService, friendService } from '@/app/services/api';
import { useAuth } from '@/app/Components/AuthProvider';

interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  created_at?: string;
  friendship_status?: 'none' | 'pending' | 'accepted' | 'declined';
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const [usersResponse, friendsResponse] = await Promise.all([
        userService.getAllUsers(),
        friendService.getAllFriends()
      ]);

      const friends = friendsResponse.data || [];
      const usersWithStatus = usersResponse.data.users.map((u: User) => {
        const friendship = friends.find((f: any) => 
          f.requester_id === u.id || f.addressee_id === u.id
        );
        
        return {
          ...u,
          friendship_status: friendship 
            ? friendship.status 
            : 'none'
        };
      });

      setUsers(usersWithStatus);
    } catch (err: any) {
      setError(err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFriendAction = async (targetUserId: string, action: 'add' | 'accept' | 'reject' | 'remove') => {
    if (!user) return;
    
    setActionLoading(targetUserId);
    try {
      switch (action) {
        case 'add':
          await friendService.sendFriendRequest(targetUserId);
          break;
        case 'accept':
          await friendService.acceptFriendRequest(targetUserId);
          break;
        case 'reject':
          await friendService.rejectFriendRequest(targetUserId);
          break;
        case 'remove':
          await friendService.removeFriend(targetUserId);
          break;
      }
      
      // Refresh the users list to get updated statuses
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to perform friend action');
    } finally {
      setActionLoading(null);
    }
  };

  const getFriendActionButton = (targetUser: User) => {
    if (targetUser.id === user?.id) return null;
    
    const isLoading = actionLoading === targetUser.id;
    const baseButtonClasses = "mt-4 w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50";
    
    if (isLoading) {
      return (
        <button
          disabled
          className={`${baseButtonClasses} bg-gray-600 text-white`}
        >
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        </button>
      );
    }

    switch (targetUser.friendship_status) {
      case 'none':
        return (
          <button
            onClick={() => handleFriendAction(targetUser.id, 'add')}
            className={`${baseButtonClasses} bg-purple-600 hover:bg-purple-700 text-white`}
          >
            Add Friend
          </button>
        );
      case 'pending':
        return (
          <div className="space-y-2 mt-4">
            <button
              onClick={() => handleFriendAction(targetUser.id, 'accept')}
              className={`${baseButtonClasses} bg-green-600 hover:bg-green-700 text-white`}
            >
              Accept Request
            </button>
            <button
              onClick={() => handleFriendAction(targetUser.id, 'reject')}
              className={`${baseButtonClasses} bg-red-600 hover:bg-red-700 text-white`}
            >
              Decline Request
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleFriendAction(targetUser.id, 'remove')}
            className={`${baseButtonClasses} bg-red-600 hover:bg-red-700 text-white`}
          >
            Remove Friend
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500 text-white p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Users</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                </div>
              </div>
              
              {user.created_at && (
                <p className="mt-4 text-sm text-gray-500">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              )}

              {getFriendActionButton(user)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 