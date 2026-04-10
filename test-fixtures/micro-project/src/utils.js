/**
 * Utility functions for the greeting CLI.
 */

/**
 * Format a greeting message.
 * @param {string} name - The name to greet
 * @returns {string} Formatted greeting
 */
function formatGreeting(name) {
  const time = new Date().getHours();
  const period = time < 12 ? 'morning' : time < 18 ? 'afternoon' : 'evening';
  return `Good ${period}, ${name}!`;
}

/**
 * Validate a name string.
 * @param {string} name - Name to validate
 * @returns {boolean} Whether the name is valid
 */
function validateName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 100;
}

module.exports = { formatGreeting, validateName };
