'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Form, Section, Question, Help, Logic, QuestionType, HelpMode, HelpBlockType, SectionGradient } from '@/lib/forms/schema';

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
const LOGIC_OPERATORS: Array<{ value: Logic['condition']['operator']; label: string }> = [
  { value: 'equals', label: 'Равно' },
  { value: 'notEquals', label: 'Не равно' },
  { value: 'contains', label: 'Содержит' },
  { value: 'greaterThan', label: 'Больше' },
  { value: 'lessThan', label: 'Меньше' },
];
const LOGIC_ACTIONS = ['show', 'hide'];
const SECTION_GRADIENTS: { value: SectionGradient; label: string; preview: string }[] = [
  { value: 'white-blue', label: 'Белый → Светло-синий', preview: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 20%, #ffffff 80%, #e0f2fe 100%)' },
  { value: 'white-lightblue', label: 'Белый → Очень светло-синий', preview: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 20%, #ffffff 80%, #f0f9ff 100%)' },
  { value: 'white-gray', label: 'Белый → Светло-серый', preview: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 20%, #ffffff 80%, #f3f4f6 100%)' },
  { value: 'white-purple', label: 'Белый → Светло-фиолетовый', preview: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 20%, #ffffff 80%, #f3e8ff 100%)' },
  { value: 'white-orange', label: 'Белый → Светло-оранжевый', preview: 'linear-gradient(135deg, #fed7aa 0%, #ffffff 20%, #ffffff 80%, #fed7aa 100%)' },
  { value: 'white-green', label: 'Белый → Светло-зеленый', preview: 'linear-gradient(135deg, #d1fae5 0%, #ffffff 20%, #ffffff 80%, #d1fae5 100%)' },
];

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
      title: 'Новый раздел',
      description: '',
      questions: [],
      gradient: 'white-blue', // Градиент по умолчанию
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
    if (confirm('Удалить этот раздел и все его вопросы?')) {
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
      label: 'Новый вопрос',
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

  const moveQuestion = (
    sectionId: string,
    draggedQuestionId: string,
    targetIndex: number
  ) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        
        const questions = [...s.questions];
        const draggedIndex = questions.findIndex((q) => q.id === draggedQuestionId);
        
        if (draggedIndex === -1 || draggedIndex === targetIndex) return s;
        
        // Remove question from old position
        const [movedQuestion] = questions.splice(draggedIndex, 1);
        // Insert at new position (adjust if dragged from before target)
        const adjustedIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        questions.splice(adjustedIndex, 0, movedQuestion);
        
        return { ...s, questions };
      }),
    }));
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

  // Section logic functions
  const addSectionLogic = (sectionId: string) => {
    const section = form.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newLogic: Logic = {
      condition: {
        questionId: '',
        operator: 'equals',
        value: '',
      },
      action: 'show',
    };

    updateSection(sectionId, {
      logic: [...(section.logic || []), newLogic],
    });
  };

  const updateSectionLogic = (
    sectionId: string,
    logicIndex: number,
    updates: Partial<Logic>
  ) => {
    const section = form.sections.find((s) => s.id === sectionId);
    if (!section?.logic) return;

    const updatedLogic = [...section.logic];
    updatedLogic[logicIndex] = {
      ...updatedLogic[logicIndex],
      ...updates,
      condition: {
        ...updatedLogic[logicIndex].condition,
        ...(updates.condition || {}),
      },
    };

    updateSection(sectionId, { logic: updatedLogic });
  };

  const deleteSectionLogic = (sectionId: string, logicIndex: number) => {
    const section = form.sections.find((s) => s.id === sectionId);
    if (!section?.logic) return;

    const updatedLogic = section.logic.filter((_, i) => i !== logicIndex);
    updateSection(sectionId, {
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
          <label className="block text-sm font-medium mb-1 text-[#4A4A4A] font-sans">
            Название формы *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded font-sans text-[#4A4A4A] placeholder:text-gray-400"
            placeholder="Введите название формы"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[#4A4A4A] font-sans">
            Слаг формы * (для URL)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateForm({ slug: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded font-sans text-[#4A4A4A] placeholder:text-gray-400"
            placeholder="например, contact-form"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[#4A4A4A] font-sans">
            Описание
          </label>
          <textarea
            value={form.description || ''}
            onChange={(e) => updateForm({ description: e.target.value })}
            onKeyDown={(e) => {
              // Stop all key events from propagating to prevent interference
              e.stopPropagation();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded font-sans text-[#4A4A4A] placeholder:text-gray-400"
            rows={3}
            placeholder="Введите описание формы"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#4A4A4A] font-sans">Разделы</h2>
          <button
            onClick={addSection}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Добавить раздел
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
                    className="w-full px-3 py-2 border border-gray-300 rounded font-semibold font-sans text-[#4A4A4A] placeholder:text-gray-400"
                    placeholder="Название раздела"
                  />
                  <textarea
                    value={section.description || ''}
                    onChange={(e) =>
                      updateSection(section.id, { description: e.target.value })
                    }
                    onKeyDown={(e) => {
                      // Stop all key events from propagating to prevent interference
                      e.stopPropagation();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-sans text-[#4A4A4A] placeholder:text-gray-400"
                    rows={2}
                    placeholder="Описание раздела (необязательно)"
                  />
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[#4A4A4A] font-sans">
                      Градиент фона
                    </label>
                    <select
                      value={section.gradient || 'white-blue'}
                      onChange={(e) =>
                        updateSection(section.id, { gradient: e.target.value as SectionGradient })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                    >
                      {SECTION_GRADIENTS.map((gradient) => (
                        <option key={gradient.value} value={gradient.value}>
                          {gradient.label}
                        </option>
                      ))}
                    </select>
                    {section.gradient && (
                      <div
                        className="mt-2 h-8 rounded border border-gray-200"
                        style={{
                          background: SECTION_GRADIENTS.find(g => g.value === section.gradient)?.preview || SECTION_GRADIENTS[0].preview
                        }}
                      />
                    )}
                  </div>
                  {/* Section Logic Editor */}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[#4A4A4A] font-sans">Условная логика раздела</label>
                      <button
                        onClick={() => addSectionLogic(section.id)}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
                      >
                        + Добавить правило
                      </button>
                    </div>
                    {section.logic?.map((logic, logicIndex) => (
                      <div key={logicIndex} className="border rounded p-2 bg-white mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[#4A4A4A] font-sans">Если</span>
                          <button
                            onClick={() => deleteSectionLogic(section.id, logicIndex)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={logic.condition.questionId}
                            onChange={(e) =>
                              updateSectionLogic(section.id, logicIndex, {
                                condition: { ...logic.condition, questionId: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                          >
                            <option value="">Выберите исходный вопрос</option>
                            {getAllQuestionIds()
                              .filter((q) => {
                                // Exclude questions from this section
                                return !section.questions.some((sq) => sq.id === q.id);
                              })
                              .map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.label}
                                </option>
                              ))}
                          </select>
                          <select
                            value={logic.condition.operator}
                            onChange={(e) =>
                              updateSectionLogic(section.id, logicIndex, {
                                condition: {
                                  ...logic.condition,
                                  operator: e.target.value as Logic['condition']['operator'],
                                },
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                          >
                            {LOGIC_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={String(logic.condition.value)}
                            onChange={(e) =>
                              updateSectionLogic(section.id, logicIndex, {
                                condition: { ...logic.condition, value: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] placeholder:text-gray-400"
                            placeholder="Значение"
                          />
                          <select
                            value={logic.action}
                            onChange={(e) =>
                              updateSectionLogic(section.id, logicIndex, {
                                action: e.target.value as Logic['action'],
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                          >
                            {LOGIC_ACTIONS.map((action) => (
                              <option key={action} value={action}>
                                {action === 'show' ? 'Показать' : 'Скрыть'} этот раздел
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Удалить
                </button>
              </div>

              {/* Questions */}
              <div className="ml-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#4A4A4A] font-sans">Вопросы</h3>
                  <button
                    onClick={() => addQuestion(section.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Добавить вопрос
                  </button>
                </div>

                {section.questions.map((question, questionIndex) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    sectionId={section.id}
                    questionIndex={questionIndex}
                    allQuestions={getAllQuestionIds()}
                    onUpdate={(updates) =>
                      updateQuestion(section.id, question.id, updates)
                    }
                    onDelete={() => deleteQuestion(section.id, question.id)}
                    onMove={(draggedQuestionId, targetIndex) => {
                      moveQuestion(section.id, draggedQuestionId, targetIndex);
                    }}
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
          {isSaving ? 'Сохранение...' : 'Сохранить форму'}
        </button>
        {error && <p className="text-red-600 text-sm py-2 font-sans">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm py-2 font-sans">Форма успешно сохранена!</p>
        )}
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  sectionId: string;
  questionIndex: number;
  allQuestions: Array<{ id: string; label: string }>;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onMove: (draggedQuestionId: string, targetIndex: number) => void;
  onAddHelpBlock: () => void;
  onUpdateHelpBlock: (blockIndex: number, updates: any) => void;
  onDeleteHelpBlock: (blockIndex: number) => void;
  onAddLogic: () => void;
  onUpdateLogic: (logicIndex: number, updates: Partial<Logic>) => void;
  onDeleteLogic: (logicIndex: number) => void;
}

function QuestionEditor({
  question,
  questionIndex,
  allQuestions,
  onUpdate,
  onDelete,
  onMove,
  onAddHelpBlock,
  onUpdateHelpBlock,
  onDeleteHelpBlock,
  onAddLogic,
  onUpdateLogic,
  onDeleteLogic,
}: QuestionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', question.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only handle drag over on the container itself, not on input/textarea elements or their children
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    // Only handle drop on the container itself, not on input/textarea elements or their children
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const draggedQuestionId = e.dataTransfer.getData('text/plain');
    
    if (draggedQuestionId && draggedQuestionId !== question.id) {
      onMove(draggedQuestionId, questionIndex);
    }
  };

  return (
    <div
      className={`border rounded p-3 bg-gray-50 transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${dragOver ? 'border-blue-500 border-2' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div 
            className="cursor-move text-gray-400 hover:text-gray-600 select-none" 
            title="Перетащите для изменения порядка"
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseDown={(e) => {
              // Prevent text selection when starting drag
              e.preventDefault();
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={question.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              onMouseDown={(e) => {
                // Prevent drag from starting when clicking in input
                e.stopPropagation();
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium font-sans text-[#4A4A4A] placeholder:text-gray-400"
              placeholder="Текст вопроса"
            />
          </div>
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
            Удалить
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-300">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1 text-[#4A4A4A] font-sans">Тип</label>
            <select
              value={question.type}
              onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans text-[#4A4A4A]"
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
            <label className="text-xs text-[#4A4A4A] font-sans">Обязательный</label>
          </div>

          {/* Placeholder */}
          {(question.type === 'text' ||
            question.type === 'textarea' ||
            question.type === 'email' ||
            question.type === 'tel' ||
            question.type === 'number') && (
            <div>
              <label className="block text-xs font-medium mb-1 text-[#4A4A4A] font-sans">Подсказка</label>
              <input
                type="text"
                value={question.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans text-[#4A4A4A] placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Options */}
          {(question.type === 'select' ||
            question.type === 'radio' ||
            question.type === 'checkbox') && (
            <div>
              <label className="block text-xs font-medium mb-1 text-[#4A4A4A] font-sans">
                Варианты (по одному в строке)
              </label>
              <textarea
                value={question.options?.join('\n') || ''}
                onChange={(e) =>
                  onUpdate({
                    options: e.target.value.split('\n').filter((o) => o.trim()),
                  })
                }
                onKeyDown={(e) => {
                  // Prevent parent handlers from interfering with textarea input
                  // For Enter, we want default behavior (new line), so we only stop propagation
                  e.stopPropagation();
                }}
                onKeyPress={(e) => {
                  // Also stop keyPress to prevent any handlers from interfering
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  // Prevent drag from starting when clicking in textarea
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  // Stop propagation on click to prevent drag handlers
                  e.stopPropagation();
                }}
                onFocus={(e) => {
                  // Stop focus events from triggering drag handlers
                  e.stopPropagation();
                }}
                onBlur={(e) => {
                  // Stop blur events from triggering drag handlers
                  e.stopPropagation();
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans text-[#4A4A4A] placeholder:text-gray-400"
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
                <label className="text-xs text-[#4A4A4A] font-sans">Разрешить несколько файлов</label>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[#4A4A4A] font-sans">Принимать</label>
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
              <label className="text-xs font-medium text-[#4A4A4A] font-sans">Справка</label>
              <button
                onClick={onAddHelpBlock}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
              >
                + Добавить блок
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
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
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
                        className="px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
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
                        Удалить
                      </button>
                    </div>
                    {block.type === 'text' ? (
                      <textarea
                        value={block.content}
                        onChange={(e) =>
                          onUpdateHelpBlock(blockIndex, { content: e.target.value })
                        }
                        onKeyDown={(e) => {
                          // Prevent parent handlers from interfering with textarea input
                          // For Enter, we want default behavior (new line), so we only stop propagation
                          e.stopPropagation();
                        }}
                        onKeyPress={(e) => {
                          // Also stop keyPress to prevent any handlers from interfering
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          // Prevent drag from starting when clicking in textarea
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          // Stop propagation on click to prevent drag handlers
                          e.stopPropagation();
                        }}
                        onFocus={(e) => {
                          // Stop focus events from triggering drag handlers
                          e.stopPropagation();
                        }}
                        onBlur={(e) => {
                          // Stop blur events from triggering drag handlers
                          e.stopPropagation();
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans text-[#4A4A4A] placeholder:text-gray-400"
                        placeholder="Текстовое содержимое"
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) =>
                          onUpdateHelpBlock(blockIndex, { content: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1 font-sans text-[#4A4A4A] placeholder:text-gray-400"
                        placeholder={
                          block.type === 'image' || block.type === 'gallery'
                            ? 'URL изображения или загрузите файл ниже'
                            : block.type === 'video'
                            ? 'URL видео или загрузите файл ниже'
                            : 'URL или содержимое'
                        }
                      />
                    )}
                    {(block.type === 'image' || block.type === 'gallery') && (
                      <>
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-[#4A4A4A] font-sans mb-1">
                            Загрузить изображение
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  alert('Пожалуйста, выберите файл изображения');
                                  return;
                                }
                                // Validate file size (5MB max for help images)
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Размер файла не должен превышать 5MB');
                                  return;
                                }
                                // Convert to base64
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64 = event.target?.result as string;
                                  onUpdateHelpBlock(blockIndex, { content: base64 });
                                };
                                reader.onerror = () => {
                                  alert('Ошибка при загрузке файла');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-sans file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        {block.content && block.content.startsWith('data:image/') && (
                          <div className="mb-2">
                            <img
                              src={block.content}
                              alt="Предпросмотр"
                              className="max-w-full h-auto rounded border border-gray-300"
                              style={{ maxHeight: '150px' }}
                            />
                          </div>
                        )}
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) =>
                            onUpdateHelpBlock(blockIndex, { caption: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1 font-sans text-[#4A4A4A] placeholder:text-gray-400"
                          placeholder="Подпись"
                        />
                        <input
                          type="text"
                          value={block.alt || ''}
                          onChange={(e) =>
                            onUpdateHelpBlock(blockIndex, { alt: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] placeholder:text-gray-400"
                          placeholder="Альтернативный текст"
                        />
                      </>
                    )}
                    {block.type === 'video' && (
                      <>
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-[#4A4A4A] font-sans mb-1">
                            Загрузить видео
                          </label>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                if (!file.type.startsWith('video/')) {
                                  alert('Пожалуйста, выберите файл видео');
                                  return;
                                }
                                // Validate file size (50MB max for help videos)
                                if (file.size > 50 * 1024 * 1024) {
                                  alert('Размер файла не должен превышать 50MB');
                                  return;
                                }
                                // Convert to base64
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64 = event.target?.result as string;
                                  onUpdateHelpBlock(blockIndex, { content: base64 });
                                };
                                reader.onerror = () => {
                                  alert('Ошибка при загрузке файла');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-sans file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        {block.content && block.content.startsWith('data:video/') && (
                          <div className="mb-2">
                            <video
                              src={block.content}
                              controls
                              className="max-w-full h-auto rounded border border-gray-300"
                              style={{ maxHeight: '200px' }}
                            >
                              Ваш браузер не поддерживает видео.
                            </video>
                          </div>
                        )}
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) =>
                            onUpdateHelpBlock(blockIndex, { caption: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] placeholder:text-gray-400"
                          placeholder="Подпись"
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
              <label className="text-xs font-medium text-[#4A4A4A] font-sans">Условная логика</label>
              <button
                onClick={onAddLogic}
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
              >
                + Добавить правило
              </button>
            </div>
            {question.logic?.map((logic, logicIndex) => (
              <div key={logicIndex} className="border rounded p-2 bg-white mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#4A4A4A] font-sans">Если</span>
                  <button
                    onClick={() => onDeleteLogic(logicIndex)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    Удалить
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
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                  >
                    <option value="">Выберите исходный вопрос</option>
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
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                  >
                    {LOGIC_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
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
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A] placeholder:text-gray-400"
                    placeholder="Значение"
                  />
                  <select
                    value={logic.action}
                    onChange={(e) =>
                      onUpdateLogic(logicIndex, {
                        action: e.target.value as Logic['action'],
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-[#4A4A4A]"
                  >
                    {LOGIC_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action === 'show' ? 'Показать' : 'Скрыть'} этот вопрос
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
