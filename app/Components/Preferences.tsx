"use client";
import React, { useState } from "react";

interface PreferenceCategory {
  name: string;
  value: number;
  color: string;
}

interface CampusPreference {
  name: string;
  value: number;
  color: string;
}

const Preferences: React.FC = () => {
  // Main priority categories
  const [priorities, setPriorities] = useState<PreferenceCategory[]>([
    { name: 'campus', value: 33, color: 'bg-pink-500' },
    { name: 'professor ratings', value: 33, color: 'bg-purple-500' },
    { name: 'times', value: 34, color: 'bg-blue-500' },
  ]);

  // Campus preferences
  const [campusPreferences, setCampusPreferences] = useState<CampusPreference[]>([
    { name: 'college ave', value: 20, color: 'bg-pink-500' },
    { name: 'livi', value: 20, color: 'bg-purple-500' },
    { name: 'busch', value: 20, color: 'bg-indigo-500' },
    { name: 'cook/doug', value: 20, color: 'bg-blue-500' },
    { name: 'online', value: 20, color: 'bg-teal-500' },
  ]);

  // Time preferences
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [timeRange, setTimeRange] = useState<{start: string; end: string}>({
    start: '8:00',
    end: '17:00',
  });

  // Update priority distribution
  const handlePriorityChange = (index: number, newValue: number) => {
    // Calculate how much to distribute among other priorities
    const oldValue = priorities[index].value;
    const difference = newValue - oldValue;
    
    // Don't allow values below 0 or above 100
    if (newValue < 0 || newValue > 100) return;
    
    // Create new priorities array
    const newPriorities = [...priorities];
    
    // Update the changed priority
    newPriorities[index].value = newValue;
    
    // Distribute the difference among other priorities proportionally
    const totalOtherPriorities = 100 - oldValue;
    const otherIndices = priorities.map((_, i) => i).filter(i => i !== index);
    
    let remaining = -difference;
    
    otherIndices.forEach((i, idx) => {
      if (idx === otherIndices.length - 1) {
        // Last item gets whatever is remaining to ensure sum is exactly 100
        newPriorities[i].value = Math.max(0, Math.min(100, newPriorities[i].value + remaining));
      } else {
        // Calculate proportional adjustment
        const proportion = newPriorities[i].value / totalOtherPriorities;
        const adjustment = Math.round(proportion * -difference);
        newPriorities[i].value = Math.max(0, Math.min(100, newPriorities[i].value + adjustment));
        remaining -= adjustment;
      }
    });
    
    setPriorities(newPriorities);
  };

  // Update campus preference distribution
  const handleCampusPreferenceChange = (index: number, newValue: number) => {
    // Similar logic to priorities but for campus preferences
    const oldValue = campusPreferences[index].value;
    const difference = newValue - oldValue;
    
    if (newValue < 0 || newValue > 100) return;
    
    const newPreferences = [...campusPreferences];
    newPreferences[index].value = newValue;
    
    const totalOtherPreferences = 100 - oldValue;
    const otherIndices = campusPreferences.map((_, i) => i).filter(i => i !== index);
    
    let remaining = -difference;
    
    otherIndices.forEach((i, idx) => {
      if (idx === otherIndices.length - 1) {
        newPreferences[i].value = Math.max(0, Math.min(100, newPreferences[i].value + remaining));
      } else {
        const proportion = newPreferences[i].value / totalOtherPreferences;
        const adjustment = Math.round(proportion * -difference);
        newPreferences[i].value = Math.max(0, Math.min(100, newPreferences[i].value + adjustment));
        remaining -= adjustment;
      }
    });
    
    setCampusPreferences(newPreferences);
  };

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) { // Don't allow empty selection
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <div className="min-h-full bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Schedule Preferences</h1>
        
        {/* Priorities Section */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-white text-center">Priorities</h2>
          <div className="flex mb-4">
            {priorities.map((priority, index) => (
              <div 
                key={priority.name}
                className="flex-1 flex flex-col items-center mx-1"
              >
                <div className={`w-full h-40 relative ${priority.color} bg-opacity-70 rounded-lg overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{priority.value}%</span>
                  </div>
                </div>
                <span className="mt-2 text-gray-300 capitalize">{priority.name}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priority.value}
                  onChange={(e) => handlePriorityChange(index, parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Campus Preferences */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-white text-center">Campus Preferences</h2>
          <div className="grid grid-cols-5 gap-4">
            {campusPreferences.map((campus, index) => (
              <div 
                key={campus.name}
                className="flex flex-col items-center"
              >
                <div className={`w-full h-20 relative ${campus.color} rounded-lg overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{campus.value}%</span>
                  </div>
                </div>
                <span className="mt-2 text-gray-300 capitalize">{campus.name}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={campus.value}
                  onChange={(e) => handleCampusPreferenceChange(index, parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Time Preferences */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white text-center">Time Preferences</h2>
          
          {/* Day selection */}
          <div className="flex justify-center space-x-4 mb-6">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedDays.includes(day) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          
          {/* Time range */}
          <div className="flex justify-between items-center mb-4">
            <button className="px-4 py-2 bg-amber-500 text-white rounded-md">
              Start: {timeRange.start}
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
              End: {timeRange.end}
            </button>
          </div>
          
          {/* Time grid */}
          <div className="grid grid-cols-5 gap-1 mt-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <div key={day} className="bg-gray-800 h-96">
                <div className="text-center py-2 text-white">{day}</div>
                <div className="relative h-[calc(100%-2rem)] border-t border-gray-700">
                  {Array.from({ length: 13 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-gray-700 flex items-center"
                      style={{ top: `${i * (100 / 12)}%` }}
                    >
                      <span className="text-xs text-gray-500 -translate-y-1/2 pl-1">{8 + i}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Save button */}
        <div className="mt-10 flex justify-center">
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
