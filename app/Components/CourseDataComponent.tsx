// app/Components/CourseDataComponent.tsx
import rawCoursesData from '@/data/combined_courses.json';
import { RutgersCourse } from "@/app/types/RutgersCourse";
import { GroupedCourse } from '@/app/types/course';
import { CORE_CODES, CoreCode } from "@/app/services/api";

interface CourseData {
  courseOfferings: {
    title: string;
    fullTitle: string;
    course: { subject: string; number: string };
    credits: string;
    sections: any[];
    coreCodes?: string;
    subjectNotes?: string | null;
  }[];
}

const coursesData: CourseData = rawCoursesData as CourseData;

export function getParsedCourses(): RutgersCourse[] {
  // Log raw data structure
  console.log('First few course offerings:', coursesData.courseOfferings.slice(0, 3).map(offering => ({
    title: offering.title,
    coreCodes: offering.coreCodes,
    raw: offering
  })));

  // Add counters for core requirements
  const coreCodeCounts: { [key in CoreCode]?: number } = {};
  Object.keys(CORE_CODES).forEach((code: string) => {
    coreCodeCounts[code as CoreCode] = 0;
  });

  const courses = coursesData.courseOfferings.flatMap((offering: CourseData['courseOfferings'][0]) =>
    offering.sections.map((section: any) => {
      // Parse core codes from the string format
      let coreRequirements: CoreCode[] = [];
      
      if (offering.coreCodes) {
        const codes = offering.coreCodes;
        console.log(`Raw core codes for ${offering.title}:`, codes);
        
        // Try different parsing strategies
        if (typeof codes === 'string') {
          // Strategy 1: Split by comma and look for codes in parentheses
          const parenthesesMatches = codes.match(/\(([^)]+)\)/g);
          if (parenthesesMatches) {
            coreRequirements = parenthesesMatches
              .map(match => match.slice(1, -1).trim())
              .filter((code): code is CoreCode => Object.keys(CORE_CODES).includes(code));
          }
          
          // Strategy 2: Direct matching of core codes
          if (coreRequirements.length === 0) {
            coreRequirements = codes.split(/[,\s]+/)
              .map(code => code.trim())
              .filter((code): code is CoreCode => Object.keys(CORE_CODES).includes(code));
          }
        } else if (Array.isArray(codes)) {
          // Strategy 3: Handle array format
          const codeArray = codes as string[];
          coreRequirements = codeArray
            .map((code: string) => code.trim())
            .filter((code: string): code is CoreCode => Object.keys(CORE_CODES).includes(code));
        }
        
        console.log(`Parsed core requirements for ${offering.title}:`, coreRequirements);
      }

      // Count core requirements
      coreRequirements.forEach(code => {
        if (coreCodeCounts[code] !== undefined) {
          coreCodeCounts[code]!++;
        }
      });

      return {
        id: section.registrationIndex,
        courseName: offering.title,
        fullTitle: offering.fullTitle,
        department: offering.course.subject,
        class_number: offering.course.number,
        credits: offering.credits || "TBA",
        campus: section.meetingTimes.length > 0 ? section.meetingTimes[0].campusName : "Unknown",
        meetingTimes: section.meetingTimes.map((mt: any) => ({
          day: mt.meetingDay || "TBA",
          startMinute: Number(mt.startMinute || 0),
          endMinute: Number(mt.endMinute || 0),
          location: mt.buildingCode + " " + mt.roomNumber || "TBA",
          mode: mt.meetingModeDesc || "TBA",
        })),      
        instructors: section.instructors.map((inst: any) => inst.name) || ["TBA"],
        section: section.sectionNumber,
        subjectNotes: offering.subjectNotes || null,
        coreRequirements: coreRequirements,
      } as RutgersCourse;
    })
  );

  // Log the counts
  console.log('Core requirement counts:');
  Object.entries(coreCodeCounts).forEach(([code, count]) => {
    console.log(`${code}: ${count} courses`);
  });

  // Log courses with core requirements
  console.log('\nCourses with core requirements:');
  courses.filter(course => course.coreRequirements.length > 0)
    .slice(0, 10)
    .forEach(course => {
      console.log(`${course.courseName} (${course.department} ${course.class_number}):`, course.coreRequirements);
    });

  return courses;
}

