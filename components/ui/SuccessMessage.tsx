/**
 * Success message display component
 */

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export default function SuccessMessage({ message, className = '' }: SuccessMessageProps) {
  return (
    <div className={`p-4 bg-green-50 border border-green-200 rounded text-green-700 ${className}`}>
      {message}
    </div>
  );
}
