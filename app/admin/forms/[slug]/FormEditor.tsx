'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Form, Section, Question, Help, Logic, QuestionType, HelpMode, HelpBlockType } from '@/lib/forms/schema';

// Simple UUID generator for client-side
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface FormEditorProps {
  form: Form | null;
  token: string;
}

const QUESTION_TYPES: QuestionType[] = [
  'text',
  'textarea',
  'email',
  'tel',
  'number',
  'date',
  'select',
  'radio',
  'checkbox',
  'file',
];

const HELP_MODES: HelpMode[] = ['modal', 'sidebar', 'tooltip'];
const HELP_BLOCK_TYPES: HelpBlockType[] = ['text', 'image', 'gallery', 'lottie', 'video'];
const LOGIC_OPERATORS = ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'];
const LOGIC_ACTIONS = ['show', 'hide'];

export default function FormEditor({ form: initialForm, token }: FormEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(
    initialForm || {
      id: randomUUID(),
      slug: '',
      title: '',
      description: '',
      sections: [],
      createdAt: new Date().toISOString(),
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateForm = (updates: Partial<Form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const addSection = () => {
    const newSection: Section = {
      id: randomUUID(),
      title: 'New Section',
      description: '',
      questions: [],
    };
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const deleteSection = (sectionId: string) => {
    if (confirm('Delete this section and all its questions?')) {
      setForm((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
    }
  };

  const addQuestion = (sectionId: string) => {
    const newQuestion: Question = {
      id: randomUUID(),
      type: 'text',
      label: 'New Question',
      required: false,
    };
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: [...s.questions, newQuestion] }
          : s
      ),
    }));
  };

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    updates: Partial<Question>
  ) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : s
      ),
    }));
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    if (confirm('Delete this question?')) {
      setForm((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
            : s
        ),
      }));
    }
  };

  const addHelpBlock = (sectionId: string, questionId: string) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question) return;

    const newBlock = {
      type: 'text' as HelpBlockType,
      content: '',
    };

    const updatedHelp: Help = {
      ...question.help,
      mode: question.help?.mode || 'modal',
      blocks: [...(question.help?.blocks || []), newBlock],
    };

    updateQuestion(sectionId, questionId, { help: updatedHelp });
  };

  const updateHelpBlock = (
    sectionId: string,
    questionId: string,
    blockIndex: number,
    updates: Partial<{ type: HelpBlockType; content: string; caption?: string; alt?: string }>
  ) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question?.help?.blocks) return;

    const updatedBlocks = [...question.help.blocks];
    updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex], ...updates };

    updateQuestion(sectionId, questionId, {
      help: { ...question.help, blocks: updatedBlocks },
    });
  };

  const deleteHelpBlock = (sectionId: string, questionId: string, blockIndex: number) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question?.help?.blocks) return;

    const updatedBlocks = question.help.blocks.filter((_, i) => i !== blockIndex);
    updateQuestion(sectionId, questionId, {
      help: updatedBlocks.length > 0
        ? { ...question.help, blocks: updatedBlocks }
        : undefined,
    });
  };

  const addLogic = (sectionId: string, questionId: string) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question) return;

    const newLogic: Logic = {
      condition: {
        questionId: '',
        operator: 'equals',
        value: '',
      },
      action: 'show',
    };

    updateQuestion(sectionId, questionId, {
      logic: [...(question.logic || []), newLogic],
    });
  };

  const updateLogic = (
    sectionId: string,
    questionId: string,
    logicIndex: number,
    updates: Partial<Logic>
  ) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question?.logic) return;

    const updatedLogic = [...question.logic];
    updatedLogic[logicIndex] = {
      ...updatedLogic[logicIndex],
      ...updates,
      condition: {
        ...updatedLogic[logicIndex].condition,
        ...(updates.condition || {}),
      },
    };

    updateQuestion(sectionId, questionId, { logic: updatedLogic });
  };

  const deleteLogic = (sectionId: string, questionId: string, logicIndex: number) => {
    const question = form.sections
      .find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);

    if (!question?.logic) return;

    const updatedLogic = question.logic.filter((_, i) => i !== logicIndex);
    updateQuestion(sectionId, questionId, {
      logic: updatedLogic.length > 0 ? updatedLogic : undefined,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate
      if (!form.slug || !form.title) {
        throw new Error('Form slug and title are required');
      }

      const updatedForm: Form = {
        ...form,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/admin/forms/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Admin-Token': token } : {}),
        },
        body: JSON.stringify(updatedForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save form');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin${token ? `?token=${token}` : ''}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Get all question IDs for logic editor
  const getAllQuestionIds = (): Array<{ id: string; label: string }> => {
    return form.sections.flatMap((section) =>
      section.questions.map((q) => ({ id: q.id, label: q.label }))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Form Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Enter form title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Form Slug * (URL-friendly)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateForm({ slug: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="e.g., contact-form"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={form.description || ''}
            onChange={(e) => updateForm({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
            placeholder="Enter form description"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sections</h2>
          <button
            onClick={addSection}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Add Section
          </button>
        </div>

        <div className="space-y-6">
          {form.sections.map((section, sectionIndex) => (
            <div key={section.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateSection(section.id, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded font-semibold"
                    placeholder="Section Title"
                  />
                  <textarea
                    value={section.description || ''}
                    onChange={(e) =>
                      updateSection(section.id, { description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows={2}
                    placeholder="Section description (optional)"
                  />
                </div>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>

              {/* Questions */}
              <div className="ml-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Questions</h3>
                  <button
                    onClick={() => addQuestion(section.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Question
                  </button>
                </div>

                {section.questions.map((question) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    sectionId={section.id}
                    allQuestions={getAllQuestionIds()}
                    onUpdate={(updates) =>
                      updateQuestion(section.id, question.id, updates)
                    }
                    onDelete={() => deleteQuestion(section.id, question.id)}
                    onAddHelpBlock={() => addHelpBlock(section.id, question.id)}
                    onUpdateHelpBlock={(blockIndex, updates) =>
                      updateHelpBlock(section.id, question.id, blockIndex, updates)
                    }
                    onDeleteHelpBlock={(blockIndex) =>
                      deleteHelpBlock(section.id, question.id, blockIndex)
                    }
                    onAddLogic={() => addLogic(section.id, question.id)}
                    onUpdateLogic={(logicIndex, updates) =>
                      updateLogic(section.id, question.id, logicIndex, updates)
                    }
                    onDeleteLogic={(logicIndex) =>
                      deleteLogic(section.id, question.id, logicIndex)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4 pt-6 border-t mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : 'Save Form'}
        </button>
        {error && <p className="text-red-600 text-sm py-2">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm py-2">Form saved successfully!</p>
        )}
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  sectionId: string;
  allQuestions: Array<{ id: string; label: string }>;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onAddHelpBlock: () => void;
  onUpdateHelpBlock: (blockIndex: number, updates: any) => void;
  onDeleteHelpBlock: (blockIndex: number) => void;
  onAddLogic: () => void;
  onUpdateLogic: (logicIndex: number, updates: Partial<Logic>) => void;
  onDeleteLogic: (logicIndex: number) => void;
}

function QuestionEditor({
  question,
  allQuestions,
  onUpdate,
  onDelete,
  onAddHelpBlock,
  onUpdateHelpBlock,
  onDeleteHelpBlock,
  onAddLogic,
  onUpdateLogic,
  onDeleteLogic,
}: QuestionEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={question.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
            placeholder="Question label"
          />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded"
          >
            {expanded ? '−' : '+'}
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-300">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select
              value={question.type}
              onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Required */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={question.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="mr-2"
            />
            <label className="text-xs">Required</label>
          </div>

          {/* Placeholder */}
          {(question.type === 'text' ||
            question.type === 'textarea' ||
            question.type === 'email' ||
            question.type === 'tel' ||
            question.type === 'number') && (
            <div>
              <label className="block text-xs font-medium mb-1">Placeholder</label>
              <input
                type="text"
                value={question.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )}

          {/* Options */}
          {(question.type === 'select' ||
            question.type === 'radio' ||
            question.type === 'checkbox') && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Options (one per line)
              </label>
              <textarea
                value={question.options?.join('\n') || ''}
                onChange={(e) =>
                  onUpdate({
                    options: e.target.value.split('\n').filter((o) => o.trim()),
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                rows={3}
              />
            </div>
          )}

          {/* File specific */}
          {question.type === 'file' && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={question.multiple || false}
                  onChange={(e) => onUpdate({ multiple: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-xs">Allow multiple files</label>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Accept</label>
                <input
                  type="text"
                  value={question.accept || ''}
                  onChange={(e) => onUpdate({ accept: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="e.g., image/*,.pdf"
                />
              </div>
            </>
          )}

          {/* Help Editor */}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Help</label>
              <button
                onClick={onAddHelpBlock}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
              >
                + Add Block
              </button>
            </div>
            {question.help && (
              <div className="space-y-2">
                <select
                  value={question.help.mode || 'modal'}
                  onChange={(e) =>
                    onUpdate({
                      help: { ...question.help, mode: e.target.value as HelpMode },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                >
                  {HELP_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
                {question.help.blocks?.map((block, blockIndex) => (
                  <div key={blockIndex} className="border rounded p-2 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <select
                        value={block.type}
                        onChange={(e) =>
                          onUpdateHelpBlock(blockIndex, {
                            type: e.target.value as HelpBlockType,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        {HELP_BLOCK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => onDeleteHelpBlock(blockIndex)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) =>
                        onUpdateHelpBlock(blockIndex, { content: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1"
                      placeholder={
                        block.type === 'text'
                          ? 'Text content'
                          : 'URL or content'
                      }
                    />
                    {(block.type === 'image' || block.type === 'gallery') && (
                      <>
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) =>
                            onUpdateHelpBlock(blockIndex, { caption: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1"
                          placeholder="Caption"
                        />
                        <input
                          type="text"
                          value={block.alt || ''}
                          onChange={(e) =>
                            onUpdateHelpBlock(blockIndex, { alt: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Alt text"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logic Editor */}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Conditional Logic</label>
              <button
                onClick={onAddLogic}
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
              >
                + Add Rule
              </button>
            </div>
            {question.logic?.map((logic, logicIndex) => (
              <div key={logicIndex} className="border rounded p-2 bg-white mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">If</span>
                  <button
                    onClick={() => onDeleteLogic(logicIndex)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-2">
                  <select
                    value={logic.condition.questionId}
                    onChange={(e) =>
                      onUpdateLogic(logicIndex, {
                        condition: { ...logic.condition, questionId: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="">Select source question</option>
                    {allQuestions
                      .filter((q) => q.id !== question.id)
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.label}
                        </option>
                      ))}
                  </select>
                  <select
                    value={logic.condition.operator}
                    onChange={(e) =>
                      onUpdateLogic(logicIndex, {
                        condition: {
                          ...logic.condition,
                          operator: e.target.value as Logic['condition']['operator'],
                        },
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {LOGIC_OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={String(logic.condition.value)}
                    onChange={(e) =>
                      onUpdateLogic(logicIndex, {
                        condition: { ...logic.condition, value: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Value"
                  />
                  <select
                    value={logic.action}
                    onChange={(e) =>
                      onUpdateLogic(logicIndex, {
                        action: e.target.value as Logic['action'],
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {LOGIC_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action} this question
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
