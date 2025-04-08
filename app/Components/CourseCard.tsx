"use client"
import React from "react";
import { RutgersCourse } from "@/app/types/RutgersCourse";

interface CourseCardProps {
  course: RutgersCourse;
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  const ampm = hours < 12 ? "AM" : "PM";
  return `${formattedHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded shadow-md mb-4">
      <h2 className="text-xl font-bold">{course.fullTitle}</h2>
      <p className="text-sm">{course.fullTitle}</p>
      <p><strong>Department:</strong> {course.department}</p>
      <p><strong>Credits:</strong> {course.credits}</p>
      <p><strong>Campus:</strong> {course.campus}</p>
      <div>
        <strong>Meeting Times:</strong>
        <ul>
          {course.meetingTimes.map((mt, index) => (
            <li key={index}>
              {mt.day} at {formatMinutesToTime(mt.startMinute)} - {mt.location} ({mt.mode})
            </li>
          ))}
        </ul>
      </div>
      <p><strong>Instructors:</strong> {course.instructors.join(", ")}</p>
      <p><strong>Section:</strong> {course.section}</p>
      {course.subjectNotes && <p><strong>Notes:</strong> {course.subjectNotes}</p>}
    </div>
  );
};

export default CourseCard;
