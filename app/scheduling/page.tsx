"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/app/Components/Button";
import { cn } from "@/app/lib/utils";
import { ScheduledCourse, GroupedCourse, MeetingTime, Instructor } from "@/app/types/course";
import { CAMPUSES } from "@/app/lib/constants";
import CourseSearch from "@/app/Components/CourseSearch";
import PossibleSchedules from "@/app/Components/PossibleSchedules";
import { scheduleService, openSectionsService, CORE_CODES, CoreCode, coreCoursesService } from "@/app/services/api";
import { useAuth } from "@/app/Components/AuthProvider";
import "@/app/styles/resizable.css";
import { useRouter } from 'next/navigation';
import { findProfessorRatings } from "@/app/lib/professorData";
import { RutgersCourse } from "@/app/types/RutgersCourse";

// Example days to display:
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Pixels per minute to scale vertical size:
const MINUTE_HEIGHT = 0.5;

// --- Timeline Boundaries (fixed for demo) ---
function getEarliestMinute(schedule: (ScheduledCourse | PreviewEvent)[]): number {
  return 8 * 60; // 8:00 AM
}
function getLatestMinute(schedule: (ScheduledCourse | PreviewEvent)[]): number {
  return 23 * 60; // 11:00 PM
}

// --- Conflict Checking ---
// Checks if two sections conflict by comparing each of their meeting times.
// In addition to direct overlap, if they are on different campuses the gap between them must be at least 30 minutes.
function conflictBetween(s1: ScheduledCourse | PreviewEvent, s2: ScheduledCourse | PreviewEvent): boolean {
  for (const mt1 of s1.meetingTimes) {
    for (const mt2 of s2.meetingTimes) {
      if (mt1.day === mt2.day) {
        // Overlap check:
        if (mt1.startMinute < mt2.endMinute && mt2.startMinute < mt1.endMinute) {
          return true;
        }
        // If on different campuses, require at least 30 minutes between them.
        if (s1.campus !== s2.campus) {
          if (mt1.endMinute <= mt2.startMinute && (mt2.startMinute - mt1.endMinute) < 30) {
            return true;
          }
          if (mt2.endMinute <= mt1.startMinute && (mt1.startMinute - mt2.endMinute) < 30) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function formatInstructors(instructors: ScheduledCourse): string {
  console.log("Instructors to print:", instructors);
  return instructors.instructors.join(", ");
}

// Interface for preview events that extends ScheduledCourse
type PreviewEvent = Omit<ScheduledCourse, 'day' | 'time'> & {
  isPreview?: boolean;
  day: string;
  time: string;
};

// Interface for preferences
interface Preferences {
  earliestStartTime: number;
  latestEndTime: number;
  preferredCampuses: string[];
  minimumProfessorRating: number;
}

// Add this interface at the top of the file
interface CoreRequirementBlock {
  coreCode: CoreCode;
  selectedCourse?: RutgersCourse;
}

// --- Main Component ---
export default function SchedulingPage() {
  // Courses the user has added to their plan.
  const [selectedCourses, setSelectedCourses] = useState<GroupedCourse[]>(() => {
    // Try to load saved courses from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedCourses');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved courses:', e);
        }
      }
    }
    return [];
  });
  // For hover overlay (holds the course group name).
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  // For drag-and-drop (optional).
  const [draggedCourse, setDraggedCourse] = useState<ScheduledCourse | null>(null);

  // Add these new state variables and refs
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(25); // percentage
  const [rightSidebarWidth, setRightSidebarWidth] = useState(33); // percentage
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const initialX = useRef(0);
  const initialLeftWidth = useRef(0);
  const initialRightWidth = useRef(0);

  // Add new state variables for saving schedules
  const [scheduleName, setScheduleName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  // Add new state variables for saved schedules
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [loadingSavedSchedules, setLoadingSavedSchedules] = useState(false);
  const [savedSchedulesError, setSavedSchedulesError] = useState("");

  // Add these state variables after the other useState declarations
  const [preferences, setPreferences] = useState<Preferences>({
    earliestStartTime: 8 * 60, // 8:00 AM
    latestEndTime: 20 * 60,    // 8:00 PM
    preferredCampuses: [],
    minimumProfessorRating: 0, // Keep this for backward compatibility
  });

  // Add new state for core code selection and random course generation
  const [selectedCoreCodes, setSelectedCoreCodes] = useState<CoreCode[]>([]);
  const [randomizeFromCore, setRandomizeFromCore] = useState(false);
  
  // Add state for open sections
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Add state for core courses
  const [coreCourses, setCoreCourses] = useState<{ [key in CoreCode]?: GroupedCourse[] }>({});
  const [loadingCore, setLoadingCore] = useState<{ [key in CoreCode]?: boolean }>({});

  // Add new state variables for core requirement blocks
  const [selectedCoreBlocks, setSelectedCoreBlocks] = useState<CoreRequirementBlock[]>([]);

  // Add useEffect to periodically refresh open sections
  useEffect(() => {
    const fetchOpenSections = async () => {
      await openSectionsService.refreshOpenSections();
      setOpenSections(openSectionsService.openSectionsCache.get('current') || new Set());
    };

    fetchOpenSections();
    const interval = setInterval(fetchOpenSections, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Add function to check if a section is open
  const isSectionOpen = (section: ScheduledCourse): boolean => {
    return openSectionsService.isOpen(section.id);
  };

  // Add this useEffect to save courses when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses));
    }
  }, [selectedCourses]);

  // --- Derive Calendar Events ---  
  // For each course's selected section, flatten its meetingTimes into individual events.
  const deriveSchedule = (courses: GroupedCourse[], previewCourse?: string): PreviewEvent[] => {
    const events: PreviewEvent[] = [];
    courses.forEach((course) => {
      const section = course.selectedSection;
      if (section && section.meetingTimes) {
        section.meetingTimes.forEach((mt, index) => {
          const time = `${Math.floor(mt.startMinute / 60)}:${String(mt.startMinute % 60).padStart(2, "0")}`;
          events.push({
            ...section,
            id: `${section.id}-${index}`,
            groupName: course.name,
            day: mt.day,
            time,
          } as PreviewEvent);
        });

        // Add preview events for other sections when course is hovered
        if (previewCourse === course.name) {
          course.sections
            .filter(sec => sec.id !== section.id)
            .forEach(sec => {
              sec.meetingTimes.forEach((mt, index) => {
                const time = `${Math.floor(mt.startMinute / 60)}:${String(mt.startMinute % 60).padStart(2, "0")}`;
                events.push({
                  ...sec,
                  id: `preview-${sec.id}-${index}`,
                  groupName: course.name,
                  isPreview: true,
                  day: mt.day,
                  time,
                } as PreviewEvent);
              });
            });
        }
      }
    });
    return events;
  };

  // Update schedule to include preview events
  const schedule = deriveSchedule(selectedCourses, hoveredCourse || undefined);
  const earliest = getEarliestMinute(schedule);
  const latest = getLatestMinute(schedule);
  const totalHeight = (latest - earliest) * MINUTE_HEIGHT;

  // --- Course Management Functions ---
  const addCourseToSelected = (groupedCourse: GroupedCourse) => {
    if (selectedCourses.some((c) => c.name === groupedCourse.name)) return;
    const newCourse: GroupedCourse = {
      ...groupedCourse,
      selectedSection: groupedCourse.sections[0],
    };
    setSelectedCourses([...selectedCourses, newCourse]);
  };

  const handleSectionChange = (courseName: string, newSection: ScheduledCourse) => {
    const updatedCourses = selectedCourses.map((course) => {
      if (course.name === courseName) {
        return { ...course, selectedSection: newSection };
      }
      return course;
    });
    setSelectedCourses(updatedCourses);
  };

  const removeCourse = (courseName: string) => {
    console.log('Removing course:', courseName);
    setSelectedCourses(prev => prev.filter(course => course.name !== courseName));
  };

  // --- Hover & Drag/Drop ---
  const handleCourseHover = (course: ScheduledCourse | PreviewEvent | undefined) => {
    if (!course || !course.groupName) {
      setHoveredCourse(null);
      return;
    }
    setHoveredCourse(course.groupName);
  };

  const handleDragStart = (e: React.DragEvent, course: ScheduledCourse | PreviewEvent | null) => {
    if (!course) return;
    setDraggedCourse(course as ScheduledCourse);
    e.dataTransfer.setData("text/plain", course.name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day: string, minuteOffset: number) => {
    e.preventDefault();
    if (draggedCourse) {
      // Example: Update meeting start time for the dragged event.
      setDraggedCourse(null);
    }
  };

  // --- Apply a Schedule Combination ---
  // When a valid schedule combination is selected, update each course's selectedSection.
  const applyValidSchedule = (combination: ScheduledCourse[]) => {
    // Assume the order of sections in the combination matches the order of selectedCourses.
    const updatedCourses = selectedCourses.map((course, index) => ({
      ...course,
      selectedSection: combination[index],
    }));
    setSelectedCourses(updatedCourses);
  };

  // Update the scoreSchedule function to handle professor ratings
  function scoreSchedule(schedule: ScheduledCourse[], preferences: Preferences): number {
    let score = 100;
    
    const WEIGHTS = {
      TIME: 0.4,
      CAMPUS: 0.3,
      PROFESSOR: 0.3
    };

    let timeDeductions = 0;
    let campusDeductions = 0;
    let professorDeductions = 0;
    
    for (const section of schedule) {
      // Time preference scoring
      for (const mt of section.meetingTimes) {
        if (mt.startMinute < preferences.earliestStartTime) {
          const hoursTooEarly = (preferences.earliestStartTime - mt.startMinute) / 60;
          timeDeductions += Math.pow(1.5, hoursTooEarly) * 5;
        }
        
        if (mt.endMinute > preferences.latestEndTime) {
          const hoursTooLate = (mt.endMinute - preferences.latestEndTime) / 60;
          timeDeductions += Math.pow(1.5, hoursTooLate) * 5;
        }
      }
      
      // Campus preference scoring
      if (!preferences.preferredCampuses.includes(section.campus)) {
        campusDeductions += 10;
      }
      
      // Professor rating scoring
      const instructorNames = section.instructors.map(instructor => {
        if (typeof instructor === 'string') {
          return instructor;
        } else if (instructor.name) {
          return instructor.name;
        }
        return '';
      }).filter(Boolean);

      const ratings = findProfessorRatings(instructorNames);
      
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.avgRating, 0) / ratings.length;
        const ratingScore = (avgRating - 2.5) * 20;
        professorDeductions -= ratingScore;
      } else {
        professorDeductions += 5;
      }
    }

    const timeScore = Math.max(0, 100 - timeDeductions);
    const campusScore = Math.max(0, 100 - campusDeductions);
    const professorScore = Math.max(0, 100 - professorDeductions);

    score = (
      timeScore * WEIGHTS.TIME +
      campusScore * WEIGHTS.CAMPUS +
      professorScore * WEIGHTS.PROFESSOR
    );
    
    return Math.round(Math.max(0, score));
  }

  // Add function to fetch core courses
  const fetchCoreCourses = async (coreCode: CoreCode) => {
    if (loadingCore[coreCode] || coreCourses[coreCode]) return;
    
    setLoadingCore(prev => ({ ...prev, [coreCode]: true }));
  try {
    const response = await fetch('/api/courses');
    const allCourses = await response.json();
    
    const matchingCourses = allCourses.filter((course: { coreCodes: string; course: { subject: string; number: string }; title: string; sections: Array<{ registrationIndex: string; sectionNumber: string; meetingTimes: Array<{ meetingDay: string; startMinute: string; endMinute: string; campusName: string; buildingCode: string; roomNumber: string; meetingModeDesc: string }>; instructors: any[] }> }) => {
      if (!course.coreCodes) return false;
      
      // Split core codes and clean them up
      const courseCoreCodes = course.coreCodes.split(',').map(code => code.trim());
      
      // Check if any of the course's core codes match the requested core code
      return courseCoreCodes.some(code => code.includes(coreCode));
    });

    // Transform the matching courses into GroupedCourse format
    const groupedCourses = matchingCourses.map((course: { coreCodes: string; course: { subject: string; number: string }; title: string; sections: Array<{ registrationIndex: string; sectionNumber: string; meetingTimes: Array<{ meetingDay: string; startMinute: string; endMinute: string; campusName: string; buildingCode: string; roomNumber: string; meetingModeDesc: string }>; instructors: any[] }> }) => ({
      id: `${course.course.subject}${course.course.number}`,
      name: course.title,
      sections: course.sections.map(section => ({
        id: section.registrationIndex,
        name: course.title,
        campus: section.meetingTimes[0]?.campusName || 'Unknown',
        day: section.meetingTimes.map(mt => mt.meetingDay).join(', '),
        time: `${section.meetingTimes[0]?.startMinute}-${section.meetingTimes[0]?.endMinute}`,
        section: section.sectionNumber,
        instructors: section.instructors,
        meetingTimes: section.meetingTimes.map(mt => ({
          day: mt.meetingDay,
          startMinute: parseInt(mt.startMinute),
          endMinute: parseInt(mt.endMinute),
          location: mt.roomNumber ? `${mt.buildingCode} ${mt.roomNumber}` : undefined,
          mode: mt.meetingModeDesc
        })),
        class_number: section.registrationIndex,
        department: course.course.subject,
        coreRequirements: course.coreCodes.split(',').map(code => code.trim())
      }))
    }));

    setCoreCourses(prev => ({
      ...prev,
      [coreCode]: groupedCourses
    }));
  } catch (error) {
    console.error('Error fetching core courses:', error);
  } finally {
    setLoadingCore(prev => ({ ...prev, [coreCode]: false }));
  }
  };

  // Add function to handle adding a core requirement
  const addCoreRequirement = (coreCode: CoreCode) => {
    if (!selectedCoreCodes.includes(coreCode)) {
      setSelectedCoreCodes(prev => [...prev, coreCode]);
      fetchCoreCourses(coreCode);
    }
  };

  // Add function to remove a core requirement
  const removeCoreRequirement = (coreCode: CoreCode) => {
    setSelectedCoreCodes(prev => prev.filter(code => code !== coreCode));
  };

  // Add function to get a random course for a core requirement
  const getRandomCourseForCore = (coreCode: CoreCode): GroupedCourse | null => {
    const courses = coreCourses[coreCode];
    if (!courses || courses.length === 0) return null;
    return courses[Math.floor(Math.random() * courses.length)];
  };

  // Update getAllSchedules to handle core requirements
  function getAllSchedules(courses: GroupedCourse[], prefs: Preferences): { schedule: ScheduledCourse[]; valid: boolean; score: number }[] {
    const combinations: { schedule: ScheduledCourse[]; valid: boolean; score: number }[] = [];
    
    // Add core requirement courses to the mix
    const allCourses = [...courses];
    selectedCoreCodes.forEach(coreCode => {
      if (randomizeFromCore) {
        const randomCourse = getRandomCourseForCore(coreCode);
        if (randomCourse) allCourses.push(randomCourse);
      }
    });

    function backtrack(index: number, currentSchedule: ScheduledCourse[]) {
      if (index === allCourses.length) {
        // Check if schedule satisfies core requirements
        const satisfiesCoreRequirements = selectedCoreCodes.every(coreCode => {
          if (randomizeFromCore) return true; // Already handled by random course selection
          return currentSchedule.some(section => 
            section.coreRequirements?.includes(coreCode)
          );
        });

        if (!satisfiesCoreRequirements) return;

        // Calculate score and add to combinations
        const score = scoreSchedule(currentSchedule, prefs);
        combinations.push({
          schedule: [...currentSchedule],
          valid: true,
          score
        });
        return;
      }

      const course = allCourses[index];
      for (const section of course.sections) {
        // Skip if this section conflicts with any already selected section
        if (currentSchedule.some(existingSection => conflictBetween(existingSection, section))) {
          continue;
        }

        currentSchedule.push(section);
        backtrack(index + 1, currentSchedule);
        currentSchedule.pop();
      }
    }

    backtrack(0, []);
    return combinations.sort((a, b) => b.score - a.score);
  }

  // Replace the existing allSchedules calculation with:
  const allSchedules = getAllSchedules(selectedCourses, preferences)
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 10); // Get top 10

  // Filter asynchronous classes
  const asyncCourses = selectedCourses.filter(course => 
    course.selectedSection?.meetingTimes.some(mt => mt.mode === "ASYNC" || mt.mode === "REMOTE")
  );

  // Add these new handlers
  const handleMouseDown = (e: React.MouseEvent, isLeft: boolean) => {
    if (isLeft) {
      isDraggingLeft.current = true;
      initialLeftWidth.current = leftSidebarWidth;
    } else {
      isDraggingRight.current = true;
      initialRightWidth.current = rightSidebarWidth;
    }
    initialX.current = e.clientX;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingLeft.current) {
      const diff = e.clientX - initialX.current;
      const newWidth = initialLeftWidth.current + (diff / window.innerWidth) * 100;
      setLeftSidebarWidth(Math.min(Math.max(10, newWidth), 50)); // Limit between 10% and 50%
    } else if (isDraggingRight.current) {
      const diff = initialX.current - e.clientX;
      const newWidth = initialRightWidth.current + (diff / window.innerWidth) * 100;
      setRightSidebarWidth(Math.min(Math.max(20, newWidth), 50)); // Limit between 20% and 50%
    }
  };

  const handleMouseUp = () => {
    isDraggingLeft.current = false;
    isDraggingRight.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Add function to save schedule
  const saveSchedule = async () => {
    if (!user) {
      setSaveError("You must be logged in to save schedules");
      return;
    }
    
    if (!scheduleName.trim()) {
      setSaveError("Please enter a schedule name");
      return;
    }
    
    if (selectedCourses.length === 0) {
      setSaveError("Please add courses to your schedule");
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError("");
      
      // Extract selected sections from courses
      const sections = selectedCourses
        .filter(course => course.selectedSection)
        .map(course => course.selectedSection!);
      
      const response = await scheduleService.createSchedule({
        name: scheduleName,
        sections: sections
      });
      
      setSaveSuccess(true);
      setScheduleName("");
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error saving schedule:", error);
      setSaveError("Failed to save schedule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add function to share schedule
  const shareSchedule = async (scheduleId: string) => {
    try {
      const response = await scheduleService.createShareableLink(scheduleId);
      const shareableUrl = `${window.location.origin}${response.data.shareableLink}`;
      
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareableUrl);
      alert(`Schedule link copied to clipboard!\n${shareableUrl}`);
    } catch (error) {
      console.error("Error sharing schedule:", error);
      alert("Failed to create shareable link. Please try again.");
    }
  };

  // Add function to load saved schedules
  const loadSavedSchedules = async () => {
    if (!user) return;
    
    try {
      setLoadingSavedSchedules(true);
      setSavedSchedulesError("");
      
      const response = await scheduleService.getAllSchedules();
      setSavedSchedules(response.data);
    } catch (error) {
      console.error("Error loading saved schedules:", error);
      setSavedSchedulesError("Failed to load saved schedules");
    } finally {
      setLoadingSavedSchedules(false);
    }
  };

  // Load saved schedules when user changes
  useEffect(() => {
    if (user) {
      loadSavedSchedules();
    }
  }, [user]);

  // Add function to load a saved schedule
  const loadSavedSchedule = (schedule: any) => {
    if (!schedule.sections || schedule.sections.length === 0) {
      alert("This schedule has no sections to load");
      return;
    }
    
    // Group sections by course name
    const courseMap = new Map<string, any[]>();
    schedule.sections.forEach((section: any) => {
      if (!courseMap.has(section.groupName)) {
        courseMap.set(section.groupName, []);
      }
      courseMap.get(section.groupName)!.push(section);
    });
    
    // Create grouped courses
    const courses: GroupedCourse[] = [];
    courseMap.forEach((sections, name) => {
      courses.push({
        id: sections[0].baseSectionId.split('-')[0],
        name,
        sections,
        selectedSection: sections[0]
      });
    });
    
    setSelectedCourses(courses);
  };

  // Add function to delete a saved schedule
  const deleteSavedSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    
    try {
      await scheduleService.deleteSchedule(scheduleId);
      setSavedSchedules(schedules => schedules.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule");
    }
  };

  // Add CoreCodeSelector component
  const CoreCodeSelector = () => (
    <div className="mb-6 border-b pb-6 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Core Requirements</h3>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CORE_CODES).map(([code, description]) => {
            const isSelected = selectedCoreCodes.includes(code as CoreCode);
            return (
              <button
                key={code}
                onClick={() => isSelected ? removeCoreRequirement(code as CoreCode) : addCoreRequirement(code as CoreCode)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-colors",
                  isSelected
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                {code}
              </button>
            );
          })}
        </div>
        {selectedCoreCodes.length > 0 && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="randomize-core"
              checked={randomizeFromCore}
              onChange={(e) => setRandomizeFromCore(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="randomize-core" className="text-sm text-gray-700 dark:text-gray-300">
              Automatically fill with random courses
            </label>
          </div>
        )}
      </div>
    </div>
  );

  // Modify the section display to show open/closed status
  const SectionStatus = ({ section }: { section: ScheduledCourse }) => (
    <div className={cn(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
      isSectionOpen(section)
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    )}>
      {isSectionOpen(section) ? "Open" : "Closed"}
    </div>
  );

  const handleAddCoreBlock = (coreCode: CoreCode) => {
    setSelectedCoreBlocks(prev => [...prev, { coreCode }]);
  };

  const handleRemoveCoreBlock = (coreCode: CoreCode) => {
    setSelectedCoreBlocks(prev => prev.filter(block => block.coreCode !== coreCode));
  };

  const handleSelectCourseForCore = (coreCode: CoreCode, course: RutgersCourse) => {
    setSelectedCoreBlocks(prev => prev.map(block => 
      block.coreCode === coreCode ? { ...block, selectedCourse: course } : block
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Schedule Planner</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: Course Search Panel */}
        <div 
          className="bg-white dark:bg-gray-800 shadow-md p-4 overflow-y-auto"
          style={{ width: `${leftSidebarWidth}%` }}
        >
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add Courses</h2>
          
          {/* Add CoreCodeSelector */}
          <CoreCodeSelector />

          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Schedule Preferences</h3>
            
            {/* Time Preferences */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Earliest Start Time
              </label>
              <input
                type="time"
                value={`${String(Math.floor(preferences.earliestStartTime / 60)).padStart(2, '0')}:${String(preferences.earliestStartTime % 60).padStart(2, '0')}`}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  setPreferences({
                    ...preferences,
                    earliestStartTime: hours * 60 + minutes
                  });
                }}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latest End Time
              </label>
              <input
                type="time"
                value={`${String(Math.floor(preferences.latestEndTime / 60)).padStart(2, '0')}:${String(preferences.latestEndTime % 60).padStart(2, '0')}`}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  setPreferences({
                    ...preferences,
                    latestEndTime: hours * 60 + minutes
                  });
                }}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            {/* Campus Preferences */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Campuses
              </label>
              <div className="space-y-2">
                {Object.keys(CAMPUSES).map((campus) => (
                  <label key={campus} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.preferredCampuses.includes(campus)}
                      onChange={(e) => {
                        setPreferences({
                          ...preferences,
                          preferredCampuses: e.target.checked
                            ? [...preferences.preferredCampuses, campus]
                            : preferences.preferredCampuses.filter(c => c !== campus)
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{campus}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <CourseSearch 
            onSelectCourse={addCourseToSelected}
            selectedCourses={selectedCourses}
            onRemoveCourse={(courseId) => {
              const course = selectedCourses.find(c => c.id === courseId);
              if (course) removeCourse(course.name);
            }}
            onAddCourse={addCourseToSelected}
            onAddCoreBlock={handleAddCoreBlock}
            selectedCoreBlocks={selectedCoreBlocks}
          />
          
          {/* Save Schedule Form */}
          <div className="mt-6 border-t pt-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Save Schedule</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Schedule name"
                className="px-3 py-2 border rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isSaving}
              />
          <button
                onClick={saveSchedule}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
                {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
            {saveError && <p className="text-red-500 mt-2 text-sm">{saveError}</p>}
            {saveSuccess && <p className="text-green-500 mt-2 text-sm">Schedule saved successfully!</p>}
          </div>
          
          {/* Saved Schedules Section */}
          <div className="mt-6 border-t pt-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Saved Schedules</h3>
            {loadingSavedSchedules ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading saved schedules...
              </div>
            ) : savedSchedulesError ? (
              <p className="text-red-500 text-sm">{savedSchedulesError}</p>
            ) : savedSchedules.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-2">No saved schedules found.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {savedSchedules.map(schedule => (
                  <div key={schedule.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900 dark:text-white">{schedule.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {schedule.sections?.length || 0} sections • {new Date(schedule.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
          <button 
                        onClick={() => loadSavedSchedule(schedule)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
                        Load
          </button>
          <button 
                        onClick={() => shareSchedule(schedule.id)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
                        Share
          </button>
          <button 
                        onClick={() => deleteSavedSchedule(schedule.id)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
                        Delete
          </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

        {/* Resize Handle for Left Sidebar */}
        <div
          className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={(e) => handleMouseDown(e, true)}
        />

        {/* CENTER: Calendar View */}
        <div 
          className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Schedule</h2>
            <button 
              onClick={() => {
                const validSchedules = allSchedules.filter(s => s.valid);
                if (validSchedules.length === 0) {
                  alert("No valid schedules found for the selected courses");
                  return;
                }
                const randomIndex = Math.floor(Math.random() * validSchedules.length);
                applyValidSchedule(validSchedules[randomIndex].schedule);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              Generate Random Schedule
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Day Labels */}
            <div className="flex border-b dark:border-gray-700">
              {DAYS.map(day => (
                <div key={day} className="flex-1 text-center font-bold text-gray-700 dark:text-gray-200 py-3 bg-gray-50 dark:bg-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Content */}
            <div className="flex">
              {DAYS.map((day) => {
                const dayEvents = schedule.filter((ev) => ev.day === day);
                return (
                  <div
                    key={day}
                    className="relative border-r last:border-r-0 dark:border-gray-700 flex-grow"
                    style={{ height: totalHeight, minWidth: "120px" }}
                  >
                    {/* Hour lines/labels */}
                    {Array.from({ length: Math.ceil((latest - earliest) / 60) + 1 }).map((_, i) => {
                      const minuteMark = earliest + i * 60;
                      if (minuteMark > latest) return null;
                      const topPos = (minuteMark - earliest) * MINUTE_HEIGHT;
                      const hourLabel = `${Math.floor(minuteMark / 60)}:${String(minuteMark % 60).padStart(2, "0")}`;
                      return (
                        <div key={minuteMark}>
                          <div
                            className="absolute left-0 w-full border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dar k:text-gray-400"
                            style={{ top: topPos }}
                          >
                            <span className="ml-1 bg-white dark:bg-gray-800 px-1">{hourLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Event blocks */}
                    {dayEvents.map((ev) => {
                      const mt = ev.meetingTimes.find((m) => m.day === day);
                      if (!mt) return null;
                      const start = mt.startMinute;
                      const end = mt.endMinute;
                      const topPx = (start - earliest) * MINUTE_HEIGHT;
                      const heightPx = (end - start) * MINUTE_HEIGHT;
                      const isHovered = hoveredCourse === ev.groupName;

                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "absolute left-0 right-0 mx-1 rounded-md shadow-sm p-2 text-xs transition-all",
                            ev.isPreview 
                              ? "border-2 border-dashed border-indigo-300 dark:border-indigo-500 bg-opacity-30" 
                              : "cursor-move hover:shadow-md",
                            `bg-gradient-to-r ${CAMPUSES[ev.campus as keyof typeof CAMPUSES]?.gradient || 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'}`,
                            hoveredCourse && ev && !isHovered && !ev.isPreview ? "opacity-40" : "opacity-100",
                            ev.isPreview ? "pointer-events-none" : "overflow-hidden"
                          )}
                          style={{ top: topPx, height: heightPx }}
                          draggable={!ev.isPreview}
                          onMouseEnter={() => !ev.isPreview && handleCourseHover(ev)}
                          onMouseLeave={() => !ev.isPreview && handleCourseHover(undefined)}
                          onDragStart={(e) => !ev.isPreview && handleDragStart(e, ev)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, start - earliest)}
                        >
                          {!ev.isPreview ? (
                            <>
                              <div className="font-bold text-gray-800 dark:text-white truncate">{ev.name}</div>
                              <div className="text-gray-600 dark:text-gray-300 flex items-center justify-between">
                                <span>Section {ev.section}</span>
                                <SectionStatus section={ev} />
                              </div>
                              {heightPx > 60 && (
                                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate">
                                  {ev.instructors.join(", ")}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center text-indigo-600 dark:text-indigo-300 font-medium">
                              Section {ev.section}
                              <SectionStatus section={ev} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asynchronous Classes */}
          {asyncCourses.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Online/Remote Classes</h2>
              <div className="space-y-2">
                {asyncCourses.map(course => (
                  <div key={course.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{course.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Section {course.selectedSection?.section}</div>
                    </div>
                    <div className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      {course.selectedSection?.meetingTimes.map(mt => mt.mode).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

        {/* Resize Handle for Right Sidebar */}
        <div
          className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={(e) => handleMouseDown(e, false)}
        />

        {/* RIGHT SIDEBAR: Possible Schedules & Course Details */}
        <div 
          className="bg-white dark:bg-gray-800 shadow-md p-4 overflow-y-auto"
          style={{ width: `${rightSidebarWidth}%` }}
        >
          {/* Possible Schedules */}
          <div className="mb-6">
            <PossibleSchedules
              schedules={allSchedules}
              selectedCourses={selectedCourses}
              onApplySchedule={applyValidSchedule}
              preferences={preferences}
            />
          </div>
          
          {/* Course Details */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Selected Courses</h2>
            {selectedCourses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No courses added to your schedule.</p>
            ) : (
              <div className="space-y-4">
                {selectedCourses.map((course) => (
                  <div key={course.name} className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                      <button
                        onClick={() => removeCourse(course.name)} 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="p-3">
                      {/* Section Selection */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                        <select
                          value={course.selectedSection?.id || ""}
                          onChange={(e) => {
                            const selectedSec = course.sections.find((sec) => sec.id === e.target.value);
                            if (selectedSec) {
                              handleSectionChange(course.name, selectedSec);
                            }
                          }}
                          className="w-full p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">Choose a section</option>
                          {course.sections.map((sec) => (
                            <option 
                              key={sec.id} 
                              value={sec.id}
                              className={isSectionOpen(sec) ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}
                            >
                              Section {sec.section} - {formatInstructors(sec)} {isSectionOpen(sec) ? '(Open)' : '(Closed)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Section Details */}
                      {course.selectedSection && (
                        <div className="text-sm space-y-2">
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Instructor:</span> {formatInstructors(course.selectedSection)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Times:</div>
                            <div className="space-y-1">
                              {course.selectedSection.meetingTimes.map((mt, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md"
                                >
                                  <div className="text-gray-800 dark:text-gray-200">
                                    <span className="font-medium">{mt.day}</span>
                                    <span className="mx-1">•</span>
                                    <span>
                                      {Math.floor(mt.startMinute / 60)}:
                                      {String(mt.startMinute % 60).padStart(2, "0")} - 
                                      {Math.floor(mt.endMinute / 60)}:
                                      {String(mt.endMinute % 60).padStart(2, "0")}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                                    {mt.location || "No location"} 
                                    {mt.mode && ` (${mt.mode})`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Campus:</span> {course.selectedSection.campus}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
