import React, { useState, useEffect, useMemo } from 'react';
import { ScheduledCourse, GroupedCourse } from '@/app/types/course';
import { cn } from "@/app/lib/utils";
import { DAYS, CAMPUSES, CLASS_COLORS } from "@/app/lib/constants";
import { ProfessorRating, findProfessorRatings } from "@/app/lib/professorData";

interface PossibleSchedulesProps {
  schedules: { schedule: ScheduledCourse[]; valid: boolean; score: number }[];
  selectedCourses: GroupedCourse[];
  onApplySchedule: (schedule: ScheduledCourse[]) => void;
  preferences: {
    earliestStartTime: number;
    latestEndTime: number;
    preferredCampuses: string[];
    minimumProfessorRating: number;
  };
}

interface DailySchedule {
  day: string;
  events: {
    time: string;
    description: string;
    duration: number;
    type: 'class' | 'commute' | 'wait';
    location?: string;
  }[];
}

type TabType = 'schedules' | 'professors' | 'commute';

interface ScoreBreakdown {
  total: number;
  timeScore: number;
  campusScore: number;
  professorScore: number;
  details: {
    category: string;
    score: number;
    explanation: string;
  }[];
}

function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export default function PossibleSchedules({ schedules, selectedCourses, onApplySchedule, preferences }: PossibleSchedulesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('schedules');
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [professorRatings, setProfessorRatings] = useState<Map<string, ProfessorRating[]>>(new Map());
  const displayedSchedules = schedules.slice(0, 10);

  // Create a map of course names to unique colors
  const courseColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    selectedCourses.forEach((course, index) => {
      colorMap.set(course.name, CLASS_COLORS[index % CLASS_COLORS.length]);
    });
    return colorMap;
  }, [selectedCourses]);

  // Load professor ratings when selected sections change
  useEffect(() => {
    const loadProfessorRatings = async () => {
      const newRatings = new Map<string, ProfessorRating[]>();
      
      for (const course of selectedCourses) {
        if (!course.selectedSection) continue;
        
        // Handle both string and array instructor data
        const instructors = course.selectedSection.instructors || 
          (course.selectedSection as any).instructor;
        console.log('Loading ratings for course:', course.name, 'instructors:', instructors);
        
        if (!instructors) {
          console.log('No instructor data for course:', course.name);
          continue;
        }

        // Convert instructors to array of strings
        const instructorNames = Array.isArray(instructors) 
          ? instructors.map(instructor => typeof instructor === 'string' ? instructor : instructor.name)
          : [instructors];

        const ratings = findProfessorRatings(instructorNames);
        if (ratings.length > 0) {
          newRatings.set(course.name, ratings);
        }
      }
      
      setProfessorRatings(newRatings);
    };

    loadProfessorRatings();
  }, [selectedCourses]);

  // Function to calculate detailed daily schedule
  const calculateDailySchedule = (schedule: ScheduledCourse[]): DailySchedule[] => {
    const dailySchedules: DailySchedule[] = DAYS.map(day => ({
      day,
      events: [],
    }));

    const commuteTimes: { [key: string]: number } = {
      'Busch->Livingston': 10,
      'Busch->College Ave': 15,
      'Busch->Cook/Douglass': 25,
      'Livingston->College Ave': 15,
      'Livingston->Cook/Douglass': 25,
      'College Ave->Cook/Douglass': 15,
    };

    // Process each day's schedule
    for (const day of DAYS) {
      const dayEvents = schedule
        .filter(course => course.meetingTimes.some(mt => mt.day === day))
        .flatMap(course => course.meetingTimes
          .filter(mt => mt.day === day)
          .map(mt => ({
            course,
            startMinute: mt.startMinute,
            endMinute: mt.endMinute,
            location: mt.location || 'TBA',
          })))
        .sort((a, b) => a.startMinute - b.startMinute);

      const daySchedule = dailySchedules.find(ds => ds.day === day)!;

      // Add events for this day
      for (let i = 0; i < dayEvents.length; i++) {
        const event = dayEvents[i];
        const prevEvent = dayEvents[i - 1];

        // If there's a previous event, calculate wait time and commute if needed
        if (prevEvent) {
          const waitTime = event.startMinute - prevEvent.endMinute;
          
          if (prevEvent.course.campus !== event.course.campus) {
            const commuteKey = [prevEvent.course.campus, event.course.campus].sort().join('->');
            const commuteTime = commuteTimes[commuteKey] || 0;
            
            // Add wait before commute if there's enough time
            if (waitTime > commuteTime) {
              const waitDuration = waitTime - commuteTime;
              if (waitDuration >= 15) { // Only show waits of 15+ minutes
                daySchedule.events.push({
                  time: formatTime(prevEvent.endMinute),
                  description: `Wait at ${prevEvent.course.campus}`,
                  duration: waitDuration,
                  type: 'wait',
                  location: prevEvent.location,
                });
              }
            }

            // Add commute event
            daySchedule.events.push({
              time: formatTime(event.startMinute - commuteTime),
              description: `Travel from ${prevEvent.course.campus} to ${event.course.campus}`,
              duration: commuteTime,
              type: 'commute',
            });
          } else if (waitTime >= 15) { // If on same campus, just show wait time if significant
            daySchedule.events.push({
              time: formatTime(prevEvent.endMinute),
              description: `Break between classes`,
              duration: waitTime,
              type: 'wait',
              location: prevEvent.location,
            });
          }
        }

        // Add class event
        daySchedule.events.push({
          time: formatTime(event.startMinute),
          description: `${event.course.name} - Section ${event.course.section}`,
          duration: event.endMinute - event.startMinute,
          type: 'class',
          location: event.location,
        });
      }
    }

    return dailySchedules;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

  const renderCampusLegend = () => (
    <div className="mb-4 p-3 bg-gray-700 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Campus Colors</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(CAMPUSES).map(([campus, info]) => (
          <div key={campus} className="flex items-center space-x-2">
            <div className={cn("w-4 h-4 rounded bg-gradient-to-r", info.gradient)} />
            <span className="text-sm text-gray-300">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const getEventStyle = (event: { type: string; course?: ScheduledCourse }) => {
    if (event.type === 'class' && event.course) {
      const campusInfo = CAMPUSES[event.course.campus as keyof typeof CAMPUSES] || {
        gradient: 'from-gray-500 to-gray-700',
        label: 'Unknown Campus',
        color: 'gray'
      };
      const courseColor = courseColors.get(event.course.name);
      return cn(
        "p-2 rounded text-sm",
        `bg-gradient-to-r ${campusInfo.gradient}`,
        courseColor && `from-${courseColor}-500/50`
      );
    }
    if (event.type === 'commute') return "p-2 rounded text-sm bg-orange-900/50";
    return "p-2 rounded text-sm bg-gray-600";
  };

  const calculateScoreBreakdown = (schedule: ScheduledCourse[]): ScoreBreakdown => {
    // Weight factors for different components
    const WEIGHTS = {
      TIME: 0.4,      // 40% weight for time preferences
      CAMPUS: 0.3,    // 30% weight for campus preferences
      PROFESSOR: 0.3  // 30% weight for professor ratings
    };

    let timeDeductions = 0;
    let campusDeductions = 0;
    let professorDeductions = 0;
    const details: ScoreBreakdown['details'] = [];

    // Time preference scoring
    for (const section of schedule) {
      for (const mt of section.meetingTimes) {
        // Early morning penalty (exponential)
        if (mt.startMinute < preferences.earliestStartTime) {
          const hoursTooEarly = (preferences.earliestStartTime - mt.startMinute) / 60;
          const deduction = Math.pow(1.5, hoursTooEarly) * 5;
          timeDeductions += deduction;
          details.push({
            category: 'Time',
            score: -Math.round(deduction),
            explanation: `${section.name} starts ${hoursTooEarly.toFixed(1)} hours before preferred time (exponential penalty)`
          });
        }
        
        // Late evening penalty (exponential)
        if (mt.endMinute > preferences.latestEndTime) {
          const hoursTooLate = (mt.endMinute - preferences.latestEndTime) / 60;
          const deduction = Math.pow(1.5, hoursTooLate) * 5;
          timeDeductions += deduction;
          details.push({
            category: 'Time',
            score: -Math.round(deduction),
            explanation: `${section.name} ends ${hoursTooLate.toFixed(1)} hours after preferred time (exponential penalty)`
          });
        }
      }
    }

    // Campus preference scoring
    for (const section of schedule) {
      if (!preferences.preferredCampuses.includes(section.campus)) {
        campusDeductions += 10;
        details.push({
          category: 'Campus',
          score: -10,
          explanation: `${section.name} is on non-preferred campus (${section.campus})`
        });
      }
    }

    // Professor rating scoring
    for (const section of schedule) {
      const instructors = Array.isArray(section.instructors) ? section.instructors : [section.instructors];
      let sectionProfScore = 0;
      let ratedProfessors = 0;

      for (const instructor of instructors) {
        if (typeof instructor === 'object' && instructor.rating) {
          sectionProfScore += instructor.rating;
          ratedProfessors++;
        }
      }

      if (ratedProfessors > 0) {
        const avgRating = sectionProfScore / ratedProfessors;
        // Use a curve that heavily penalizes low ratings but gives bonus for high ratings
        const ratingScore = (avgRating - 2.5) * 20; // Center at 2.5, scale by 20
        professorDeductions -= ratingScore;
        
        const scoreText = ratingScore > 0 ? `bonus of +${Math.round(ratingScore)}` : `penalty of ${Math.round(ratingScore)}`;
        details.push({
          category: 'Professor',
          score: Math.round(ratingScore),
          explanation: `${section.name} professor rating: ${avgRating.toFixed(1)} (${scoreText} points)`
        });
      } else {
        professorDeductions += 5;
        details.push({
          category: 'Professor',
          score: -5,
          explanation: `${section.name} has no professor ratings available (-5 points)`
        });
      }
    }

    // Calculate component scores
    const timeScore = Math.max(0, 100 - timeDeductions);
    const campusScore = Math.max(0, 100 - campusDeductions);
    const professorScore = Math.max(0, 100 - professorDeductions);

    // Calculate weighted total
    const total = Math.round(
      timeScore * WEIGHTS.TIME +
      campusScore * WEIGHTS.CAMPUS +
      professorScore * WEIGHTS.PROFESSOR
    );

    return {
      total,
      timeScore: Math.round(timeScore),
      campusScore: Math.round(campusScore),
      professorScore: Math.round(professorScore),
      details: details.sort((a, b) => b.score - a.score) // Sort by score descending
    };
  };

  const renderSchedulesTab = () => {
    const sortedSchedules = [...schedules]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return (
      <>
        {renderCampusLegend()}
        <div className="space-y-2">
          {sortedSchedules.map((combo, index) => {
            const scoreBreakdown = calculateScoreBreakdown(combo.schedule);
            return (
              <div
                key={index}
                className={cn(
                  "border p-3 rounded-lg hover:bg-gray-700 transition-colors",
                  combo.valid ? "border-green-500" : "border-red-500 opacity-75"
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300">Schedule {index + 1}</span>
                  <button
                    onClick={() => {
                      setSelectedSchedule(index);
                      setShowScoreBreakdown(true);
                    }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>Score: {combo.score}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-sm space-y-1">
                  {combo.schedule.map((section, i) => {
                    const campusInfo = CAMPUSES[section.campus as keyof typeof CAMPUSES] || {
                      gradient: 'from-gray-500 to-gray-700',
                      label: 'Unknown Campus',
                      color: 'gray'
                    };
                    return (
                      <div key={section.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-3 h-3 rounded bg-gradient-to-r",
                            campusInfo.gradient,
                            courseColors.get(section.name) && `from-${courseColors.get(section.name)}-500/50`
                          )} />
                          <span className="font-medium">{section.name}: Section {section.section}</span>
                        </div>
                        <span className="text-gray-400">
                          {section.meetingTimes
                            .map(mt => `${mt.day} ${formatTime(mt.startMinute)}`)
                            .join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {combo.valid && (
                  <button
                    onClick={() => onApplySchedule(combo.schedule)}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Apply This Schedule
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Score Breakdown Modal */}
        <Modal
          isOpen={showScoreBreakdown && selectedSchedule !== null}
          onClose={() => {
            setShowScoreBreakdown(false);
            setSelectedSchedule(null);
          }}
        >
          {selectedSchedule !== null && (
            <div className="text-white">
              <h3 className="text-xl font-bold mb-4">Schedule Score Breakdown</h3>
              
              {/* Score Overview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-400">Time Score</div>
                  <div className="text-xl font-bold">{calculateScoreBreakdown(schedules[selectedSchedule].schedule).timeScore}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-400">Campus Score</div>
                  <div className="text-xl font-bold">{calculateScoreBreakdown(schedules[selectedSchedule].schedule).campusScore}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-400">Professor Score</div>
                  <div className="text-xl font-bold">{calculateScoreBreakdown(schedules[selectedSchedule].schedule).professorScore}</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium mb-2">Detailed Breakdown:</h4>
                {calculateScoreBreakdown(schedules[selectedSchedule].schedule).details.map((detail, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                    <span className="text-sm">{detail.explanation}</span>
                    <span className={cn(
                      "font-medium",
                      detail.score < 0 ? "text-red-400" : "text-green-400"
                    )}>
                      {detail.score > 0 ? "+" : ""}{detail.score}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Score:</span>
                  <span className="text-2xl font-bold">{schedules[selectedSchedule].score}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  };

  const renderProfessorsTab = () => (
    <div className="space-y-4">
      {selectedCourses.map(course => {
        if (!course.selectedSection) return null;

        const instructors = course.selectedSection.instructors || 
          (course.selectedSection as any).instructor;
        
        if (!instructors) {
          return (
            <div key={course.name} className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium">{course.name}</h3>
              <p className="text-sm text-gray-400">No instructor information available</p>
            </div>
          );
        }

        // Convert instructors to array of strings
        const instructorNames = Array.isArray(instructors) 
          ? instructors.map(instructor => typeof instructor === 'string' ? instructor : instructor.name)
          : [instructors];

        const ratings = findProfessorRatings(instructorNames);
        const instructorDisplay = Array.isArray(instructors) 
          ? instructorNames.join(", ") 
          : instructorNames[0];
        
        return (
          <div key={course.name} className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium">{course.name}</h3>
            <p className="text-sm text-gray-300 mb-4">{instructorDisplay}</p>
            
            {ratings.length === 0 ? (
              <div className="text-sm text-gray-400">No ratings found for instructors</div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating, index) => (
                  <div key={rating.id} className={cn("bg-gray-600 rounded-lg p-3", index > 0 && "mt-4")}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{rating.firstName} {rating.lastName}</p>
                        <p className="text-sm text-gray-400">{rating.department}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: `hsl(${rating.avgRating * 24}, 70%, 50%)` }}>
                          {rating.avgRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-400">{rating.numRatings} ratings</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-gray-700 p-2 rounded">
                        <div className="text-sm text-gray-300">Difficulty</div>
                        <div className="font-medium">{rating.avgDifficulty.toFixed(1)} / 5.0</div>
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <div className="text-sm text-gray-300">Would Take Again</div>
                        <div className="font-medium">{rating.wouldTakeAgainPercent}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderCommuteTab = () => {
    if (!selectedCourses.some(c => c.selectedSection)) {
      return (
        <div className="text-gray-400 text-center py-8">
          Select course sections to see commute analysis
        </div>
      );
    }

    const schedule = selectedCourses
      .filter(c => c.selectedSection)
      .map(c => c.selectedSection!);
    
    const dailySchedules = calculateDailySchedule(schedule);

    return (
      <>
        {renderCampusLegend()}
        <div className="space-y-6">
          {dailySchedules.map(daySchedule => (
            <div key={daySchedule.day} className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-3">{daySchedule.day}</h3>
              {daySchedule.events.length === 0 ? (
                <p className="text-gray-400 text-sm">No classes scheduled</p>
              ) : (
                <div className="space-y-2">
                  {daySchedule.events.map((event, index) => (
                    <div 
                      key={index} 
                      className={getEventStyle(event)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{event.time}</span>
                          <span className="mx-2">•</span>
                          <span>{event.description}</span>
                        </div>
                        <span className="text-gray-300">{event.duration} mins</span>
                      </div>
                      {event.location && (
                        <div className="text-gray-400 mt-1 text-xs">
                          Location: {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-4 mt-4">
      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-700 p-1 rounded-lg">
        {[
          { id: 'schedules', label: 'Schedules' },
          { id: 'professors', label: 'Professor Ratings' },
          { id: 'commute', label: 'Commute Analysis' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'schedules' && renderSchedulesTab()}
        {activeTab === 'professors' && renderProfessorsTab()}
        {activeTab === 'commute' && renderCommuteTab()}
      </div>
    </div>
  );
} 