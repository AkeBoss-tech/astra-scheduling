import React, { useState, useEffect } from 'react';
import { friendService } from '@/app/services/api';
import { useAuth } from '@/app/Components/AuthProvider';

interface Friend {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
}

interface FriendRequest {
    id: string;
    sender: Friend;
    createdAt: string;
}

export default function Friends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        loadFriends();
    }, [user]);

    const loadFriends = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const [friendsResponse, requestsResponse] = await Promise.all([
                friendService.getAllFriends(),
                friendService.getFriendRequests()
            ]);
            setFriends(friendsResponse.data);
            setFriendRequests(requestsResponse.data);
        } catch (err) {
            console.error('Error loading friends:', err);
            setError('Failed to load friends');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!email.trim()) return;
        
        try {
            await friendService.sendFriendRequest(email);
            setEmail('');
            alert('Friend request sent!');
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request');
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await friendService.acceptFriendRequest(requestId);
            setFriendRequests(requests => requests.filter(r => r.id !== requestId));
            loadFriends(); // Reload friends list
        } catch (err) {
            console.error('Error accepting friend request:', err);
            setError('Failed to accept friend request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await friendService.rejectFriendRequest(requestId);
            setFriendRequests(requests => requests.filter(r => r.id !== requestId));
        } catch (err) {
            console.error('Error rejecting friend request:', err);
            setError('Failed to reject friend request');
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;
        
        try {
            await friendService.removeFriend(friendId);
            setFriends(friends => friends.filter(f => f.id !== friendId));
        } catch (err) {
            console.error('Error removing friend:', err);
            setError('Failed to remove friend');
        }
    };

    if (isLoading) return <div>Loading friends...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Add Friend</h2>
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Friend's email"
                        className="px-3 py-2 border rounded flex-1"
                    />
                    <button
                        onClick={handleSendRequest}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Send Request
                    </button>
                </div>
            </div>

            {friendRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Friend Requests</h2>
                    <div className="space-y-2">
                        {friendRequests.map((request) => (
                            <div key={request.id} className="border p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {request.sender.profile_picture && (
                                            <img
                                                src={request.sender.profile_picture}
                                                alt={request.sender.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <h3 className="font-medium">{request.sender.name}</h3>
                                            <p className="text-sm text-gray-600">{request.sender.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => handleAcceptRequest(request.id)}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">My Friends</h2>
                {friends.length === 0 ? (
                    <p>No friends yet</p>
                ) : (
                    <div className="space-y-2">
                        {friends.map((friend) => (
                            <div key={friend.id} className="border p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {friend.profile_picture && (
                                            <img
                                                src={friend.profile_picture}
                                                alt={friend.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <h3 className="font-medium">{friend.name}</h3>
                                            <p className="text-sm text-gray-600">{friend.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFriend(friend.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 