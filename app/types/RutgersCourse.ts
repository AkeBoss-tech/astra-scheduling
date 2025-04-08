import { CoreCode } from '@/app/services/api';

export interface MeetingTime {
  day: string;
  startMinute: number;
  endMinute: number;
  location: string;
  mode: string;
}

export interface RutgersCourse {
  id: string;
  courseName: string;
  fullTitle: string;
  department: string;
  class_number: string;
  credits: string | number;
  campus: string;
  meetingTimes: Array<{
    day: string;
    startMinute: number;
    endMinute: number;
    location?: string;
    mode: string;
  }>;
  instructors: string[];
  section: string;
  subjectNotes: string | null;
  coreRequirements: CoreCode[];
} 