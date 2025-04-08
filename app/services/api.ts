import axios from 'axios';

// Base API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('Google Client ID:', GOOGLE_CLIENT_ID);
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
interface UserData {
  email: string;
  name?: string;
  profile_picture?: string;
}

interface CourseData {
  course_code: string;
  name: string;
  credits: number;
  time_slot?: string;
  semester?: number;
}

interface ScheduleData {
  name: string;
  courses?: CourseData[];
  sections?: any[]; // Add sections field for the new format
}

interface CourseListData {
  name: string;
  courses: CourseData[];
}

interface DegreePlanData {
  name: string;
  total_credits: number;
  required_courses: CourseData[];
}

interface ScheduledCourse {
  id: string;
  name: string;
  campus: string;
  section: string;
  instructors: Array<string | { name: string; rating?: number }>;
  meetingTimes: Array<{
    day: string;
    startMinute: number;
    endMinute: number;
    location?: string;
    mode?: string;
  }>;
  class_number: string;
  department: string;
  groupName?: string;
  credits?: string | number;
}

// Authentication API services
const authService = {
  setAuthToken: (token: string | null) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },

  getCurrentUser: () => {
    return axiosInstance.get('/api/auth/user');
  },

  register: (name: string, email: string, password: string) => {
    return axiosInstance.post('/api/auth/register', { name, email, password });
  },

  login: (email: string, password: string) => {
    return axiosInstance.post('/api/auth/login', { email, password });
  },

  googleAuth: async () => {
    // Generate Google OAuth URL directly
    const redirectUri = `${FRONTEND_URL}/auth/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    
    // Add state parameter for security
    const state = Math.random().toString(36).substring(7);
    if (typeof window !== 'undefined') {
      localStorage.setItem('oauth_state', state);
    }
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('response_type', responseType);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', state);
    
    // Log the complete URL in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Redirect URI:', redirectUri);
      console.log('Auth URL:', authUrl.toString());
    }
    
    // Redirect to Google OAuth page
    window.location.href = authUrl.toString();
  },
  
  handleGoogleCallback: async (code: string) => {
    const redirectUri = `${FRONTEND_URL}/auth/callback`;
    
    // Log the request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending callback request to:', `${API_URL}/api/auth/google/callback`);
      console.log('With code:', code);
      console.log('And redirect URI:', redirectUri);
    }
    
    const response = await axiosInstance.post('/api/auth/google/callback', { 
      code,
      redirect_uri: redirectUri
    });
    
    // Log the response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Callback response:', response.data);
    }
    
    return response;
  },
};

// User preferences API services
const preferencesService = {
  getPreferences: () => {
    return axiosInstance.get('/api/user/preferences');
  },
  
  updatePreferences: (preferences: any) => {
    return axiosInstance.post('/api/user/preferences', preferences);
  }
};

// Schedule API services
const scheduleService = {
  getAllSchedules: async () => {
    return axiosInstance.get('/api/schedules');
  },
  
  createSchedule: async (data: ScheduleData) => {
    return axiosInstance.post('/api/schedules', data);
  },

  getScheduleById: async (id: string) => {
    return axiosInstance.get(`/api/schedules/${id}`);
  },

  updateSchedule: async (id: string, data: Partial<ScheduleData>) => {
    return axiosInstance.put(`/api/schedules/${id}`, data);
  },

  deleteSchedule: async (id: string) => {
    return axiosInstance.delete(`/api/schedules/${id}`);
  },

  generateSchedules: async (data: { courses: string[], preferences?: any }) => {
    return axiosInstance.post('/api/schedules/generate', data);
  },

  syncToCalendar: async (data: { scheduleId: string, courses: any[] }) => {
    return axiosInstance.post(`/api/schedules/${data.scheduleId}/sync`, data);
  },

  createShareableLink: async (scheduleId: string) => {
    return axiosInstance.post(`/api/schedules/${scheduleId}/share`);
  },

  getSavedSchedules: async (userId: string) => {
    return axiosInstance.get(`/api/schedules?userId=${userId}`);
  },

  searchCourses: async (query: string) => {
    return axiosInstance.get(`/api/schedules/courses/search?q=${encodeURIComponent(query)}`);
  },

  getAllCourses: async () => {
    return axiosInstance.get('/api/schedules/courses');
  },

  getSharedSchedule: async (shareLink: string) => {
    return axiosInstance.get(`/api/schedules/shared/${shareLink}`);
  },
};

// Course list API services
const courseListService = {
  getAllCourseLists: () => {
    return axiosInstance.get('/api/course-lists');
  },
  
  getSharedCourseLists: () => {
    return axiosInstance.get('/api/course-lists/shared');
  },
  
  createCourseList: (data: CourseListData) => {
    return axiosInstance.post('/api/course-lists', data);
  },

  getCourseListById: (id: string) => {
    return axiosInstance.get(`/api/course-lists/${id}`);
  },

  updateCourseList: (id: string, data: Partial<CourseListData>) => {
    return axiosInstance.put(`/api/course-lists/${id}`, data);
  },

  deleteCourseList: (id: string) => {
    return axiosInstance.delete(`/api/course-lists/${id}`);
  },

  shareList: (listId: string) => {
    return axiosInstance.post(`/api/course-lists/${listId}/share`);
  },

  addCourseToList: (listId: string, courseId: string) => {
    return axiosInstance.post(`/api/course-lists/${listId}/courses`, { course_id: courseId });
  },

  removeCourseFromList: (listId: string, courseId: string) => {
    return axiosInstance.delete(`/api/course-lists/${listId}/courses/${courseId}`);
  }
};

// Degree plan API services
const degreeService = {
  getAllDegreePlans: () => {
    return axiosInstance.get('/api/degree-plans');
  },
  
  createDegreePlan: (data: DegreePlanData) => {
    return axiosInstance.post('/api/degree-plans', data);
  },

  getDegreePlanById: (id: string) => {
    return axiosInstance.get(`/api/degree-plans/${id}`);
  },

  updateDegreePlan: (id: string, data: Partial<DegreePlanData>) => {
    return axiosInstance.put(`/api/degree-plans/${id}`, data);
  },

  deleteDegreePlan: (id: string) => {
    return axiosInstance.delete(`/api/degree-plans/${id}`);
  }
};

// Friend API services
const friendService = {
  getAllFriends: () => {
    return axiosInstance.get('/api/friends');
  },
  
  getFriendRequests: () => {
    return axiosInstance.get('/api/friends/requests');
  },
  
  sendFriendRequest: (addresseeId: string) => {
    return axiosInstance.post('/api/friends', { addressee_id: addresseeId });
  },

  acceptFriendRequest: (requestId: string) => {
    return axiosInstance.post(`/api/friends/${requestId}/accept`);
  },

  rejectFriendRequest: (requestId: string) => {
    return axiosInstance.post(`/api/friends/${requestId}/reject`);
  },

  removeFriend: (friendId: string) => {
    return axiosInstance.delete(`/api/friends/${friendId}`);
  }
};

// User API services
const userService = {
  getAllUsers: async () => {
    return axiosInstance.get('/api/users');
  },
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      authService.setAuthToken(null);
      // You might want to redirect to login page here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add these functions to fetch open sections and core requirements
export const openSectionsService = {
  async getOpenSections(year: number = 2025, term: number = 9, campus: string = 'NB'): Promise<string[]> {
    try {
      const response = await fetch(`https://classes.rutgers.edu/soc/api/openSections.json?year=${year}&term=${term}&campus=${campus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch open sections');
      }
      return response.json();
    } catch (error) {
      // If fetch fails, load from local JSON file
      const localData = await import('@/data/openSections.json');
      return localData.default;
    }
  },

  // Cache the open sections data
  openSectionsCache: new Map<string, Set<string>>(),
  lastFetchTime: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  async refreshOpenSections(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchTime < this.CACHE_DURATION) {
      return; // Use cached data if it's fresh enough
    }

    try {
      const sections = await this.getOpenSections();
      this.openSectionsCache.clear();
      const sectionSet = new Set(sections);
      this.openSectionsCache.set('current', sectionSet);
      this.lastFetchTime = now;
    } catch (error) {
      console.error('Failed to refresh open sections:', error);
    }
  },

  isOpen(index: string): boolean {
    // if index has a dash, split it into two parts and check the first part
    if (index.includes('-')) {
      const parts = index.split('-');
      index = parts[0];
    }

    const currentSections = this.openSectionsCache.get('current');
    return currentSections ? currentSections.has(index) : false;
  }
};

// Core requirement codes and their descriptions
export const CORE_CODES = {
  AHo: 'Arts and Humanities',
  CCO: 'Contemporary Challenges - Our Common Future',
  CCD: 'Contemporary Challenges - Diversity and Social Justice',
  HST: 'Historical Analysis',
  ITR: 'Information Technology and Research',
  NS: 'Natural Sciences',
  QQ: 'Quantitative Information',
  QR: 'Quantitative Reasoning',
  SCL: 'Social Analysis',
  WC: 'Writing and Communication',
  WCr: 'Writing and Communication - Revision',
  WCd: 'Writing and Communication - Disciplinary'
} as const;

export type CoreCode = keyof typeof CORE_CODES;

// Add core courses service
export const coreCoursesService = {
  async getCoursesByCore(coreCode: CoreCode): Promise<{ data: ScheduledCourse[] }> {
    return axiosInstance.get(`/api/courses/core/${coreCode}`);
  }
};

export {
  authService,
  userService,
  preferencesService,
  scheduleService,
  courseListService,
  degreeService,
  friendService
};
