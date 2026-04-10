import { cn } from '@/lib/utils';
import { STAGE_LABELS } from '@/utils/formatters';
import { Check } from 'lucide-react';

interface StageProgressBarProps {
  currentStage: number;
}

export function StageProgressBar({ currentStage }: StageProgressBarProps) {
  const stages = Object.entries(STAGE_LABELS);

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {stages.map(([num, label], idx) => {
          const stageNum = Number(num);
          const isCompleted = stageNum < currentStage;
          const isCurrent = stageNum === currentStage;
          const isUpcoming = stageNum > currentStage;

          return (
            <div key={num} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                    isCompleted && 'bg-brand-500 border-brand-500 text-white',
                    isCurrent && 'bg-white border-brand-500 text-brand-600 shadow-md ring-2 ring-brand-200',
                    isUpcoming && 'bg-gray-100 border-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : num}
                </div>
                <span
                  className={cn(
                    'mt-1 text-[10px] text-center max-w-[60px] leading-tight',
                    isCompleted && 'text-brand-600 font-medium',
                    isCurrent && 'text-brand-700 font-bold',
                    isUpcoming && 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 mx-1 flex-shrink-0 mt-[-18px]',
                    stageNum < currentStage ? 'bg-brand-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