// Add function to get courses by core requirement
export function getCoursesByCore(coreCode: CoreCode): RutgersCourse[] {
  return getParsedCourses().filter(course => 
    course.coreRequirements?.includes(coreCode)
  );
}

// Add function to get all core requirements for a course
export function getCoreRequirements(course: RutgersCourse): CoreCode[] {
  return course.coreRequirements || [];
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  const ampm = hours < 12 ? "AM" : "PM";
  return `${formattedHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

interface CoreRequirementBlock {
  coreCode: CoreCode;
  selectedCourse?: RutgersCourse;
}

interface CourseDataComponentProps {
  selectedCourses: GroupedCourse[];
  selectedCoreBlocks: CoreRequirementBlock[];
  onRemoveCourse: (courseName: string) => void;
  onRemoveCoreBlock: (coreCode: CoreCode) => void;
  onSelectCourseForCore: (coreCode: CoreCode, course: RutgersCourse) => void;
}

const CourseDataComponent = ({ 
  selectedCourses, 
  selectedCoreBlocks,
  onRemoveCourse,
  onRemoveCoreBlock,
  onSelectCourseForCore
}: CourseDataComponentProps) => {
  // Get all courses that satisfy a specific core requirement
  const getCoursesForCore = (coreCode: CoreCode): RutgersCourse[] => {
    return getParsedCourses().filter(course => 
      course.coreRequirements?.includes(coreCode)
    );
  };

  return (
    <div className="bg-black/40 rounded-lg shadow p-2 sm:p-4">
      <h2 className="text-lg font-semibold mb-2 text-zinc-100">Selected Courses</h2>
      <div className="space-y-2">
        {/* Regular selected courses */}
        {selectedCourses.map((course) => (
          <div key={course.name} className="flex justify-between items-center p-2 border border-zinc-800 rounded">
            <div className="text-sm">
              <div className="font-medium text-zinc-100">{course.name}</div>
              <div className="text-zinc-400">
                {course.selectedSection?.department} {course.selectedSection?.class_number}
              </div>
            </div>
            <button 
              onClick={() => onRemoveCourse(course.name)}
              className="text-red-500 hover:text-red-400 text-sm p-1"
            >
              Remove
            </button>
          </div>
        ))}

        {/* Core requirement blocks */}
        {selectedCoreBlocks.map((block) => {
          const availableCourses = getCoursesForCore(block.coreCode);
          
          return (
            <div key={block.coreCode} className="flex flex-col p-2 border border-zinc-800 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm">
                  <div className="font-medium text-zinc-100">
                    {block.coreCode} - {CORE_CODES[block.coreCode]}
                  </div>
                  {block.selectedCourse && (
                    <div className="text-zinc-400">
                      Selected: {block.selectedCourse.courseName}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onRemoveCoreBlock(block.coreCode)}
                  className="text-red-500 hover:text-red-400 text-sm p-1"
                >
                  Remove
                </button>
              </div>
              
              <select
                className="w-full bg-zinc-800 text-zinc-100 rounded p-1 text-sm mt-1"
                value={block.selectedCourse?.id || ""}
                onChange={(e) => {
                  const selectedCourse = availableCourses.find(c => c.id === e.target.value);
                  if (selectedCourse) {
                    onSelectCourseForCore(block.coreCode, selectedCourse);
                  }
                }}
              >
                <option value="">Select a course...</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.department} {course.class_number} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {selectedCourses.length === 0 && selectedCoreBlocks.length === 0 && (
          <div className="text-zinc-400 text-sm text-center py-2">
            No courses selected
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDataComponent;
