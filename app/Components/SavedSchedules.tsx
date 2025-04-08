import React, { useState, useEffect } from 'react';
import { scheduleService } from '@/app/services/api';
import { SavedSchedule } from '@/app/types/course';
import { useAuth } from '@/app/Components/AuthProvider';

interface SavedSchedulesProps {
    onScheduleSelect: (schedule: SavedSchedule) => void;
}

export default function SavedSchedules({ onScheduleSelect }: SavedSchedulesProps) {
    const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        loadSavedSchedules();
    }, [user]);

    const loadSavedSchedules = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const response = await scheduleService.getSavedSchedules(user.id);
            setSavedSchedules(response.data.schedules);
        } catch (err) {
            console.error('Error loading saved schedules:', err);
            setError('Failed to load saved schedules');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async (scheduleId: string) => {
        try {
            const response = await scheduleService.createShareableLink( scheduleId );
            // Copy link to clipboard
            navigator.clipboard.writeText(window.location.origin + response.data.shareableLink);
            alert('Schedule link copied to clipboard!');
        } catch (err) {
            console.error('Error sharing schedule:', err);
            setError('Failed to create shareable link');
        }
    };

    const handleDelete = async (scheduleId: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        
        try {
            await scheduleService.deleteSchedule(scheduleId);
            /* setSavedSchedules(schedules => schedules.filter(s => s.id !== scheduleId)); */
        } catch (err) {
            console.error('Error deleting schedule:', err);
            setError('Failed to delete schedule');
        }
    };

    if (isLoading) return <div>Loading saved schedules...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Saved Schedules</h2>
            {savedSchedules.length === 0 ? (
                <p>No saved schedules yet</p>
            ) : (
                <div className="space-y-2">
                    {savedSchedules.map((schedule) => (
                        <div key={schedule.id} className="border p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">{schedule.name}</h3>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => onScheduleSelect(schedule)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => console.log('Sync to calendar')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Share
                                    </button>
                                    <button
                                        onClick={() => console.log('delete')}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                {schedule.courses.length} courses • Created 
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 