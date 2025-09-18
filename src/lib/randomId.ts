import { generate } from 'random-words';

/**
 * Generates a unique ID using 3 random words separated by dashes
 * @returns A string like "bright-ocean-mountain"
 */
export function generateRandomId(): string {
  const words = generate({ exactly: 3, join: '-' });
  return words as string;
}

/**
 * Checks if a string looks like a random ID (3 words separated by dashes)
 * @param id The string to check
 * @returns True if it looks like a random ID
 */
export function isRandomId(id: string): boolean {
  const parts = id.split('-');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
