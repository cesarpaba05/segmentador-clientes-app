import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  canGoNext: boolean;
  nextTooltip?: string;
  onPrev: () => void;
  onNext: () => void;
  onGoToStep: (step: number) => void;
  maxAccessibleStep: number;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  stepNames,
  canGoNext,
  nextTooltip,
  onPrev,
  onNext,
  onGoToStep,
  maxAccessibleStep,
}) => {
  return (
    <div className="w-full">
      {/* Horizontal step indicator for desktop and mobile */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[760px] justify-between border-b border-stone-200 pb-3 px-1">
          {stepNames.map((name, idx) => {
            const stepNum = idx + 1;
            const isCurrent = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            const isClickable = stepNum <= maxAccessibleStep;

            return (
              <button
                key={stepNum}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onGoToStep(stepNum)}
                className={`group flex items-center gap-2 text-left transition-all ${
                  !isClickable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-100'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-amber-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600 group-hover:bg-stone-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[11px] font-medium leading-none ${
                      isCurrent
                        ? 'font-bold text-amber-900'
                        : isCompleted
                        ? 'text-stone-700'
                        : 'text-stone-400'
                    }`}
                  >
                    Paso {stepNum}
                  </span>
                  <span
                    className={`mt-0.5 text-xs truncate max-w-[100px] ${
                      isCurrent
                        ? 'font-semibold text-stone-900'
                        : isCompleted
                        ? 'text-stone-600'
                        : 'text-stone-400'
                    }`}
                  >
                    {name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating or docked action bar at the bottom is handled in parent or here, but let's provide top/bottom controls */}
    </div>
  );
};
