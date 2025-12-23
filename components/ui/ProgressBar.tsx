/**
 * Progress bar component for form completion
 */

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label = 'Прогресс' }: ProgressBarProps) {
  // Calculate color gradient from orange to green based on progress
  // 0% = orange (#FFA500), 100% = green (#22C55E)
  const getProgressColor = (progressValue: number): string => {
    const clampedProgress = Math.min(100, Math.max(0, progressValue)) / 100;
    
    // Interpolate between orange and green
    // Orange: rgb(255, 165, 0) = #FFA500
    // Green: rgb(34, 197, 94) = #22C55E
    const r = Math.round(255 * (1 - clampedProgress) + 34 * clampedProgress);
    const g = Math.round(165 * (1 - clampedProgress) + 197 * clampedProgress);
    const b = Math.round(0 * (1 - clampedProgress) + 94 * clampedProgress);
    
    // Convert to hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const progressColor = getProgressColor(progress);
  const progressWidth = `${Math.min(100, Math.max(0, progress))}%`;

  return (
    <div className="mb-6 sticky top-0 z-10 bg-white pt-2 pb-4 -mx-6 px-6 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#4A4A4A] font-sans">{label}</span>
        <span className="text-sm text-[#4A4A4A] font-sans font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300 relative overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            width: progressWidth,
            backgroundColor: progressColor,
            backgroundImage: `linear-gradient(to right, ${progressColor}cc, ${progressColor})`,
            boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          }}
        />
      </div>
    </div>
  );
}
