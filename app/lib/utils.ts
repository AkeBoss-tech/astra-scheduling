// app/lib/utils.ts
"use client"

// Utility function to combine multiple class names.
// It takes any number of strings, booleans, or undefined values and returns a single string with all valid class names.
export function cn(...classes: (string | boolean | undefined)[]) {
  // Filter removes any falsey values and join creates one space-separated string.
  return classes.filter(Boolean).join(" ")
}

