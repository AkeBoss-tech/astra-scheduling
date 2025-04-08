export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);

export const CAMPUSES = {
  'Busch': {
    gradient: 'from-orange-500 to-orange-700',
    label: 'Busch Campus',
    color: 'orange'
  },
  'Livingston': {
    gradient: 'from-green-500 to-green-700',
    label: 'Livingston Campus',
    color: 'green'
  },
  'College Avenue': {
    gradient: 'from-blue-500 to-blue-700',
    label: 'College Avenue Campus',
    color: 'blue'
  },
  'C/D': {
    gradient: 'from-red-500 to-red-700',
    label: 'Cook/Douglass Campus',
    color: 'red'
  }
} as const;

// Colors for unique class gradients
export const CLASS_COLORS = [
  'purple',
  'pink',
  'indigo',
  'cyan',
  'teal',
  'emerald',
  'yellow',
  'amber',
  'lime',
  'rose'
] as const;
