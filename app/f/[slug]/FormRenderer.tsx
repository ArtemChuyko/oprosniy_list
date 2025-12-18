'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Form, Question } from '@/lib/forms/schema';

interface FormRendererProps {
  form: Form;
}

type FormData = Record<string, string | number | boolean | string[]>;

// Phone validation regex (basic)
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

// Helper to check if question is consent checkbox
function isConsentQuestion(question: Question): boolean {
  const label = question.label.toLowerCase();
  return (
    question.type === 'checkbox' &&
    (label.includes('consent') ||
      label.includes('agree') ||
      label.includes('accept') ||
      label.includes('terms'))
  );
}

// Helper to check if question is signature
function isSignatureQuestion(question: Question): boolean {
  const label = question.label.toLowerCase();
  return (
    question.type === 'text' &&
    (label.includes('signature') || label.includes('sign'))
  );
}

// Build zod schema from form structure
function buildZodSchema(form: Form) {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  form.sections.forEach((section) => {
    section.questions.forEach((question) => {
      let fieldSchema: z.ZodTypeAny;

      switch (question.type) {
        case 'text':
        case 'textarea':
        case 'email':
          if (isSignatureQuestion(question)) {
            fieldSchema = z.string().min(1, 'Signature is required');
          } else {
            let stringSchema: z.ZodTypeAny = z.string();
            if (question.type === 'email' && question.validation?.pattern) {
              stringSchema = (stringSchema as z.ZodString).email('Please enter a valid email address');
            }
            if (question.required) {
              stringSchema = (stringSchema as z.ZodString).min(1, `${question.label} is required`);
            } else {
              stringSchema = (stringSchema as z.ZodString).optional();
            }
            fieldSchema = stringSchema;
          }
          break;

        case 'tel':
          if (question.required) {
            fieldSchema = z
              .string()
              .min(1, 'Phone number is required')
              .regex(phoneRegex, 'Please enter a valid phone number');
          } else {
            fieldSchema = z
              .string()
              .optional()
              .refine(
                (val) => !val || phoneRegex.test(val),
                'Please enter a valid phone number'
              );
          }
          break;

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
            numberSchema = (numberSchema as z.ZodNumber).min(0, `${question.label} is required`);
          } else {
            numberSchema = (numberSchema as z.ZodNumber).optional();
          }
          fieldSchema = numberSchema;
          break;

        case 'date':
          if (question.required) {
            fieldSchema = z.string().min(1, `${question.label} is required`);
          } else {
            fieldSchema = z.string().optional();
          }
          break;

        case 'select':
          if (question.required) {
            fieldSchema = z.string().min(1, `Please select ${question.label.toLowerCase()}`);
          } else {
            fieldSchema = z.string().optional();
          }
          break;

        case 'radio':
          if (question.required) {
            fieldSchema = z.string().min(1, `Please select ${question.label.toLowerCase()}`);
          } else {
            fieldSchema = z.string().optional();
          }
          break;

        case 'checkbox':
          if (isConsentQuestion(question)) {
            fieldSchema = z.boolean().refine((val) => val === true, {
              message: 'You must provide consent to continue',
            });
          } else if (question.options && question.options.length > 0) {
            // Multi-select checkbox
            if (question.required) {
              fieldSchema = z
                .array(z.string())
                .min(1, `Please select at least one option for ${question.label}`);
            } else {
              fieldSchema = z.array(z.string()).optional();
            }
          } else {
            // Single checkbox
            if (question.required) {
              fieldSchema = z.boolean().refine((val) => val === true, {
                message: `${question.label} is required`,
              });
            } else {
              fieldSchema = z.boolean().optional();
            }
          }
          break;

        default:
          fieldSchema = z.string().optional();
      }

      schemaObject[question.id] = fieldSchema;
    });
  });

  return z.object(schemaObject);
}

// Calculate form progress
function calculateProgress(form: Form, formData: FormData): number {
  const totalQuestions = form.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  if (totalQuestions === 0) return 100;

  const answeredQuestions = form.sections.reduce((sum, section) => {
    return (
      sum +
      section.questions.filter((q) => {
        const value = formData[q.id];
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'boolean') return value === true;
        return true;
      }).length
    );
  }, 0);

  return Math.round((answeredQuestions / totalQuestions) * 100);
}

export default function FormRenderer({ form }: FormRendererProps) {
  const zodSchema = useMemo(() => buildZodSchema(form), [form]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Build default values from form structure
  const defaultValues = useMemo(() => {
    const defaults: FormData = {};
    form.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.type === 'checkbox' && question.options && question.options.length > 0) {
          defaults[question.id] = [];
        } else if (question.type === 'checkbox') {
          defaults[question.id] = false;
        } else if (question.type === 'number') {
          defaults[question.id] = 0;
        } else {
          defaults[question.id] = '';
        }
      });
    });
    return defaults;
  }, [form]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(zodSchema) as any,
    defaultValues,
  });

  const formData = watch();
  const progress = useMemo(
    () => calculateProgress(form, formData),
    [form, formData]
  );

  // Autosave to localStorage
  const storageKey = `form-draft-${form.slug}`;

  useEffect(() => {
    // Load draft from localStorage
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Object.keys(draft).forEach((key) => {
          setValue(key as keyof FormData, draft[key]);
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [storageKey, setValue]);

  useEffect(() => {
    // Save draft to localStorage
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/submit/${form.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      // Clear draft on successful submission
      localStorage.removeItem(storageKey);

      // Redirect to done page
      window.location.href = `/f/${form.slug}/done`;
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred while submitting'
      );
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const error = errors[question.id];
    const value = formData[question.id];

    switch (question.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={question.type}
              {...register(question.id)}
              placeholder={question.placeholder}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              {...register(question.id)}
              placeholder={question.placeholder}
              rows={4}
              maxLength={question.validation?.max}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              {...register(question.id)}
              placeholder={question.placeholder}
              min={question.validation?.min}
              max={question.validation?.max}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              {...register(question.id)}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              {...register(question.id)}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Select an option</option>
              {question.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={question.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    value={option}
                    {...register(question.id)}
                    className="mr-2"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-500">
                {error.message as string}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        if (question.options && question.options.length > 0) {
          // Multi-select checkbox
          const checkboxValue = (value as string[]) || [];
          // Register the field
          register(question.id);
          return (
            <div key={question.id} className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isChecked = checkboxValue.includes(option);
                  return (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        value={option}
                        checked={isChecked}
                        onChange={(e) => {
                          const current = (value as string[]) || [];
                          if (e.target.checked) {
                            setValue(question.id, [...current, option], {
                              shouldValidate: true,
                            });
                          } else {
                            setValue(
                              question.id,
                              current.filter((v) => v !== option),
                              { shouldValidate: true }
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-500">
                  {error.message as string}
                </p>
              )}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div key={question.id} className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register(question.id)}
                  className="mr-2"
                />
                <span>
                  {question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </label>
              {error && (
                <p className="mt-1 text-sm text-red-500">
                  {error.message as string}
                </p>
              )}
            </div>
          );
        }

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form sections */}
      {form.sections.map((section) => (
        <div key={section.id} className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
          {section.description && (
            <p className="text-gray-600 mb-4">{section.description}</p>
          )}
          <div className="space-y-4">
            {section.questions.map(renderQuestion)}
          </div>
        </div>
      ))}

      {/* Submit error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {submitError}
        </div>
      )}

      {/* Submit button */}
      <div className="mt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </button>
      </div>
    </form>
  );
}
