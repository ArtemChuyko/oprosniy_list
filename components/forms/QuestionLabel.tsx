/**
 * Question label component with help icon
 */

import HelpIcon from './HelpIcon';

interface QuestionLabelProps {
  label: string;
  required?: boolean;
  hasHelp?: boolean;
  onHelpClick?: () => void;
}

export default function QuestionLabel({
  label,
  required = false,
  hasHelp = false,
  onHelpClick,
}: QuestionLabelProps) {
  return (
    <label className="block text-sm font-medium mb-1 flex items-center text-[#4A4A4A] font-sans">
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {hasHelp && onHelpClick && <HelpIcon onClick={onHelpClick} />}
    </label>
  );
}
