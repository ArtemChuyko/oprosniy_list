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

export type HelpMode = 'modal' | 'sidebar' | 'tooltip';

export type HelpBlockType = 'text' | 'image' | 'gallery' | 'lottie' | 'video';

export interface HelpBlock {
  type: HelpBlockType;
  content: string; // URL for image/gallery/lottie/video, text for text block
  caption?: string; // For image/gallery
  alt?: string; // For image/gallery
}

export interface Help {
  text?: string; // Legacy support
  link?: string; // Legacy support
  mode?: HelpMode; // Default: 'modal'
  blocks?: HelpBlock[]; // New structured content
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
  // File upload specific
  multiple?: boolean; // For file type, allow multiple files (default: false)
  accept?: string; // File types to accept (e.g., "image/*,.pdf")
}

export type SectionGradient = 
  | 'white-blue'      // Белый → светло-синий
  | 'white-lightblue' // Белый → очень светло-синий
  | 'white-gray'      // Белый → светло-серый
  | 'white-purple'    // Белый → светло-фиолетовый
  | 'white-orange'    // Белый → светло-оранжевый
  | 'white-green';    // Белый → светло-зеленый

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  gradient?: SectionGradient; // Градиент фона раздела
  logic?: Logic[]; // Условная логика для показа/скрытия раздела
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
