import { cn } from '@/lib/utils';
import { STAGE_LABELS } from '@/utils/formatters';
import { Check } from 'lucide-react';

interface StageProgressBarProps {
  currentStage: number;
}

export function StageProgressBar({ currentStage }: StageProgressBarProps) {
  const stages = Object.entries(STAGE_LABELS);
  const completedPercent = ((currentStage - 1) / (stages.length - 1)) * 100;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Project Workflow</h3>
        <span className="text-xs font-bold text-primary">Stage {currentStage} of {stages.length}</span>
      </div>

      <div className="relative flex justify-between items-center w-full overflow-x-auto pb-2">
        {/* Background connector */}
        <div className="absolute top-5 left-0 w-full h-1 bg-surface-container-high rounded-full -translate-y-1/2" />
        {/* Active connector */}
        <div
          className="absolute top-5 left-0 h-1 signature-gradient rounded-full -translate-y-1/2 transition-all duration-500"
          style={{ width: `${completedPercent}%` }}
        />

        {stages.map(([num, label]) => {
          const stageNum = Number(num);
          const isCompleted = stageNum < currentStage;
          const isCurrent = stageNum === currentStage;

          return (
            <div key={num} className="relative z-10 flex flex-col items-center gap-2 group flex-shrink-0 px-1">
              <div className={cn(
                'rounded-full flex items-center justify-center transition-all',
                isCompleted || isCurrent
                  ? 'signature-gradient text-white shadow-lg'
                  : 'bg-surface-container-high text-on-surface-variant/40',
                isCurrent
                  ? 'h-11 w-11 border-4 border-surface-container-lowest scale-110 shadow-xl'
                  : 'h-9 w-9'
              )}>
                {isCompleted ? <Check size={16} /> : <span className="text-xs font-black">{num}</span>}
              </div>
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-tight text-center max-w-[52px] leading-tight',
                isCurrent ? 'text-primary font-black' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant/40'
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
