"use client";
import React, { useEffect, useState } from "react";
import { getParsedCourses } from "@/app/Components/CourseDataComponent";
import { GroupedCourse, ScheduledCourse } from "@/app/types/course";
import { RutgersCourse } from "@/app/types/RutgersCourse";
import { CORE_CODES, CoreCode, openSectionsService } from "@/app/services/api";
import { cn } from "@/app/lib/utils";

// Update the props interface to include the missing properties
export interface CourseSearchProps {
  onSelectCourse: (course: GroupedCourse) => void;
  selectedCourses: GroupedCourse[];
  onRemoveCourse: (courseId: string) => void;
  onAddCourse?: (course: GroupedCourse) => void;
  onCoursesChange?: (courses: GroupedCourse[]) => void;
  onAddCoreBlock: (coreCode: CoreCode) => void;
  selectedCoreBlocks: { coreCode: CoreCode; selectedCourse?: RutgersCourse }[];
}

// Add this interface to help with course data typing
interface CourseWithNumber extends GroupedCourse {
  classNumber?: string;  // Store the class number from RutgersCourse
  department?: string;   // Add department to the interface
  coreRequirements?: CoreCode[];  // Add core requirements
}

interface CoursesByDept {
  [department: string]: CourseWithNumber[];
}

// Function to calculate similarity between two strings
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Direct contains check
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Department code match (e.g., "CS" matches "Computer Science")
  if (s1.startsWith(s2) || s2.startsWith(s1)) {
    return 0.8;
  }
  
  // Character matching
  let matches = 0;
  const maxLen = Math.max(s1.length, s2.length);
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / maxLen;
}

// Parse course number from string (e.g. "CS101" or "01:198:101")
function parseCourseNumber(input: string): { department?: string; number: string } | null {
  // Try format "01:198:101"
  const fullMatch = input.match(/(\d+):(\d+):(\d+)/);
  if (fullMatch) {
    return {
      department: `${fullMatch[1]}:${fullMatch[2]}`,
      number: fullMatch[3]
    };
  }
  
  // Try format "CS101" or "CS 101"
  const simpleMatch = input.match(/([A-Za-z]+)\s*(\d+)/);
  if (simpleMatch) {
    return {
      department: simpleMatch[1],
      number: simpleMatch[2]
    };
  }

  // Try just a number (e.g., "477")
  const numberMatch = input.match(/^(\d{3,4})$/);
  if (numberMatch) {
    return {
      number: numberMatch[1]
    };
  }
  
  return null;
}

