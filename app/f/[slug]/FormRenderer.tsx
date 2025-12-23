'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Form, Question } from '@/lib/forms/schema';
import type { FormData } from '@/lib/forms/formData';
import { evaluateVisibility } from '@/lib/forms/logic';
import { getQuestionDefaultValue } from '@/lib/forms/questionUtils';
import { isValueAnswered } from '@/lib/forms/formData';
import { buildZodSchema } from '@/lib/forms/validation';
import ProgressBar from '@/components/ui/ProgressBar';
import ErrorMessage from '@/components/ui/ErrorMessage';
import QuestionInput from '@/components/forms/QuestionInput';
import QuestionLabel from '@/components/forms/QuestionLabel';
import HelpModal from './HelpModal';
import HelpSidebar from './HelpSidebar';

interface FormRendererProps {
  form: Form;
}

/**
 * Calculates form completion progress percentage
 */
function calculateProgress(form: Form, formData: FormData): number {
  const totalQuestions = form.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  if (totalQuestions === 0) return 100;

  const answeredQuestions = form.sections.reduce((sum, section) => {
    return (
      sum +
      section.questions.filter((q) => isValueAnswered(formData[q.id])).length
    );
  }, 0);

  return Math.round((answeredQuestions / totalQuestions) * 100);
}

