import React, { useState } from 'react';
import { ColumnSummary, TransformProposal } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import { Check, X, ArrowRight, Sparkles, Scale, BarChart2 } from 'lucide-react';

interface Step5DataPreparationProps {
  proposals: TransformProposal[];
  summaries: ColumnSummary[];
  histogramsBefore: Record<string, { bin: string; count: number }[]>;
  histogramsAfter: Record<string, { bin: string; count: number }[]>;
  onToggleTransform: (variable: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5DataPreparation: React.FC<Step5DataPreparationProps> = ({
  proposals,
  summaries,
  histogramsBefore,
  histogramsAfter,
  onToggleTransform,
  onNext,
  onPrev,
}) => {
  const [selectedPreviewVar, setSelectedPreviewVar] = useState<string>(
    proposals[0]?.variable || ''
  );

  const activeProposal = proposals.find((p) => p.variable === selectedPreviewVar);
  const beforeHist = histogramsBefore[selectedPreviewVar] || [];
  const afterHist = histogramsAfter[selectedPreviewVar] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 5 de 10</span>
          <span>·</span>
          <span>Transformación y Estandarización</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Preparar y Nivelar los Datos para K-Means
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Para que el algoritmo funcione con precisión matemática sin dejarse engañar por escalas gigantes ni colas extremas, aplicamos dos técnicas: suavizado logarítmico de asimetría y estandarización a escala común.
        </p>
      </div>

      {/* Part 1: Proposed Log(1+x) Transformations */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                1. Corrección de Asimetría: Transformación <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800 text-xs">log(1 + x)</code>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Detectamos variables con asimetría (|g1| &gt; 1). Puedes activar o desactivar la transformación para cada una:
              </p>
            </div>
          </div>
        </div>

        {proposals.length === 0 ? (
          <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-lg">
            Todas las variables de comportamiento tienen distribuciones simétricas y balanceadas. No se requiere transformación logarítmica.
          </p>
        ) : (
          <div className="space-y-3">
            {proposals.map((prop) => (
              <div
                key={prop.variable}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  prop.applyLog1p
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-stone-200 bg-stone-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900 font-mono">
                      {prop.variable}
                    </span>
                    <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.2 rounded">
                      Asimetría original: {prop.originalSkewness > 0 ? '+' : ''}{prop.originalSkewness.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 max-w-xl">
                    {prop.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewVar(prop.variable)}
                    className="text-xs text-stone-600 hover:text-amber-800 underline font-medium"
                  >
                    Ver histogramas
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleTransform(prop.variable)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      prop.applyLog1p
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {prop.applyLog1p ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Aplicar log(1+x)
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" /> No aplicar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Part 2: Standardization Explanation */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-800 shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-sky-950">
              2. Estandarización Automática (Z-Score: Media = 0, Desviación Estándar = 1)
            </h3>
            <p className="text-xs text-sky-900/90 mt-1 leading-relaxed">
              Todas las variables de comportamiento se estandarizan restando su media y dividiendo por su desviación estándar:
              <span className="font-mono bg-white/80 px-1.5 py-0.5 rounded text-sky-950 ml-1 font-semibold">
                z = (x - media) / desviación
              </span>.
            </p>
            <p className="text-xs text-sky-900/80 mt-1.5">
              <strong>¿Por qué es indispensable?</strong> Si una variable se mide en dólares ($0 a $300) y otra en aplicaciones (0 a 3), la de dólares aplastaría matemáticamente a la otra por tener números más grandes. La estandarización las lleva a un lenguaje común: <strong>cuántas desviaciones estándar por encima o por debajo del promedio está cada cliente</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Part 3: Before and After Histograms */}
      {selectedPreviewVar && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-amber-600" />
                Comparación Visual: Antes vs. Después para <span className="font-mono text-amber-900">{selectedPreviewVar}</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Observa cómo la distribución se vuelve más compacta y homogénea para el cálculo de distancias.
              </p>
            </div>

            {proposals.length > 1 && (
              <select
                value={selectedPreviewVar}
                onChange={(e) => setSelectedPreviewVar(e.target.value)}
                className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-800 bg-stone-50 focus:outline-none"
              >
                {proposals.map((p) => (
                  <option key={p.variable} value={p.variable}>
                    {p.variable}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Histogram Before */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                <span>Antes de transformar (Valores originales)</span>
                <span className="text-[11px] font-normal text-stone-500">
                  Cola larga a la derecha
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1.5 items-end h-32 border-b border-stone-200 pb-1">
                {(() => {
                  const maxCount = Math.max(...beforeHist.map((b) => b.count), 1);
                  return beforeHist.map((b, i) => (
                    <div key={i} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] text-stone-400 font-mono group-hover:text-stone-900">
                        {b.count}
                      </span>
                      <div
                        className="w-full bg-stone-300 group-hover:bg-stone-500 rounded-t"
                        style={{ height: `${Math.max(4, (b.count / maxCount) * 100)}%` }}
                        title={`${b.bin}: ${b.count}`}
                      />
                    </div>
                  ));
                })()}
              </div>
              <div className="text-[10px] text-stone-500 text-center mt-2">
                Valores fuertemente concentrados en un extremo con clientes atípicos muy alejados.
              </div>
            </div>

            {/* Histogram After */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-950 mb-2">
                <span>Después de transformar y estandarizar</span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Distribución equilibrada
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1.5 items-end h-32 border-b border-amber-200 pb-1">
                {(() => {
                  const maxCount = Math.max(...afterHist.map((b) => b.count), 1);
                  return afterHist.map((b, i) => (
                    <div key={i} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] text-amber-800 font-mono group-hover:text-amber-950 font-bold">
                        {b.count}
                      </span>
                      <div
                        className="w-full bg-amber-400 group-hover:bg-amber-600 rounded-t"
                        style={{ height: `${Math.max(4, (b.count / maxCount) * 100)}%` }}
                        title={`${b.bin}: ${b.count}`}
                      />
                    </div>
                  ));
                })()}
              </div>
              <div className="text-[10px] text-amber-900 text-center mt-2 font-medium">
                Centrada en 0.00 con dispersión normalizada (desviaciones estándar σ).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explainer */}
      <ConceptExplainer title="¿Por qué se suma 1 en log(1 + x)?">
        <p>
          En matemáticas, el logaritmo de cero no existe (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-xs">log(0) = indef/infinito negativo</code>).
        </p>
        <p>
          En datos reales de clientes, muchos tienen valor 0 (por ejemplo, cero llamadas realizadas, cero tickets de soporte o cero reclamaciones). Al sumar 1, calculamos <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-xs">log(1 + 0) = log(1) = 0</code>, protegiendo todos los clientes con consumo cero sin generar errores ni perder filas en el análisis.
        </p>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Elegir Variables
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 6 (¿Cuántos Grupos?) →
        </button>
      </div>
    </div>
  );
};
