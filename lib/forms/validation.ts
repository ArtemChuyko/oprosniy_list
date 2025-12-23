/**
 * Validation utilities and constants
 */

import { z } from 'zod';
import type { Form, Question } from './schema';
import { isConsentQuestion, isSignatureQuestion } from './questionUtils';

// Phone validation regex (basic)
export const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * Builds zod schema for form validation
 * Only includes visible questions to skip validation for hidden ones
 */
export function buildZodSchema(form: Form, visibleQuestionIds: Set<string>): z.ZodObject<any> {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  form.sections.forEach((section) => {
    section.questions.forEach((question) => {
      // Skip validation for hidden questions
      if (!visibleQuestionIds.has(question.id)) {
        schemaObject[question.id] = z.any().optional();
        return;
      }

      schemaObject[question.id] = buildQuestionSchema(question);
    });
  });

  return z.object(schemaObject);
}

/**
 * Builds zod schema for a single question
 */
function buildQuestionSchema(question: Question): z.ZodTypeAny {
  switch (question.type) {
    case 'text':
    case 'textarea':
    case 'email':
      if (isSignatureQuestion(question)) {
        return z.string().min(1, 'Заполните пожалуйста данное поле');
      }
      let stringSchema: z.ZodTypeAny = z.string();
      if (question.type === 'email' && question.validation?.pattern) {
        stringSchema = (stringSchema as z.ZodString).email('Please enter a valid email address');
      }
      if (question.required) {
        stringSchema = (stringSchema as z.ZodString).min(1, 'Заполните пожалуйста данное поле');
      } else {
        stringSchema = (stringSchema as z.ZodString).optional();
      }
      return stringSchema;

    case 'tel':
      if (question.required) {
        return z
          .string()
          .min(1, 'Phone number is required')
          .regex(PHONE_REGEX, 'Please enter a valid phone number');
      }
      return z
        .string()
        .optional()
        .refine(
          (val) => !val || PHONE_REGEX.test(val),
          'Please enter a valid phone number'
        );

    case 'number':
      let numberSchema: z.ZodTypeAny = z.coerce.number();
      if (question.validation?.min !== undefined) {
        numberSchema = (numberSchema as z.ZodNumber).min(
          question.validation.min,
          `Minimum value is ${question.validation.min}`
        );
      }
      if (question.validation?.max !== undefined) {
        numberSchema = (numberSchema as z.ZodNumber).max(
          question.validation.max,
          `Maximum value is ${question.validation.max}`
        );
      }
      if (question.required) {
        numberSchema = (numberSchema as z.ZodNumber).min(0, 'Заполните пожалуйста данное поле');
      } else {
        numberSchema = (numberSchema as z.ZodNumber).optional();
      }
      return numberSchema;

    case 'date':
      if (question.required) {
        return z.string().min(1, `${question.label} is required`);
      }
      return z.string().optional();

    case 'select':
      if (question.required) {
        return z.string().min(1, 'Заполните пожалуйста данное поле');
      }
      return z.string().optional();

    case 'radio':
      if (question.required) {
        return z.string().min(1, `Please select ${question.label.toLowerCase()}`);
      }
      return z.string().optional();

    case 'checkbox':
      if (isConsentQuestion(question)) {
        return z.boolean().refine((val) => val === true, {
          message: 'You must provide consent to continue',
        });
      }
      if (question.options && question.options.length > 0) {
        // Multi-select checkbox
        if (question.required) {
          return z
            .array(z.string())
            .min(1, 'Заполните пожалуйста данное поле');
        }
        return z.array(z.string()).optional();
      }
      // Single checkbox
      if (question.required) {
        return z.boolean().refine((val) => val === true, {
          message: 'Заполните пожалуйста данное поле',
        });
      }
      return z.boolean().optional();

    case 'file':
      // File fields are handled separately, make them optional in validation
      return z.any().optional();

    default:
      return z.string().optional();
  }
}