export default function FormRenderer({ form }: FormRendererProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Build default values from form structure
  const defaultValues = useMemo(() => {
    const defaults: FormData = {};
    form.sections.forEach((section) => {
      section.questions.forEach((question) => {
        defaults[question.id] = getQuestionDefaultValue(question);
      });
    });
    return defaults;
  }, [form]);

  // Initial visibility (all visible by default)
  const initialVisibility = useMemo(() => {
    const vis: Record<string, boolean> = {};
    form.sections.forEach((section) => {
      section.questions.forEach((question) => {
        vis[question.id] = true;
      });
    });
    return vis;
  }, [form]);

  // Build initial zod schema with all questions visible
  const initialZodSchema = useMemo(
    () => buildZodSchema(form, new Set(Object.keys(initialVisibility))),
    [form, initialVisibility]
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(initialZodSchema) as any,
    defaultValues,
  });

  const formData = watch();

  // Calculate visibility based on current form data
  const visibility = useMemo(
    () => evaluateVisibility(form, formData),
    [form, formData]
  );

  // Get section visibility
  const isSectionVisible = (sectionId: string): boolean => {
    return visibility[sectionId] === true;
  };

  const visibleQuestionIds = useMemo(() => {
    return new Set(
      Object.entries(visibility)
        .filter(([id, isVisible]) => {
          // Only include question IDs (not section IDs) that are visible
          const isQuestion = form.sections.some((s) =>
            s.questions.some((q) => q.id === id)
          );
          return isQuestion && isVisible;
        })
        .map(([questionId]) => questionId)
    );
  }, [visibility, form]);

  // Clear values when questions become hidden
  const prevVisibility = useRef<Record<string, boolean>>({});
  useEffect(() => {
    Object.entries(visibility).forEach(([questionId, isVisible]) => {
      const wasVisible = prevVisibility.current[questionId] ?? true;
      if (wasVisible && !isVisible) {
        // Question became hidden, clear its value
        const question = form.sections
          .flatMap((s) => s.questions)
          .find((q) => q.id === questionId);
        if (question) {
          if (question.type === 'checkbox' && question.options && question.options.length > 0) {
            setValue(questionId, []);
          } else if (question.type === 'checkbox') {
            setValue(questionId, false);
          } else if (question.type === 'number') {
            setValue(questionId, 0);
          } else {
            setValue(questionId, '');
          }
        }
      }
    });
    prevVisibility.current = visibility;
  }, [visibility, form, setValue]);

  const progress = useMemo(
    () => calculateProgress(form, formData),
    [form, formData]
  );

  // Help state
  const [helpState, setHelpState] = useState<{
    question: Question | null;
    isOpen: boolean;
  }>({ question: null, isOpen: false });

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
      // Build validation schema for visible questions only
      const validationSchema = buildZodSchema(form, visibleQuestionIds);
      const visibleData: FormData = {};
      visibleQuestionIds.forEach((questionId) => {
        if (data[questionId] !== undefined) {
          visibleData[questionId] = data[questionId];
        }
      });

      // Validate only visible questions (excluding file fields)
      const validationData: FormData = {};
      Object.keys(visibleData).forEach((key) => {
        const question = form.sections
          .flatMap((s) => s.questions)
          .find((q) => q.id === key);
        if (question?.type !== 'file') {
          validationData[key] = visibleData[key];
        }
      });

      const validationResult = validationSchema.safeParse(validationData);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new Error(firstError?.message || 'Please fix validation errors');
      }

      // Prepare FormData for multipart/form-data
      const formData = new FormData();
      
      // Add JSON answers
      formData.append('answers', JSON.stringify(visibleData));

      // Add files from file inputs
      Object.entries(fileInputsRef.current).forEach(([questionId, input]) => {
        if (input && input.files && input.files.length > 0) {
          const question = form.sections
            .flatMap((s) => s.questions)
            .find((q) => q.id === questionId);
          
          if (question && visibility[questionId]) {
            const files = Array.from(input.files);
            files.forEach((file) => {
              formData.append(`file_${questionId}`, file);
            });
          }
        }
      });

      const response = await fetch(`/api/submit/${form.slug}`, {
        method: 'POST',
        body: formData, // FormData automatically sets Content-Type with boundary
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

  const handleHelpClick = (question: Question) => {
    setHelpState({ question, isOpen: true });
  };

  const closeHelp = () => {
    setHelpState({ question: null, isOpen: false });
  };

  const renderQuestion = (question: Question) => {
    // Skip rendering if question is hidden
    if (!visibility[question.id]) {
      return null;
    }

    const error = errors[question.id];
    const value = formData[question.id];
    
    // Special handling for file inputs (need ref for submission)
    if (question.type === 'file') {
      return (
        <div key={question.id} className="mb-4">
          <QuestionLabel
            label={question.label}
            required={question.required}
            hasHelp={!!question.help}
            onHelpClick={() => handleHelpClick(question)}
          />
          <input
            type="file"
            ref={(el) => {
              fileInputsRef.current[question.id] = el;
            }}
            multiple={question.multiple || false}
            accept={question.accept || 'image/jpeg,image/jpg,image/png,application/pdf,video/mp4'}
            className={`w-full px-3 py-2 border rounded ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {question.multiple && (
            <p className="mt-1 text-xs text-[#4A4A4A] font-sans">
              You can select multiple files (max 25MB per file, 100MB total)
            </p>
          )}
          {!question.multiple && (
            <p className="mt-1 text-xs text-[#4A4A4A] font-sans">
              Max file size: 25MB. Allowed types: JPG, PNG, PDF, MP4
            </p>
          )}
          {error && <p className="mt-1 text-sm text-red-500">{error.message as string}</p>}
        </div>
      );
    }

    return (
      <QuestionInput
        key={question.id}
        question={question}
        error={error?.message as string}
        value={value}
        onHelpClick={() => handleHelpClick(question)}
        register={register}
        setValue={setValue}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ProgressBar progress={progress} />

      {/* Form sections */}
      {form.sections
        .filter((section) => isSectionVisible(section.id))
        .map((section) => {
          // Градиенты для разделов (начинаются легким цветным, плавный переход к белому, заканчиваются легким цветным)
          const gradientStyles: Record<string, string> = {
            'white-blue': 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 20%, #ffffff 80%, #e0f2fe 100%)',
            'white-lightblue': 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 20%, #ffffff 80%, #f0f9ff 100%)',
            'white-gray': 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 20%, #ffffff 80%, #f3f4f6 100%)',
            'white-purple': 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 20%, #ffffff 80%, #f3e8ff 100%)',
            'white-orange': 'linear-gradient(135deg, #fed7aa 0%, #ffffff 20%, #ffffff 80%, #fed7aa 100%)',
            'white-green': 'linear-gradient(135deg, #d1fae5 0%, #ffffff 20%, #ffffff 80%, #d1fae5 100%)',
          };
          const gradient = section.gradient || 'white-blue';
          const backgroundStyle = gradientStyles[gradient] || gradientStyles['white-blue'];

          return (
            <div
              key={section.id}
              className="rounded-lg p-6 mb-6 shadow-sm"
              style={{ background: backgroundStyle }}
            >
              <h2 className="text-xl font-semibold mb-2 text-[#4A4A4A] font-sans">{section.title}</h2>
              {section.description && (
                <p className="text-[#4A4A4A] font-sans mb-4">{section.description}</p>
              )}
              <div className="space-y-4">
                {section.questions.map(renderQuestion)}
              </div>
            </div>
          );
        })}

      {submitError && <ErrorMessage message={submitError} />}

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

      {/* Help Modal/Sidebar */}
      {helpState.question && helpState.question.help && (
        <>
          {helpState.question.help.mode === 'sidebar' ? (
            <HelpSidebar
              help={helpState.question.help}
              isOpen={helpState.isOpen}
              onClose={closeHelp}
              questionLabel={helpState.question.label}
            />
          ) : (
            <HelpModal
              help={helpState.question.help}
              isOpen={helpState.isOpen}
              onClose={closeHelp}
              questionLabel={helpState.question.label}
            />
          )}
        </>
      )}
    </form>
  );
}
