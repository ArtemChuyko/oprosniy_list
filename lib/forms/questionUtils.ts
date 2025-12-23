/**
 * Utility functions for question type checking and validation
 */

import type { Question } from './schema';

/**
 * Checks if a question is a consent checkbox
 */
export function isConsentQuestion(question: Question): boolean {
  const label = question.label.toLowerCase();
  return (
    question.type === 'checkbox' &&
    (label.includes('consent') ||
      label.includes('agree') ||
      label.includes('accept') ||
      label.includes('terms'))
  );
}

/**
 * Checks if a question is a signature field
 */
export function isSignatureQuestion(question: Question): boolean {
  const label = question.label.toLowerCase();
  return (
    question.type === 'text' &&
    (label.includes('signature') || label.includes('sign'))
  );
}

/**
 * Gets default value for a question type
 */
export function getQuestionDefaultValue(question: Question): string | number | boolean | string[] {
  if (question.type === 'checkbox' && question.options && question.options.length > 0) {
    return [];
  }
  if (question.type === 'checkbox') {
    return false;
  }
  if (question.type === 'number') {
    return 0;
  }
  return '';
}

/**
 * Checks if question type supports options
 */
export function supportsOptions(questionType: Question['type']): boolean {
  return ['select', 'radio', 'checkbox'].includes(questionType);
}

/**
 * Checks if question type supports placeholder
 */
export function supportsPlaceholder(questionType: Question['type']): boolean {
  return ['text', 'textarea', 'email', 'tel', 'number'].includes(questionType);
}
