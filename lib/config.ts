export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
] as const;

export const LEVELS = [
  "Middle school (ages 11–14)",
  "High school (ages 14–18)",
  "Undergraduate",
] as const;

export const EXAMPLE_TOPICS: Record<string, string[]> = {
  Mathematics: ["Quadratic equations", "Derivatives", "Probability", "Trigonometry"],
  Physics: ["Kinematics", "Newton's laws", "Circuits", "Momentum"],
  Chemistry: ["Stoichiometry", "Acids and bases", "Moles", "Chemical bonding"],
  "Computer Science": ["Recursion", "Big-O complexity", "Pointers", "Sorting algorithms"],
};

export const SAMPLE_PROBLEMS = [
  "A ball is dropped from a height of 20 m. How long does it take to hit the ground?",
  "Solve x² − 5x + 6 = 0",
  "Why is O(n log n) considered better than O(n²) for sorting a million items?",
];
