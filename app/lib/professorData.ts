"use client";
import teachersData from '@/data/teachers_data.json';

export interface ProfessorRating {
  id: string;
  firstName: string;
  lastName: string;
  avgDifficulty: number;
  avgRating: number;
  department: string;
  numRatings: number;
  wouldTakeAgainPercent: number;
}

/**
 * Find ratings for a single professor
 */
export function findProfessorRating(firstName: string | null, lastName: string): ProfessorRating | null {
  try {
    console.log('Finding professor rating for:', firstName, lastName);

    let record;

    if (firstName) {
      // Try to find by full name match
      record = teachersData.find(prof => 
        prof.firstName.toLowerCase().includes(firstName.toLowerCase()) &&
        prof.lastName.toLowerCase().includes(lastName.toLowerCase())
      );
    }

    // If no match found or no first name provided, try searching by last name only
    if (!record) {
      record = teachersData.find(prof => 
        prof.lastName.toLowerCase().includes(lastName.toLowerCase())
      );
    }

    if (record) {
      return {
        id: record.id,
        firstName: record.firstName,
        lastName: record.lastName,
        avgDifficulty: record.avgDifficulty,
        avgRating: record.avgRating,
        department: record.department,
        numRatings: record.numRatings,
        wouldTakeAgainPercent: record.wouldTakeAgainPercent,
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding professor:', error);
    return null;
  }
}

/**
 * Parse instructor name into first and last name
 */
function parseInstructorName(name: string): { firstName: string | null; lastName: string } {
  const trimmedName = name.trim();
  
  // Check if name contains a comma (Last, First format)
  if (trimmedName.includes(',')) {
    const [last, first] = trimmedName.split(',').map(part => part.trim());
    return { firstName: first || null, lastName: last };
  }
  
  // Check if name contains a space (First Last format)
  const parts = trimmedName.split(' ').filter(part => part.length > 0);
  if (parts.length > 1) {
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return { firstName, lastName };
  }
  
  // Only one name provided, assume it's the last name
  return { firstName: null, lastName: trimmedName };
}

/**
 * Find ratings for multiple professors from an array of instructor names or a single instructor string
 */
export function findProfessorRatings(instructors: string[] | string | undefined | null): ProfessorRating[] {
  try {
    if (!instructors) {
      console.log('No instructors provided');
      return [];
    }

    console.log('Finding ratings for instructors:', instructors);

    // Convert string input to array
    const instructorArray = Array.isArray(instructors) 
      ? instructors 
      : typeof instructors === 'string'
        ? instructors.split(';').map(name => name.trim()).filter(name => name.length > 0)
        : [];

    console.log('Processing instructors:', instructorArray);
    const ratings: ProfessorRating[] = [];

    // Find ratings for each instructor
    for (const instructorName of instructorArray) {
      if (!instructorName) {
        console.log('Skipping empty instructor name');
        continue;
      }

      const { firstName, lastName } = parseInstructorName(instructorName);
      console.log('Parsed name:', { firstName, lastName });

      const rating = findProfessorRating(firstName, lastName);
      if (rating) {
        ratings.push(rating);
      } else {
        console.log('No rating found for:', instructorName);
      }
    }

    return ratings;
  } catch (error) {
    console.error('Error finding professor ratings:', error);
    return [];
  }
} 