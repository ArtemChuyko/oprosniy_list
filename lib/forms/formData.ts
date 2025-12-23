/**
 * Type definitions and utilities for form data
 */

export type FormDataValue = string | number | boolean | string[];
export type FormData = Record<string, FormDataValue>;

/**
 * Checks if a form data value is considered "answered"
 */
export function isValueAnswered(value: FormDataValue): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'boolean') {
    return value === true;
  }
  return true;
}
