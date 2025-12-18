/**
 * TypeScript data models for Form/Section/Question/Help/Logic
 */

export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface Help {
  text: string;
  link?: string;
}

export interface Logic {
  condition: {
    questionId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number | boolean;
  };
  action: 'show' | 'hide' | 'require' | 'optional';
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required?: boolean;
  help?: Help;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  logic?: Logic[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FormSubmission {
  formId: string;
  formSlug: string;
  answers: Record<string, string | number | boolean | string[]>;
  submittedAt: string;
}
