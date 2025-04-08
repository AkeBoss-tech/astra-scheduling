"use client";
import React, { useState, useEffect } from 'react';
import { RutgersCourse } from '@/app/types/RutgersCourse';
import { CORE_CODES, CoreCode } from '@/app/services/api';
import { getParsedCourses } from '@/app/Components/CourseDataComponent';

export default function CoresPage() {
  const [courses, setCourses] = useState<RutgersCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCore, setSelectedCore] = useState<CoreCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = getParsedCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Group courses by core requirement
  const coursesByCore = React.useMemo(() => {
    const grouped: { [key in CoreCode]?: RutgersCourse[] } = {};
    
    // Initialize empty arrays for each core code
    Object.keys(CORE_CODES).forEach(code => {
      grouped[code as CoreCode] = [];
    });

    // Group courses by their core requirements
    courses.forEach(course => {
      if (course.coreRequirements) {
        course.coreRequirements.forEach(core => {
          if (grouped[core]) {
            grouped[core]!.push(course);
          }
        });
      }
    });

    return grouped;
  }, [courses]);

  // Filter courses based on search query
  const filteredCourses = React.useMemo(() => {
    if (!selectedCore) return {};
    
    const query = searchQuery.toLowerCase();
    return {
      [selectedCore]: coursesByCore[selectedCore]?.filter(course => 
        course.courseName.toLowerCase().includes(query) ||
        course.department.toLowerCase().includes(query) ||
        course.class_number.toLowerCase().includes(query)
      )
    };
  }, [selectedCore, coursesByCore, searchQuery]);

  const displayCourses = searchQuery ? filteredCourses : coursesByCore;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Core Requirements
          </h1>
          <div className="w-1/3">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(CORE_CODES).map(([code, description]) => {
            const courseCount = coursesByCore[code as CoreCode]?.length || 0;
            const isSelected = selectedCore === code;
            
            return (
              <button
                key={code}
                onClick={() => setSelectedCore(isSelected ? null : code as CoreCode)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {code}
                    </h3>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    isSelected
                      ? 'bg-blue-400 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {courseCount} courses
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedCore && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {CORE_CODES[selectedCore]} ({selectedCore})
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {displayCourses[selectedCore]?.length || 0} courses available
              </p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayCourses[selectedCore]?.map(course => (
                <div key={course.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {course.courseName}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {course.department} {course.class_number} • {course.credits} credits
                      </p>
                      {course.coreRequirements && course.coreRequirements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {course.coreRequirements.map(code => (
                            <span
                              key={code}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.campus}
                    </div>
                  </div>
                </div>
              ))}
              {displayCourses[selectedCore]?.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No courses found matching your search criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 