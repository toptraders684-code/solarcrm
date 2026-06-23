import { cn } from '@/lib/utils';
import { STAGE_LABELS } from '@/utils/formatters';
import { Check } from 'lucide-react';

interface StageProgressBarProps {
  currentStage: number;
}

const COL_W      = 80;  // px per stage column
const LABEL_H    = 56;  // px — top/bottom label area height (fits ~4 lines at 9px)
const CIRCLE_PX  = 32;  // px — circle diameter
const GAP        = 6;   // px — space between label and circle

// connector line sits exactly at circle centres
const LINE_TOP = LABEL_H + GAP + CIRCLE_PX / 2;

export function StageProgressBar({ currentStage }: StageProgressBarProps) {
  const stages = Object.entries(STAGE_LABELS).map(([num, label]) => ({
    num: Number(num),
    label,
  }));

  const totalW       = stages.length * COL_W;
  const halfCol      = COL_W / 2;
  const lineLeft     = halfCol;
  const lineRight    = halfCol;
  const activeWidth  = Math.min(currentStage - 1, stages.length - 1) * COL_W;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">
          Project Workflow
        </h3>
        <span className="text-xs font-bold text-primary">
          Stage {currentStage} of {stages.length}
        </span>
      </div>

      {/* Stepper */}
      <div className="overflow-x-auto">
        <div className="relative flex" style={{ width: totalW, paddingBottom: 8 }}>

          {/* Background connector */}
          <div
            className="absolute h-0.5 bg-surface-container-high rounded-full"
            style={{ top: LINE_TOP, left: lineLeft, right: lineRight }}
          />
          {/* Active connector */}
          <div
            className="absolute h-0.5 signature-gradient rounded-full transition-all duration-500"
            style={{ top: LINE_TOP, left: lineLeft, width: activeWidth }}
          />

          {stages.map(({ num, label }) => {
            const isOdd      = num % 2 === 1;
            const isCompleted = num < currentStage;
            const isCurrent   = num === currentStage;
            const isPending   = num > currentStage;

            const labelEl = (
              <span className={cn(
                'block text-center leading-tight px-1',
                isCurrent  ? 'text-[9px] font-black text-primary'
                : isCompleted ? 'text-[9px] font-semibold text-on-surface-variant/60'
                : 'text-[9px] font-semibold text-on-surface-variant/35',
              )}>
                {label}
              </span>
            );

            return (
              <div
                key={num}
                className="flex flex-col items-center flex-shrink-0"
                style={{ width: COL_W }}
              >
                {/* Top label slot — odd stages show their label here */}
                <div
                  className="flex items-end justify-center w-full"
                  style={{ height: LABEL_H, paddingBottom: GAP }}
                >
                  {isOdd && labelEl}
                </div>

                {/* Circle */}
                <div className={cn(
                  'rounded-full flex items-center justify-center z-10 transition-all flex-shrink-0',
                  isCompleted && 'signature-gradient text-white shadow-sm',
                  isCurrent   && 'signature-gradient text-white shadow-lg ring-4 ring-primary/25',
                  isPending   && 'bg-surface-container-high text-on-surface-variant/40',
                )}
                style={{ width: CIRCLE_PX, height: CIRCLE_PX }}
                >
                  {isCompleted
                    ? <Check size={13} strokeWidth={3} />
                    : <span className={cn('font-black', isCurrent ? 'text-sm' : 'text-[11px]')}>{num}</span>
                  }
                </div>

                {/* Bottom label slot — even stages show their label here */}
                <div
                  className="flex items-start justify-center w-full"
                  style={{ height: LABEL_H, paddingTop: GAP }}
                >
                  {!isOdd && labelEl}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
