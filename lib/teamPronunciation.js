/**
 * Team number pronunciation utilities for TTS
 * Uses /data/team_pronunciations.json for custom pronunciations
 * Applies NATO phonetic alphabet to letter suffixes
 */

import teamPronunciations from '../data/team_pronunciations.json';

// NATO Phonetic Alphabet mapping for letter suffixes
const NATO_ALPHABET = {
  A: 'Alpha',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliet',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'X-ray',
  Y: 'Yankee',
  Z: 'Zulu',
};

/**
 * Parse team identifier using JSON pronunciation mappings
 * ALWAYS applies NATO alphabet to letter suffixes
 *
 * How it works:
 * 1. Extracts number from team ID (e.g., "10012A" → "10012")
 * 2. Looks up number in /data/team_pronunciations.json
 * 3. If found, uses custom pronunciation + NATO alphabet for letters
 * 4. If not found, uses number as-is + NATO alphabet for letters
 *
 * Examples (with JSON: {"10012": "one hundred twelve"}):
 *   "10012A" → "one hundred twelve Alpha"
 *   "10012B" → "one hundred twelve Bravo"
 *   "1234X"  → "1234 X-ray" (no mapping, but NATO applied)
 *   "5555B"  → "5555 Bravo" (no mapping, but NATO applied)
 *
 * @param {string|number} teamId - The team identifier (e.g., "10012A")
 * @returns {string} - The pronunciation to use
 */
export function parseTeamIdentifier(teamId) {
  if (!teamId) return '';

  const teamStr = teamId.toString().trim().toUpperCase();

  // Match pattern: digits followed by optional letters
  const match = teamStr.match(/^(\d+)([A-Z]*)$/);

  if (!match) {
    // Not a standard team format - return as-is
    return teamStr;
  }

  const [, numberPart, letterPart] = match;

  // Look up number in pronunciations JSON
  const customPronunciation = teamPronunciations[numberPart];

  // Start with custom pronunciation or the number itself
  let spoken = customPronunciation || numberPart;

  // ALWAYS add NATO alphabet for letter suffixes
  if (letterPart) {
    const letterSpoken = letterPart
      .split('')
      .map(letter => NATO_ALPHABET[letter] || letter)
      .join(' ');
    spoken += ` ${letterSpoken}`;
  }

  return spoken;
}

/**
 * Get NATO phonetic for a letter (helper function)
 * @param {string} letter - Single letter
 * @returns {string} - NATO phonetic word
 *
 * Example: getNATOPhonetic('A') → 'Alpha'
 */
export function getNATOPhonetic(letter) {
  return NATO_ALPHABET[letter.toUpperCase()] || letter;
}
