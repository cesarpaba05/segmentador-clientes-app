import React, { useState } from 'react';
import { ColumnSummary } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import { AlertTriangle, CheckCircle, BarChart3, HelpCircle, Eye } from 'lucide-react';

interface Step3VariableUnderstandingProps {
  summaries: ColumnSummary[];
  onNext: () => void;
  onPrev: () => void;
}

export const Step3VariableUnderstanding: React.FC<Step3VariableUnderstandingProps> = ({
  summaries,
  onNext,
  onPrev,
}) => {
  const [selectedHistVar, setSelectedHistVar] = useState<string | null>(
    summaries.find((s) => s.type === 'numeric')?.name || null
  );

  const missingAlerts = summaries.filter((s) => s.missingCount > 0);
  const impossibleAlerts = summaries.filter((s) => s.isImpossible);

  const activeHistSummary = summaries.find((s) => s.name === selectedHistVar);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 3 de 10</span>
          <span>·</span>
          <span>Auditoría y Estadísticas Descriptivas</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Entender las Variables de la Base
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Revisamos la distribución, tipo de datos y posibles anomalías de cada columna. Este chequeo garantiza que los grupos se formen sobre datos confiables y sin sesgos ocultos.
        </p>
      </div>

      {/* Warnings & Alerts */}
      {(missingAlerts.length > 0 || impossibleAlerts.length > 0) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Alertas de calidad detectadas:
          </div>
          {missingAlerts.map((s) => (
            <p key={s.name} className="text-xs text-amber-900 pl-6">
              • La variable <strong>{s.name}</strong> tiene <strong>{s.missingCount} valores faltantes</strong> ({s.missingPercent.toFixed(1)}%).
            </p>
          ))}
          {impossibleAlerts.map((s) => (
            <p key={s.name} className="text-xs text-rose-800 font-medium pl-6">
              • ⚠️ <strong>{s.name}</strong>: {s.impossibleReason}
            </p>
          ))}
        </div>
      )}

      {missingAlerts.length === 0 && impossibleAlerts.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>¡Excelente calidad de datos! No se detectaron valores faltantes ni valores numéricos imposibles.</span>
        </div>
      )}

      {/* Variables Summary Table */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
          Resumen Estadístico por Variable ({summaries.length} columnas)
        </h3>

        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-semibold">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3">Tipo Detectado</th>
                <th className="py-2.5 px-3">Valores Faltantes</th>
                <th className="py-2.5 px-3 text-right">Media</th>
                <th className="py-2.5 px-3 text-right">Mediana</th>
                <th className="py-2.5 px-3 text-right">Desv. Estándar</th>
                <th className="py-2.5 px-3 text-right">Mínimo</th>
                <th className="py-2.5 px-3 text-right">Máximo</th>
                <th className="py-2.5 px-3 text-right">Asimetría</th>
                <th className="py-2.5 px-3 text-center">Histograma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {summaries.map((col) => {
                const isSelected = selectedHistVar === col.name;
                const isNumeric = col.type === 'numeric' || (col.type === 'binary' && col.mean !== undefined);
                const hasHighSkew = col.skewness !== undefined && (col.skewness > 1 || col.skewness < -1);

                return (
                  <tr
                    key={col.name}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-50/50 font-medium' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-stone-900 flex items-center gap-1.5">
                      <span>{col.name}</span>
                      {col.isImpossible && (
                        <span className="text-rose-600 font-bold" title={col.impossibleReason}>
                          ⚠️
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] font-medium ${
                          col.type === 'numeric'
                            ? 'text-sky-700'
                            : col.type === 'binary'
                            ? 'text-purple-700'
                            : 'text-stone-600'
                        }`}
                      >
                        {col.type === 'numeric' ? 'Numérica' : col.type === 'binary' ? 'Binaria (0/1)' : 'Categórica'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {col.missingCount === 0 ? (
                        <span className="text-stone-400">0 (0%)</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">
                          {col.missingCount} ({col.missingPercent.toFixed(1)}%)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.mean !== undefined ? col.mean.toFixed(2) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.median !== undefined ? col.median.toFixed(2) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.stdDev !== undefined ? col.stdDev.toFixed(2) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.min !== undefined ? col.min.toFixed(1) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.max !== undefined ? col.max.toFixed(1) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      {isNumeric && col.skewness !== undefined ? (
                        <span
                          className={hasHighSkew ? 'text-amber-800 font-bold' : 'text-stone-600'}
                          title={hasHighSkew ? 'Asimetría alta (|g1| > 1). En el Paso 5 sugeriremos transformarla.' : 'Asimetría moderada'}
                        >
                          {col.skewness > 0 ? '+' : ''}
                          {col.skewness.toFixed(2)}
                          {hasHighSkew ? ' ⚡' : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {isNumeric ? (
                        <button
                          type="button"
                          onClick={() => setSelectedHistVar(col.name)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-amber-600 text-white font-semibold'
                              : 'text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Ver
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[11px]">
                          {col.uniqueCount} cat.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Histogram Viewer */}
      {activeHistSummary && activeHistSummary.histogram && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                Histograma de Frecuencia: <span className="text-amber-900 font-mono">{activeHistSummary.name}</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Muestra cómo se agrupan los clientes a lo largo de los rangos de esta variable.
              </p>
            </div>

            {/* Quick switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Cambiar variable:</span>
              <select
                value={selectedHistVar || ''}
                onChange={(e) => setSelectedHistVar(e.target.value)}
                className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-800 bg-stone-50 focus:outline-none"
              >
                {summaries
                  .filter((s) => s.type === 'numeric' || s.type === 'binary')
                  .map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Mini Bar Histogram Chart */}
          <div className="pt-2 pb-1">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-end h-40 border-b border-stone-200 pb-2">
              {(() => {
                const maxCount = Math.max(...activeHistSummary.histogram.map((b) => b.count), 1);
                return activeHistSummary.histogram.map((bin, bIdx) => {
                  const heightPercent = (bin.count / maxCount) * 100;
                  return (
                    <div key={bIdx} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] text-stone-500 font-mono mb-1 group-hover:text-amber-900 font-semibold">
                        {bin.count}
                      </span>
                      <div
                        className="w-full bg-amber-200 group-hover:bg-amber-500 rounded-t transition-all"
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        title={`${bin.bin}: ${bin.count} clientes`}
                      />
                      <span className="text-[9px] text-stone-400 mt-1 truncate w-full text-center group-hover:text-stone-700">
                        {bin.min.toFixed(0)}-{bin.max.toFixed(0)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
              <span>Mínimo: {activeHistSummary.min?.toFixed(1)}</span>
              <span className="font-semibold text-stone-600">
                Media: {activeHistSummary.mean?.toFixed(1)} | Mediana: {activeHistSummary.median?.toFixed(1)}
              </span>
              <span>Máximo: {activeHistSummary.max?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Explainer */}
      <ConceptExplainer title="¿Por qué la asimetría es clave para la segmentación?">
        <p>
          En casi todas las empresas, variables como <strong>gasto, minutos consumidos o saldo</strong> tienen una asimetría alta hacia la derecha: la mayoría de los clientes gasta montos moderados, pero un puñado de clientes gasta cifras enormes.
        </p>
        <p>
          Si no corregimos esta asimetría, esos pocos clientes con valores gigantes dominarán todo el cálculo de distancias de k-means y "secuestrarán" los grupos. En el <strong>Paso 5</strong> te mostraremos cómo suavizar esto de forma transparente con la función matemática <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-xs">log(1 + x)</code>.
        </p>
      </ConceptExplainer>

      {/* Nav buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Cargar Datos
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 4 (Elegir Variables) →
        </button>
      </div>
    </div>
  );
};
