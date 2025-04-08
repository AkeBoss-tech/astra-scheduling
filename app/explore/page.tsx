"use client";
import React, { useState, useEffect } from "react";
import { ScheduledCourse, GroupedCourse } from "@/app/types/course";
import { CAMPUSES } from "@/app/lib/constants";
import { useRouter } from "next/navigation";
import { getParsedCourses } from "@/app/Components/CourseDataComponent";
import { RutgersCourse } from "@/app/types/RutgersCourse";
import { CORE_CODES, CoreCode } from '@/app/services/api';

// Rating component for professor difficulty
const DifficultyRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg 
          key={i} 
          className={`w-4 h-4 ${
            i < fullStars 
              ? "text-yellow-400" 
              : i === fullStars && hasHalfStar 
                ? "text-yellow-400" 
                : "text-gray-300 dark:text-gray-600"
          }`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)}</span>
    </div>
  );
};

// Filter component
const FilterSection = ({ 
  filters, 
  setFilters 
}: { 
  filters: any, 
  setFilters: React.Dispatch<React.SetStateAction<any>> 
}) => {
  const timeSlots = [
    { label: "Morning (8AM-12PM)", value: "morning" },
    { label: "Afternoon (12PM-5PM)", value: "afternoon" },
    { label: "Evening (5PM-10PM)", value: "evening" }
  ];
  
  const campuses = Object.keys(CAMPUSES).map(campus => ({
    label: campus,
    value: campus
  }));
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
    label: day,
    value: day
  }));
  
  return (
    <div className="space-y-5">
      <div>
        <h3 className="label mb-2">Time of Day</h3>
        <div className="space-y-2">
          {timeSlots.map(slot => (
            <label key={slot.value} className="flex items-center">
              <input 
                type="checkbox"
                checked={filters.timeSlots.includes(slot.value)}
                onChange={() => {
                  const newTimeSlots = filters.timeSlots.includes(slot.value)
                    ? filters.timeSlots.filter((t: string) => t !== slot.value)
                    : [...filters.timeSlots, slot.value];
                  setFilters({...filters, timeSlots: newTimeSlots});
                }}
                className="rounded text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-300">{slot.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="label mb-2">Campus</h3>
        <div className="space-y-2">
          {campuses.map(campus => (
            <label key={campus.value} className="flex items-center">
              <input 
                type="checkbox"
                checked={filters.campuses.includes(campus.value)}
                onChange={() => {
                  const newCampuses = filters.campuses.includes(campus.value)
                    ? filters.campuses.filter((c: string) => c !== campus.value)
                    : [...filters.campuses, campus.value];
                  setFilters({...filters, campuses: newCampuses});
                }}
                className="rounded text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-300">{campus.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="label mb-2">Days</h3>
        <div className="space-y-2">
          {days.map(day => (
            <label key={day.value} className="flex items-center">
              <input 
                type="checkbox"
                checked={filters.days.includes(day.value)}
                onChange={() => {
                  const newDays = filters.days.includes(day.value)
                    ? filters.days.filter((d: string) => d !== day.value)
                    : [...filters.days, day.value];
                  setFilters({...filters, days: newDays});
                }}
                className="rounded text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-300">{day.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="label mb-2">Credits</h3>
        <div className="flex items-center space-x-2">
          <input 
            type="number" 
            min="0"
            max="6"
            value={filters.minCredits}
            onChange={(e) => setFilters({...filters, minCredits: parseInt(e.target.value) || 0})}
            className="w-16 p-2 text-sm rounded bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
          />
          <span className="text-gray-400">to</span>
          <input 
            type="number"
            min="0"
            max="6" 
            value={filters.maxCredits}
            onChange={(e) => setFilters({...filters, maxCredits: parseInt(e.target.value) || 6})}
            className="w-16 p-2 text-sm rounded bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>
      
      <button 
        onClick={() => setFilters({
          timeSlots: [] as string[],
          campuses: [] as string[],
          days: [] as string[],
          minCredits: 0,
          maxCredits: 6
        })}
        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

// Course detail component
const CourseDetail = ({ course, onAddToSchedule }: { course: GroupedCourse, onAddToSchedule: (course: GroupedCourse) => void }) => {
  const [selectedSection, setSelectedSection] = useState<ScheduledCourse | null>(
    course.sections.length > 0 ? course.sections[0] : null
  );
  
  // Mock data for professor ratings
  const getProfessorRating = (name: string) => {
    // In a real app, this would come from an API
    const firstChar = name.charAt(0).toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 2 + (hash % 30) / 10; // Random rating between 2.0 and 5.0
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-white mb-1">{course.name}</h2>
        <p className="text-gray-400">
          {course.sections[0]?.department || ''} {course.sections[0]?.class_number || ''}
          {course.sections[0]?.credits && ` • ${course.sections[0].credits} credits`}
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-2">Available Sections</h3>
        <div className="grid grid-cols-1 gap-3">
          {course.sections.map(section => (
            <div 
              key={section.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedSection?.id === section.id 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 hover:border-purple-400 hover:bg-gray-800/50'
              }`}
              onClick={() => setSelectedSection(section)}
            >
              <div className="flex justify-between">
                <div>
                  <span className="font-medium text-white">Section {section.section}</span>
                  <div className="text-sm text-gray-400 mt-2 space-y-1">
                    {section.instructors.map(instructor => {
                      const instructorName = typeof instructor === 'string' ? instructor : instructor.name;
                      return (
                        <div key={instructorName} className="flex items-center space-x-2">
                          <span>{instructorName}</span>
                          <DifficultyRating rating={getProfessorRating(instructorName)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="badge badge-purple">{section.campus}</span>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-400 space-y-1.5">
                {section.meetingTimes.map((mt, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="font-medium text-gray-300 w-20">{mt.day}</span>
                    <span>
                      {`${Math.floor(mt.startMinute / 60)}:${String(mt.startMinute % 60).padStart(2, '0')} - 
                      ${Math.floor(mt.endMinute / 60)}:${String(mt.endMinute % 60).padStart(2, '0')}`}
                    </span>
                    {mt.location && <span className="ml-2 text-gray-500">{mt.location}</span>}
                    {mt.mode && <span className="ml-2 badge badge-blue">{mt.mode}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-700">
        <button
          onClick={() => {
            // Update the selected section in the course before adding
            const updatedCourse = {
              ...course,
              selectedSection: selectedSection || course.sections[0]
            };
            onAddToSchedule(updatedCourse);
          }}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add to Schedule
        </button>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allCourses, setAllCourses] = useState<GroupedCourse[]>([]);
  const [searchResults, setSearchResults] = useState<GroupedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GroupedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeSlots: [] as string[],
    campuses: [] as string[],
    days: [] as string[],
    minCredits: 0,
    maxCredits: 6
  });
  const router = useRouter();
  const [courses, setCourses] = useState<RutgersCourse[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedCores, setSelectedCores] = useState<Set<CoreCode>>(new Set());
  
  // Load courses from frontend component
  useEffect(() => {
    setLoading(true);
    
    try {
      // Get courses from the CourseDataComponent
      const parsedCourses = getParsedCourses();
      
      // Group sections by course
      const coursesMap = new Map<string, GroupedCourse>();
      
      parsedCourses.forEach((course) => {
        const courseKey = `${course.department}-${course.class_number}`;
        
        if (!coursesMap.has(courseKey)) {
          coursesMap.set(courseKey, {
            id: courseKey,
            name: course.courseName,
            sections: []
          });
        }
        
        // Add this section to the course
        coursesMap.get(courseKey)!.sections.push({
          id: course.id,
          name: course.courseName,
          campus: course.campus,
          section: course.section,
          instructors: course.instructors,
          meetingTimes: course.meetingTimes,
          time: course.meetingTimes[0] ? `${Math.floor(course.meetingTimes[0].startMinute / 60)}:${String(course.meetingTimes[0].startMinute % 60).padStart(2, "0")}` : "TBA",
          day: course.meetingTimes[0]?.day || "TBA",
          location: course.meetingTimes[0]?.location || '',
          class_number: course.class_number,
          department: course.department,
          baseSectionId: course.id,
          groupName: course.courseName,
          credits: course.credits
        });
      });
      
      const groupedCourses = Array.from(coursesMap.values());
      setAllCourses(groupedCourses);
      
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Search for courses
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedCourse(null);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Search in all courses
    const results = allCourses.filter(course => {
      // Check course name
      if (course.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check course code/number
      if (course.sections[0]?.class_number?.toLowerCase().includes(query) || 
          course.sections[0]?.department?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check instructors
      if (course.sections.some(section => 
        section.instructors.some(instructor => {
          const instructorName = typeof instructor === 'string' ? instructor : instructor.name;
          return instructorName.toLowerCase().includes(query);
        })
      )) {
        return true;
      }
      
      return false;
    });
    
    setSearchResults(results);
    
    if (results.length > 0) {
      setSelectedCourse(results[0]);
    } else {
      setSelectedCourse(null);
    }
  };
  
  // Apply filters to search results
  const filteredResults = searchResults.filter(course => {
    // If no filters are applied, show all results
    if (
      filters.timeSlots.length === 0 &&
      filters.campuses.length === 0 &&
      filters.days.length === 0 &&
      filters.minCredits === 0 &&
      filters.maxCredits === 6
    ) {
      return true;
    }
    
    // Check if any section matches all filters
    return course.sections.some(section => {
      // Campus filter
      if (filters.campuses.length > 0 && !filters.campuses.includes(section.campus)) {
        return false;
      }
      
      // Credits filter (if available)
      if (section.credits) {
        if (
          (typeof section.credits === 'string' ? parseFloat(section.credits) : section.credits) < filters.minCredits || 
          (typeof section.credits === 'string' ? parseFloat(section.credits) : section.credits) > filters.maxCredits
        ) {
          return false;
        }
      }
      
      // Day filter
      if (filters.days.length > 0) {
        const sectionDays = section.meetingTimes.map(mt => mt.day);
        if (!filters.days.some(day => sectionDays.includes(day))) {
          return false;
        }
      }
      
      // Time slot filter
      if (filters.timeSlots.length > 0) {
        return section.meetingTimes.some(mt => {
          const startHour = Math.floor(mt.startMinute / 60);
          
          return filters.timeSlots.some((slot: string) => {
            if (slot === "morning" && startHour >= 8 && startHour < 12) return true;
            if (slot === "afternoon" && startHour >= 12 && startHour < 17) return true;
            if (slot === "evening" && startHour >= 17 && startHour < 22) return true;
            return false;
          });
        });
      }
      
      return true;
    });
  });
  
  // Handle search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  // Add course to selected courses and navigate to scheduling page
  const handleAddToSchedule = (course: GroupedCourse) => {
    // Store the selected course in localStorage
    const existingCourses = localStorage.getItem('selectedCourses');
    let coursesToSave = [];
    
    if (existingCourses) {
      try {
        coursesToSave = JSON.parse(existingCourses);
      } catch (e) {
        console.error("Error parsing stored courses:", e);
        coursesToSave = [];
      }
    }
    
    // Add the new course if it doesn't exist already
    if (!coursesToSave.some((c: any) => c.id === course.id)) {
      coursesToSave.push(course);
    }
    
    localStorage.setItem('selectedCourses', JSON.stringify(coursesToSave));
    
    // Navigate to scheduling page
    router.push('/scheduling');
  };
  
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = getParsedCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadCourses();
  }, []);

  const toggleCore = (core: CoreCode) => {
    const newCores = new Set(selectedCores);
    if (newCores.has(core)) {
      newCores.delete(core);
    } else {
      newCores.add(core);
    }
    setSelectedCores(newCores);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' || 
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.class_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCampus = selectedCampus === '' || course.campus === selectedCampus;
    
    const matchesCores = selectedCores.size === 0 || 
      (course.coreRequirements && 
        Array.from(selectedCores).some(core => course.coreRequirements.includes(core)));

    return matchesSearch && matchesCampus && matchesCores;
  });

  const uniqueCampuses = Array.from(new Set(courses.map(course => course.campus))).sort();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Explore Courses</h1>
          <p className="text-gray-300">Search and browse available courses to add to your schedule</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar - Search and filters */}
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Search</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by keyword, professor, code..."
                  className="input pr-10"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
              <FilterSection filters={filters} setFilters={setFilters} />
            </div>
            
          </div>
          
          {/* Middle section - Course results */}
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : searchQuery && filteredResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchResults.length > 0 
                    ? "No courses match the selected filters" 
                    : "No courses found. Try a different search term."}
                </div>
              ) : !searchQuery ? (
                <div className="text-center py-8 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Search for courses to see results</p>
                </div>
              ) : (
                <div className="space-y-3 pr-1">
                  {filteredResults.map(course => (
                    <div
                      key={course.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id 
                          ? 'border-purple-500 bg-purple-900/20' 
                          : 'border-gray-700 hover:border-purple-400 hover:bg-gray-800/50'
                      }`}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <h3 className="font-medium text-white">{course.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {course.sections[0]?.department || ''} {course.sections[0]?.class_number || ''}
                        {course.sections.length > 0 && ` • ${course.sections.length} sections`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Main content - Course details */}
          <div className="w-full lg:w-1/2">
            <div className="card h-full">
              {selectedCourse ? (
                <CourseDetail 
                  course={selectedCourse} 
                  onAddToSchedule={handleAddToSchedule}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg className="w-16 h-16 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-300 mb-2">No Course Selected</h3>
                  <p className="text-center max-w-md">
                    Search for courses by name, professor, or course code to view details and add them to your schedule.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 