import React, { useState, useEffect } from 'react';
import { courseListService, friendService } from '@/app/services/api';
import { CourseList } from '@/app/types/course';
import { useAuth } from '@/app/Components/AuthProvider';

interface CourseListsProps {
    onCourseListSelect?: (courseList: CourseList) => void;
}

export default function CourseLists({ onCourseListSelect }: CourseListsProps) {
    const [courseLists, setCourseLists] = useState<CourseList[]>([]);
    const [sharedLists, setSharedLists] = useState<CourseList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newListName, setNewListName] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        loadCourseLists();
    }, [user]);

    const loadCourseLists = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const [myLists, friendLists] = await Promise.all([
                courseListService.getAllCourseLists(),
                courseListService.getSharedCourseLists()
            ]);
            setCourseLists(myLists.data);
            setSharedLists(friendLists.data);
        } catch (err) {
            console.error('Error loading course lists:', err);
            setError('Failed to load course lists');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        
        try {
            const response = await courseListService.createCourseList({
                name: newListName,
                courses: []
            });
            setCourseLists([...courseLists, response.data]);
            setNewListName('');
        } catch (err) {
            console.error('Error creating course list:', err);
            setError('Failed to create course list');
        }
    };

    const handleShare = async (listId: string) => {
        try {
            const response = await courseListService.shareList(listId);
            // Copy link to clipboard
            navigator.clipboard.writeText(window.location.origin + response.data.shareableLink);
            alert('Course list link copied to clipboard!');
        } catch (err) {
            console.error('Error sharing course list:', err);
            setError('Failed to create shareable link');
        }
    };

    const handleDelete = async (listId: string) => {
        if (!confirm('Are you sure you want to delete this course list?')) return;
        
        try {
            await courseListService.deleteCourseList(listId);
            setCourseLists(lists => lists.filter(l => l.id !== listId));
        } catch (err) {
            console.error('Error deleting course list:', err);
            setError('Failed to delete course list');
        }
    };

    if (isLoading) return <div>Loading course lists...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">My Course Lists</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="New list name"
                        className="px-3 py-2 border rounded flex-1"
                    />
                    <button
                        onClick={handleCreateList}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create List
                    </button>
                </div>
                {courseLists.length === 0 ? (
                    <p>No course lists yet</p>
                ) : (
                    <div className="space-y-2">
                        {courseLists.map((list) => (
                            <div key={list.id} className="border p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium">{list.name}</h3>
                                    <div className="space-x-2">
                                        {onCourseListSelect && (
                                            <button
                                                onClick={() => onCourseListSelect(list)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Load
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleShare(list.id)}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Share
                                        </button>
                                        <button
                                            onClick={() => handleDelete(list.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {list.courses.length} courses
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
} 