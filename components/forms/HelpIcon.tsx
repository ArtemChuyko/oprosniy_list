/**
 * Help icon button component
 */

interface HelpIconProps {
  onClick: () => void;
  ariaLabel?: string;
}

export default function HelpIcon({ onClick, ariaLabel = 'Показать подсказку' }: HelpIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 text-blue-500 hover:text-blue-700 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-blue-50 transition-colors"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  );
}
