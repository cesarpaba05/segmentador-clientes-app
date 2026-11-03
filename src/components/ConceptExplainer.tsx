import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface ConceptExplainerProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const ConceptExplainer: React.FC<ConceptExplainerProps> = ({
  title = "¿Qué significa esto para el negocio?",
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 text-left focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/70 text-amber-900">
            <Lightbulb className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-amber-950">
            {title}
          </span>
        </div>
        <div className="text-amber-800 hover:text-amber-950">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 text-xs sm:text-sm leading-relaxed text-amber-900/90 pl-9 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
};