export default function CourseSearch({ 
  onSelectCourse, 
  selectedCourses, 
  onRemoveCourse, 
  onAddCourse, 
  onCoursesChange,
  onAddCoreBlock,
  selectedCoreBlocks
}: CourseSearchProps) {
  const [departments, setDepartments] = useState<CoursesByDept>({});
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CourseWithNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoursesState, setSelectedCoursesState] = useState<CourseWithNumber[]>(selectedCourses);
  const [selectedCore, setSelectedCore] = useState<CoreCode | "">("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadCourses = async () => {
      const parsedCourses = getParsedCourses();
      const deptGroups: CoursesByDept = {};

      // Group courses by department
      parsedCourses.forEach((course) => {
        const dept = course.department;
        if (!deptGroups[dept]) {
          deptGroups[dept] = [];
        }

        // Group sections by course name
        const existing = deptGroups[dept].find(gc => gc.name === course.courseName);
        if (existing) {
          // Add this section to existing course
          existing.sections.push({
            id: course.id,
            name: course.courseName,
            campus: course.campus,
            section: course.section,
            instructors: course.instructors,
            meetingTimes: course.meetingTimes,
            time: course.meetingTimes[0] ? `${Math.floor(course.meetingTimes[0].startMinute / 60)}:${String(course.meetingTimes[0].startMinute % 60).padStart(2, "0")}` : "TBA",
            day: course.meetingTimes[0]?.day || "TBA",
            location: course.meetingTimes[0]?.location || '',
            class_number: course.class_number, // Add the class number here
            department: course.department,
            baseSectionId: course.id,
            groupName: course.courseName
          });
        } else {
          // Create new course group with class number
          deptGroups[dept].push({
            id: course.id.split('-')[0], // Use part of the section ID as the course ID
            name: course.courseName,
            classNumber: course.class_number, // Add the class number here
            sections: [{
              id: course.id,
              name: course.courseName,
              campus: course.campus,
              section: course.section,
              instructors: course.instructors,
              meetingTimes: course.meetingTimes,
              time: course.meetingTimes[0] ? `${Math.floor(course.meetingTimes[0].startMinute / 60)}:${String(course.meetingTimes[0].startMinute % 60).padStart(2, "0")}` : "TBA",
              day: course.meetingTimes[0]?.day || "TBA",
              location: course.meetingTimes[0]?.location || '',
              class_number: course.class_number, // Add the class number here
              department: course.department,
              baseSectionId: course.id,
              groupName: course.courseName
            }],
          });
        }
      });

      setDepartments(deptGroups);
      const defaultDept = Object.keys(deptGroups)[0] || "";
      setSelectedDept(defaultDept);
      if (defaultDept && deptGroups[defaultDept].length > 0) {
        setSelectedCourse(deptGroups[defaultDept][0].name);
      }
      setIsLoading(false);
    };
    loadCourses();
  }, []);

  // Notify parent component when selected courses change
  useEffect(() => {
    if (onCoursesChange) {
      onCoursesChange(selectedCoursesState);
    }
  }, [selectedCoursesState, onCoursesChange]);

  // Handle department change
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    setSelectedDept(dept);
    const coursesInDept = departments[dept] || [];
    if (coursesInDept.length > 0) {
      setSelectedCourse(coursesInDept[0].name);
    } else {
      setSelectedCourse("");
    }
    setSearchQuery("");
  };

  // Handle course selection change
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
  };

  // Add useEffect to fetch open sections
  useEffect(() => {
    const fetchOpenSections = async () => {
      await openSectionsService.refreshOpenSections();
      setOpenSections(openSectionsService.openSectionsCache.get('current') || new Set());
    };

    fetchOpenSections();
    const interval = setInterval(fetchOpenSections, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Function to check if a section is open
  const isSectionOpen = (section: ScheduledCourse): boolean => {
    return openSectionsService.isOpen(section.class_number);
  };

  // Function to filter courses by core requirement
  const filterByCore = (courses: CourseWithNumber[]): CourseWithNumber[] => {
    if (!selectedCore) return courses;
    
    return courses.filter(course => 
      course.sections.some(section => 
        section.coreRequirements?.includes(selectedCore)
      )
    );
  };

  // Update the search results filtering
  useEffect(() => {
    if (!searchQuery.trim() && !selectedCore) {
      setSearchResults([]);
      return;
    }

    const term = searchQuery.toLowerCase().trim();
    const courseNumber = parseCourseNumber(term);
    
    // Search across all departments
    let results = Object.values(departments).flatMap(deptCourses => 
      deptCourses.filter(course => {
        // Direct class number match
        if (course.classNumber && course.classNumber === term) {
          return true;
        }

        // Course number match
        if (courseNumber) {
          const courseMatch = parseCourseNumber(course.name);
          if (courseMatch) {
            if (courseNumber.department) {
              // If department is specified, match both department and number
              return courseMatch.department?.toLowerCase() === courseNumber.department.toLowerCase() &&
                     courseMatch.number === courseNumber.number;
            } else {
              // If only number is specified, match just the number
              return courseMatch.number === courseNumber.number;
            }
          }
        }

        // Text search in course name and description
        return course.name.toLowerCase().includes(term);
      })
    );

    // Apply core requirement filter
    results = filterByCore(results);

    setSearchResults(results);
  }, [searchQuery, departments, selectedCore]);

  // Handle selecting a search result
  const handleSelectSearchResult = (course: CourseWithNumber) => {
    onSelectCourse(course);
    addToSelectedCourses(course);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Add a course to the selected courses list
  const addToSelectedCourses = (course: CourseWithNumber) => {
    if (!selectedCoursesState.some(c => c.name === course.name)) {
      const updatedCourses = [...selectedCoursesState, {
        ...course,
        selectedSection: course.sections[0] // Default to first section
      }];
      setSelectedCoursesState(updatedCourses);
    }
  };

  // Remove a course from the selected courses list
  const removeSelectedCourse = (courseName: string) => {
    const updatedCourses = selectedCoursesState.filter(c => c.name !== courseName);
    setSelectedCoursesState(updatedCourses);
  };

  // Handle section change for a selected course
  const handleSectionChange = (courseName: string, sectionId: string) => {
    const updatedCourses = selectedCoursesState.map(course => {
      if (course.name === courseName) {
        const newSection = course.sections.find(s => s.id === sectionId);
        return {
          ...course,
          selectedSection: newSection || course.selectedSection
        };
      }
      return course;
    });
    setSelectedCoursesState(updatedCourses);
  };

  // Function to check if a core requirement is already selected
  const isCoreSelected = (coreCode: CoreCode) => {
    return selectedCoreBlocks.some(block => block.coreCode === coreCode);
  };

  return (
    <div className="space-y-4">
      {/* Core Requirements Filter */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Core Requirements
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CORE_CODES).map(([code, description]) => {
            const isSelected = isCoreSelected(code as CoreCode);
            return (
              <button
                key={code}
                onClick={() => !isSelected && onAddCoreBlock(code as CoreCode)}
                className={`p-2 rounded-md text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                disabled={isSelected}
              >
                <div className="font-medium">{code}</div>
                <div className="text-xs truncate">{description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Courses
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by course name or number..."
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Search Results */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
        <div className="space-y-2">
          {searchResults.map((course) => (
            <div
              key={course.id}
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{course.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {course.department} • {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
                  </p>
                  {course.sections[0]?.coreRequirements && course.sections[0].coreRequirements.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {course.sections[0].coreRequirements.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onSelectCourse(course)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {/* Section List */}
              <div className="mt-2 space-y-1">
                {course.sections.map((section) => (
                  <div
                    key={section.id}
                    className="text-sm flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span>Section {section.section}</span>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        isSectionOpen(section)
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}>
                        {isSectionOpen(section) ? "Open" : "Closed"}
                      </span>
                      <span className="text-gray-500">
                        {section.meetingTimes.map(mt => mt.day).join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {searchResults.length === 0 && searchQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No courses found matching your search criteria
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
