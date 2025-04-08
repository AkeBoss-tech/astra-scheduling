// app/types/course.ts
import { CoreCode } from '@/app/services/api';

export interface MeetingTime {
  day: string;          // e.g. "Tuesday"
  startMinute: number;  // e.g. 950
  endMinute: number;    // e.g. 1030
  location?: string;
  mode: string;
}

export interface Instructor {
  name: string;
  rating?: number;
}

export interface ScheduledCourse {
  id: string;
  name: string;
  campus: string;
  day: string;
  time: string;
  section: string;
  instructors: Array<string | Instructor>;  // Allow both string and Instructor objects
  meetingTimes: MeetingTime[];
  class_number: string;
  department: string;
  location?: string;
  baseSectionId?: string;
  groupName?: string;
  credits?: string | number;
  coreRequirements?: CoreCode[];  // Add core requirements property
}

export interface GroupedCourse {
  id: string;
  name: string;
  sections: ScheduledCourse[];
  selectedSection?: ScheduledCourse;
  coreRequirements?: CoreCode[];  // Add core requirements to group level
}

// Saved Schedule type for backend integration
export interface SavedSchedule {
  id: number;
  user_id: number;
  name: string;
  semester: string;
  courses: ScheduledCourse[];
  is_public: boolean;
  share_link: string;
  created_at: string;
  updated_at: string;
}

export interface CourseList {
  id: string;
  name: string;
  courses: string[];
  owner?: {
    id: string;
    name: string;
  };
}

// Add new interface for core requirement placeholders
export interface CoreRequirementPlaceholder {
  id: string;
  coreCode: CoreCode;
  name: string;
  description: string;
}
