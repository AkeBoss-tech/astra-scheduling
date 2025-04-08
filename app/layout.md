# Project Overview

This document provides descriptions of the various components, functions, and views in the frontend application.

## Components

### AuthProvider
- **Purpose**: Manages user authentication state and provides context to the application.
- **Functions**:
  - `useAuth`: Custom hook to access the authentication context.
  - `signIn(token)`: Signs in the user with the provided token and fetches user data.
  - `signOut()`: Signs out the user and clears the authentication token.

### BackendConnectionTest
- **Purpose**: Tests the connection to the backend API and displays the status.
- **Functions**:
  - `useEffect`: Runs connection tests on component mount.

### Button
- **Purpose**: A reusable button component that accepts children and additional props.
- **Functions**:
  - Renders a button with default styles and any additional classes provided.

### CourseCard
- **Purpose**: Displays information about a course.
- **Functions**:
  - `formatMinutesToTime(minutes)`: Converts meeting times from minutes to a formatted string.

### CourseDataComponent
- **Purpose**: Displays selected courses in a list format.
- **Functions**:
  - `getParsedCourses()`: Parses course data from a JSON file.

### CourseLists
- **Purpose**: Manages and displays lists of courses.
- **Functions**:
  - `loadCourseLists()`: Fetches course lists from the backend.

### CourseSearch
- **Purpose**: Allows users to search for courses based on various filters.
- **Functions**:
  - `handleDeptChange(e)`: Updates the selected department.

### Friends
- **Purpose**: Displays a user's friends and friend requests.
- **Functions**:
  - `loadFriends()`: Fetches friends and friend requests from the backend.

### PossibleSchedules
- **Purpose**: Displays possible schedules based on selected courses.
- **Functions**:
  - `calculateDailySchedule(schedule)`: Computes the daily schedule from the selected courses.

### Preferences
- **Purpose**: Allows users to set their scheduling preferences.
- **Functions**:
  - `handlePriorityChange(index, newValue)`: Updates priority distribution among categories.

### SavedSchedules
- **Purpose**: Displays saved schedules for the user.
- **Functions**:
  - `loadSavedSchedules()`: Fetches saved schedules from the backend.

### ScheduleView
- **Purpose**: Visual representation of the schedule.
- **Functions**:
  - `formatTime(minutes)`: Formats time from minutes to a readable string.

### Sidebar
- **Purpose**: Navigation sidebar for the application.
- **Functions**:
  - `toggleSidebar()`: Toggles the visibility of the sidebar.

## Pages

### Home
- **Purpose**: The landing page of the application.
- **Features**: Provides an overview of the application's purpose and options to create or explore schedules.

### Login
- **Purpose**: User authentication page.
- **Features**: Allows users to sign in or register.

### Profile
- **Purpose**: Displays user profile information and navigation options.
- **Features**: Allows users to manage their account and view saved content.

### Scheduling
- **Purpose**: Main scheduling interface for users.
- **Features**: Allows users to select courses and view possible schedules.

### Test Connection
- **Purpose**: Tests the connection to the backend API.
- **Features**: Displays the status of various API endpoints.

### Users
- **Purpose**: Displays a list of users and their friendship status.
- **Features**: Allows users to send friend requests and manage friendships.

### Explore
- **Purpose**: Allows users to explore available courses.
- **Features**: Provides search and filtering options for courses.

## Backend Features

The backend of the application is built using Flask and Firebase, providing a robust API for managing user data, schedules, preferences, and friendships. Here are the current features:

1. **User Authentication**: Users can authenticate using Firebase, with token verification for secure access.

2. **User Preferences**: Users can save and retrieve their preferences through the `/api/user/preferences` endpoint.

3. **Schedules Management**: Users can create, update, and retrieve their schedules via the `/api/schedules` endpoint.

4. **Course Lists Management**: Users can manage their course lists through the `/api/course-lists` endpoint.

5. **Degree Plans Management**: Users can create and manage their degree plans with the `/api/degree-plans` endpoint.

6. **Friendship Management**: Users can send and manage friend requests using the `/api/friends` endpoint.

7. **Shared Schedules**: Users can retrieve shared schedules using a unique share link.

8. **Health Check**: A simple health check endpoint (`/api/hello`) to verify backend connectivity.

## Firebase Database Schema

The Firebase database schema is structured as follows:

1. **Users Collection**: Contains user documents with fields:
   - `email`: User's email address
   - `name`: User's full name
   - `profile_picture`: URL to the user's profile picture
   - `created_at`: Timestamp of account creation

2. **Preferences Collection**: Stores user preferences with fields:
   - `user_id`: Reference to the user
   - `preferences`: Object containing user preference settings
   - `updated_at`: Timestamp of the last update

3. **Schedules Collection**: Contains user schedules with fields:
   - `user_id`: Reference to the user
   - `schedule_data`: Object containing schedule details
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of the last update

4. **Course Lists Collection**: Manages course lists with fields:
   - `user_id`: Reference to the user
   - `list_data`: Object containing course list details
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of the last update

5. **Degree Plans Collection**: Stores degree plans with fields:
   - `user_id`: Reference to the user
   - `plan_data`: Object containing degree plan details
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of the last update

6. **Friendships Collection**: Manages friendships with fields:
   - `requester_id`: Reference to the user sending the request
   - `addressee_id`: Reference to the user receiving the request
   - `status`: Status of the friendship (e.g., pending, accepted)
   - `created_at`: Timestamp of creation