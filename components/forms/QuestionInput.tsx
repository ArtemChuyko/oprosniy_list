/**
 * Reusable question input component
 */

import { forwardRef } from 'react';
import type { Question } from '@/lib/forms/schema';
import type { FormDataValue } from '@/lib/forms/formData';
import QuestionLabel from './QuestionLabel';

interface QuestionInputProps {
  question: Question;
  error?: string;
  value?: FormDataValue;
  onHelpClick?: () => void;
  register: (name: string) => any;
  setValue?: (name: string, value: FormDataValue, options?: { shouldValidate?: boolean }) => void;
}

const QuestionInput = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, QuestionInputProps>(
  ({ question, error, value, onHelpClick, register, setValue }, ref) => {
    const hasError = !!error;
    const inputClassName = `w-full px-3 py-2 border rounded text-[#4A4A4A] font-sans placeholder:text-gray-400 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    } focus:outline-none focus:ring-2 focus:ring-blue-500`;

    switch (question.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <input
              ref={ref as any}
              type={question.type}
              {...register(question.id)}
              placeholder={question.placeholder}
              className={inputClassName}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <textarea
              ref={ref as any}
              {...register(question.id)}
              placeholder={question.placeholder}
              rows={4}
              maxLength={question.validation?.max}
              className={inputClassName}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <input
              ref={ref as any}
              type="number"
              {...register(question.id)}
              placeholder={question.placeholder}
              min={question.validation?.min}
              max={question.validation?.max}
              className={inputClassName}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <input
              ref={ref as any}
              type="date"
              {...register(question.id)}
              className={inputClassName}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <select
              ref={ref as any}
              {...register(question.id)}
              className={inputClassName}
            >
              <option value="">Выберите вариант</option>
              {question.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option} className="flex items-center text-[#4A4A4A] font-sans">
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
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'checkbox':
        if (question.options && question.options.length > 0) {
          // Multi-select checkbox
          const checkboxValue = (value as string[]) || [];
          register(question.id);
          return (
            <div className="mb-4">
              <QuestionLabel
                label={question.label}
                required={question.required}
                hasHelp={!!question.help}
                onHelpClick={onHelpClick}
              />
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isChecked = checkboxValue.includes(option);
                  return (
                    <label key={option} className="flex items-center text-[#4A4A4A] font-sans">
                      <input
                        type="checkbox"
                        value={option}
                        checked={isChecked}
                        onChange={(e) => {
                          const current = checkboxValue;
                          if (e.target.checked) {
                            setValue?.(question.id, [...current, option], {
                              shouldValidate: true,
                            });
                          } else {
                            setValue?.(
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
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div className="mb-4">
              <label className="flex items-center text-[#4A4A4A] font-sans">
                <input
                  type="checkbox"
                  {...register(question.id)}
                  className="mr-2"
                />
                <span className="flex items-center">
                  {question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                  {question.help && onHelpClick && (
                    <button
                      type="button"
                      onClick={onHelpClick}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ?
                    </button>
                  )}
                </span>
              </label>
              {error && <p className="mt-1 text-sm text-red-500 font-sans">{error}</p>}
            </div>
          );
        }

      case 'file':
        return (
          <div className="mb-4">
            <QuestionLabel
              label={question.label}
              required={question.required}
              hasHelp={!!question.help}
              onHelpClick={onHelpClick}
            />
            <input
              type="file"
              multiple={question.multiple || false}
              accept={question.accept || 'image/jpeg,image/jpg,image/png,application/pdf,video/mp4'}
              className={inputClassName}
            />
            {question.multiple && (
              <p className="mt-1 text-xs text-gray-500">
                You can select multiple files (max 25MB per file, 100MB total)
              </p>
            )}
            {!question.multiple && (
              <p className="mt-1 text-xs text-gray-500">
                Max file size: 25MB. Allowed types: JPG, PNG, PDF, MP4
              </p>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  }
);

QuestionInput.displayName = 'QuestionInput';

export default QuestionInput;
