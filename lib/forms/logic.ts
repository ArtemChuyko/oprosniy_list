/**
 * Conditional logic engine for form questions
 * Evaluates visibility of questions based on other questions' answers
 */

import type { Form, Logic } from './schema';
import type { FormData } from './formData';

type FormAnswers = FormData;

/**
 * Evaluates a single logic condition
 */
function evaluateCondition(
  condition: Logic['condition'],
  answers: FormAnswers
): boolean {
  const { questionId, operator, value } = condition;
  const answer = answers[questionId];

  // If the source question has no answer, condition is false
  if (answer === undefined || answer === null || answer === '') {
    return false;
  }

  switch (operator) {
    case 'equals':
      return String(answer) === String(value);

    case 'notEquals':
      return String(answer) !== String(value);

    case 'contains':
      // For checkbox arrays, check if value is in the array
      if (Array.isArray(answer)) {
        return answer.includes(String(value));
      }
      // For strings, check if value is contained
      return String(answer).includes(String(value));

    case 'greaterThan':
      const numAnswer = Number(answer);
      const numValue = Number(value);
      return !isNaN(numAnswer) && !isNaN(numValue) && numAnswer > numValue;

    case 'lessThan':
      const numAnswer2 = Number(answer);
      const numValue2 = Number(value);
      return !isNaN(numAnswer2) && !isNaN(numValue2) && numAnswer2 < numValue2;

    default:
      return false;
  }
}

/**
 * Evaluates all logic rules for a question
 * Returns true if the question should be visible
 */
function evaluateQuestionLogic(
  questionId: string,
  logicRules: Logic[],
  answers: FormAnswers
): boolean {
  // If no logic rules, question is always visible
  if (!logicRules || logicRules.length === 0) {
    return true;
  }

  // Evaluate each rule
  // A question is visible if at least one "show" rule is true
  // AND no "hide" rule is true
  let hasShowRule = false;
  let showRuleResult = false;
  let hasHideRule = false;
  let hideRuleResult = false;

  for (const rule of logicRules) {
    const conditionResult = evaluateCondition(rule.condition, answers);

    if (rule.action === 'show') {
      hasShowRule = true;
      showRuleResult = showRuleResult || conditionResult;
    } else if (rule.action === 'hide') {
      hasHideRule = true;
      hideRuleResult = hideRuleResult || conditionResult;
    }
  }

  // If there are show rules, question is visible only if at least one show rule is true
  if (hasShowRule) {
    // If there are also hide rules, hide takes precedence
    if (hasHideRule && hideRuleResult) {
      return false;
    }
    return showRuleResult;
  }

  // If only hide rules exist, question is visible unless a hide rule is true
  if (hasHideRule) {
    return !hideRuleResult;
  }

  // No rules matched, default to visible
  return true;
}

/**
 * Evaluates visibility for all questions and sections in a form based on current answers
 * Returns a map of questionId/sectionId -> isVisible
 */
export function evaluateVisibility(
  form: Form,
  answers: FormAnswers
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  // First pass: evaluate all sections
  form.sections.forEach((section) => {
    let sectionVisible = true;
    if (section.logic && section.logic.length > 0) {
      sectionVisible = evaluateQuestionLogic(
        section.id,
        section.logic,
        answers
      );
    }
    visibility[section.id] = sectionVisible;

    // Evaluate questions within the section
    // Questions are visible only if both section is visible AND question logic allows
    section.questions.forEach((question) => {
      if (!sectionVisible) {
        // Section is hidden, so all questions in it are hidden
        visibility[question.id] = false;
        return;
      }

      if (question.logic && question.logic.length > 0) {
        visibility[question.id] = evaluateQuestionLogic(
          question.id,
          question.logic,
          answers
        );
      } else {
        // No logic rules, question is visible (since section is visible)
        visibility[question.id] = true;
      }
    });
  });

  return visibility;
}

/**
 * Gets all question IDs that should be visible
 */
export function getVisibleQuestionIds(
  form: Form,
  answers: FormAnswers
): Set<string> {
  const visibility = evaluateVisibility(form, answers);
  const visibleIds = new Set<string>();

  Object.entries(visibility).forEach(([questionId, isVisible]) => {
    if (isVisible) {
      visibleIds.add(questionId);
    }
  });

  return visibleIds;
}
