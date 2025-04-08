"use client";
import React from 'react';
import { ScheduledCourse } from '../types/course';

// Hour markings for the schedule grid
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM

// Days to display in the schedule
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Color mapping for different campuses
const CAMPUS_COLORS: Record<string, string> = {
  "College Avenue": "bg-gradient-to-r from-pink-600 to-pink-700",
  "Busch": "bg-gradient-to-r from-purple-600 to-purple-700",
  "Livingston": "bg-gradient-to-r from-blue-600 to-blue-700",
  "Cook/Douglass": "bg-gradient-to-r from-teal-600 to-teal-700",
  "Online": "bg-gradient-to-r from-green-600 to-green-700",
  // Default fallback
  "default": "bg-gradient-to-r from-gray-600 to-gray-700"
};

export interface ScheduleViewProps {
  schedule: ScheduledCourse[];
  onNextSchedule: () => void;
  onPrevSchedule: () => void;
  currentScheduleIndex: number;
  totalSchedules: number;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, onNextSchedule, onPrevSchedule, currentScheduleIndex, totalSchedules }) => {
  // State to track window width for responsive design
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);
  
  // Effect to handle window resize and check screen size
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    // Check on initial render
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup on unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper to convert minute count to formatted time string
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Get campus color based on campus name
  const getCampusColor = (campus: string): string => {
    const lowerCampus = campus.toLowerCase();
    
    if (lowerCampus.includes('college') || lowerCampus.includes('ca')) {
      return CAMPUS_COLORS["College Avenue"];
    } else if (lowerCampus.includes('busch')) {
      return CAMPUS_COLORS["Busch"];
    } else if (lowerCampus.includes('livingston') || lowerCampus.includes('livi')) {
      return CAMPUS_COLORS["Livingston"];
    } else if (lowerCampus.includes('cook') || lowerCampus.includes('douglass') || lowerCampus.includes('cd')) {
      return CAMPUS_COLORS["Cook/Douglass"];
    } else if (lowerCampus.includes('online') || lowerCampus.includes('remote')) {
      return CAMPUS_COLORS["Online"];
    }
    
    return CAMPUS_COLORS.default;
  };

  // Calculate display values for the schedule
  const earliestHour = 8; // 8 AM
  const latestHour = 22; // 10 PM
  const totalHours = latestHour - earliestHour + 1;
  const hourHeight = 60; // Height in pixels for one hour

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-2 sm:p-4 mb-8 overflow-x-auto">
      {/* Schedule header - days of the week */}
      <div className="grid grid-cols-6 gap-1 mb-1 min-w-[600px]">
        <div className="text-gray-400 text-xs text-center font-medium">Time</div>
        {DAYS.map(day => (
          <div key={day} className="bg-gray-700 text-white font-bold p-1 sm:p-2 rounded-t text-center text-xs sm:text-sm">
            {isSmallScreen ? day.substring(0, 3) : day}
          </div>
        ))}
      </div>
      
      {/* Schedule grid */}
      <div className="relative grid grid-cols-6 gap-1 min-w-[600px]" style={{ height: `${totalHours * hourHeight}px` }}>
        {/* Time markers column */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div 
              key={hour} 
              className="absolute w-full text-xs text-gray-400 -mt-2 border-t border-gray-700"
              style={{ top: `${(hour - earliestHour) * hourHeight}px` }}
            >
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </div>
          ))}
        </div>
        
        {/* Days columns */}
        {DAYS.map(day => (
          <div key={day} className="relative border-l border-gray-700">
            {/* Background hour lines */}
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="absolute w-full border-t border-gray-700"
                style={{ top: `${(hour - earliestHour) * hourHeight}px`, height: '1px' }}
              />
            ))}
            
            {/* Course blocks */}
            {schedule.filter(course => 
              course.meetingTimes?.some(mt => mt.day === day)
            ).map((course, index) => {
              // Find the meeting time for this day
              const meetingTime = course.meetingTimes.find(mt => mt.day === day);
              
              if (!meetingTime) return null;
              
              const startMinute = meetingTime.startMinute;
              const endMinute = meetingTime.endMinute;
              
              const startHour = startMinute / 60;
              const duration = (endMinute - startMinute) / 60; // in hours
              
              const topPosition = (startHour - earliestHour) * hourHeight;
              const height = duration * hourHeight;
              
              return (
                <div 
                  key={`${course.id}-${index}`}
                  className={`absolute left-0 right-0 m-1 p-2 rounded text-white ${getCampusColor(course.campus)}`}
                  style={{ 
                    top: `${topPosition}px`, 
                    height: `${height}px`,
                    overflow: 'hidden'
                  }}
                >
                  <div className="text-xs md:text-sm font-bold">{course.name}</div>
                  <div className="text-xs">
                    {formatTime(startMinute)} - {formatTime(endMinute)}
                  </div>
                  <div className="text-xs mt-1 hidden md:block">
                    Section {course.section}
                  </div>
                  <div className="text-xs opacity-75 hidden md:block">
                    {course.campus}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Asynchronous/remote courses */}
      {schedule.filter(course => 
        course.meetingTimes?.some(mt => mt.mode === 'ASYNC' || mt.mode === 'REMOTE')
      ).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Asynchronous/Remote Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schedule.filter(course => 
              course.meetingTimes?.some(mt => mt.mode === 'ASYNC' || mt.mode === 'REMOTE')
            ).map((course, index) => (
              <div 
                key={`async-${course.id}-${index}`}
                className={`p-3 rounded ${getCampusColor(course.campus)}`}
              >
                <div className="font-bold">{course.name}</div>
                <div className="text-sm">Section {course.section}</div>
                <div className="text-sm mt-1 opacity-75">
                  {course.meetingTimes
                    .filter(mt => mt.mode === 'ASYNC' || mt.mode === 'REMOTE')
                    .map(mt => mt.mode)
                    .join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
