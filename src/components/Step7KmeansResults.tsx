import React, { useState } from 'react';
import { KMeansResult } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Edit2, Check, Sparkles, Flame, Snowflake, Award } from 'lucide-react';

interface Step7KmeansResultsProps {
  kmeansResult: KMeansResult;
  onUpdateClusterName: (clusterIdx: number, newName: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PALETTE = ['#0284c7', '#d97706', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export const Step7KmeansResults: React.FC<Step7KmeansResultsProps> = ({
  kmeansResult,
  onUpdateClusterName,
  onNext,
  onPrev,
}) => {
  const [editingCluster, setEditingCluster] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');

  const { centroids, behaviorVars, clusterSizes, clusterNames, maxAbsVarPerCluster } = kmeansResult;
  const totalCustomers = clusterSizes.reduce((acc, c) => acc + c.count, 0);

  const handleStartEdit = (clusterIdx: number) => {
    setEditingCluster(clusterIdx);
    setTempName(clusterNames[clusterIdx] || `Grupo ${clusterIdx + 1}`);
  };

  const handleSaveEdit = (clusterIdx: number) => {
    if (tempName.trim()) {
      onUpdateClusterName(clusterIdx, tempName.trim());
    }
    setEditingCluster(null);
  };

  // Helper for Heatmap Color
  // Standardized values typically between -3 and +3
  const getHeatmapColor = (val: number) => {
    if (val >= 1.5) return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    if (val >= 0.7) return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
    if (val >= 0.2) return 'bg-orange-50 text-orange-800 border-orange-200';
    if (val <= -1.5) return 'bg-sky-100 text-sky-950 border-sky-300 font-bold';
    if (val <= -0.7) return 'bg-sky-50 text-sky-900 border-sky-200 font-semibold';
    if (val <= -0.2) return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-stone-50 text-stone-700 border-stone-200';
  };

  // Prepare chart data
  const chartData = clusterSizes.map((c, idx) => ({
    name: `G${idx + 1}`,
    fullName: clusterNames[idx] || `Grupo ${idx + 1}`,
    count: c.count,
    percent: c.percent,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 7 de 10</span>
          <span>·</span>
          <span>Interpretación de Centroides</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Resultados de K-Means y Nombres de Grupos
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          La <strong>tabla de centroides</strong> es el mapa genético de tus segmentos. Revela en qué variables destaca o flaquea cada grupo. Hemos propuesto nombres descriptivos automáticos que puedes editar con un clic.
        </p>
      </div>

      {/* Cluster Sizes Bar Chart & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Distribución del Tamaño de los Grupos (Total: {totalCustomers} clientes)
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Porcentaje sobre la base
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.count} clientes (${Number(val).toFixed(1)}%)`,
                    item.payload.fullName,
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-2.5 overflow-y-auto max-h-[290px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 pb-2 border-b border-stone-100">
            Resumen de Segmentos
          </h3>
          {clusterSizes.map((c, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                />
                <div>
                  <div className="text-xs font-bold text-stone-900 leading-tight">
                    {clusterNames[idx] || `Grupo ${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Grupo {idx + 1}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-stone-900 font-mono">
                  {c.count}
                </div>
                <div className="text-[10px] text-stone-500">
                  {c.percent.toFixed(1).replace('.', ',')}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centroids Table (Heatmap) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Tabla de Centroides (Mapa de Calor Estandarizado)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Valores en desviaciones estándar (<span className="font-mono text-stone-700">0.00σ = promedio global</span>). Destacamos con recuadro dorado el atributo más extremo de cada grupo.
            </p>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-sky-800">
              <Snowflake className="h-3.5 w-3.5" /> Negativo (-σ): Consume menos
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-rose-800">
              <Flame className="h-3.5 w-3.5" /> Positivo (+σ): Consume más
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/90 border-b border-stone-200 text-stone-700 font-semibold">
                <th className="py-3 px-3.5 w-72">Grupo y Nombre Comercial</th>
                {behaviorVars.map((v) => (
                  <th key={v} className="py-3 px-3 text-center whitespace-nowrap">
                    {v.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {centroids.map((row, cIdx) => {
                const isEditing = editingCluster === cIdx;
                const size = clusterSizes.find((c) => c.cluster === cIdx);
                const maxInfo = maxAbsVarPerCluster[cIdx];

                return (
                  <tr key={cIdx} className="hover:bg-stone-50/50 transition-colors">
                    {/* Cluster Name & Edit */}
                    <td className="py-3 px-3.5 bg-stone-50/70 border-r border-stone-200">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full rounded border border-amber-400 px-2 py-1 text-xs font-semibold focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cIdx)}
                            className="p-1 rounded bg-amber-600 text-white hover:bg-amber-700 shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between group">
                          <div>
                            <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                style={{ backgroundColor: PALETTE[cIdx % PALETTE.length] }}
                              />
                              <span className="text-[10px] text-stone-500 font-mono font-semibold">G{cIdx + 1}:</span>
                              <span className="font-bold text-stone-900">{clusterNames[cIdx] || `Grupo ${cIdx + 1}`}</span>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5 pl-4">
                              {size?.count} clientes ({size?.percent.toFixed(1).replace('.', ',')}%)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cIdx)}
                            className="opacity-40 group-hover:opacity-100 text-stone-500 hover:text-amber-800 p-1 rounded"
                            title="Editar nombre del grupo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Centroid cells */}
                    {row.map((val, vIdx) => {
                      const isMaxAbs = maxInfo && maxInfo.varIndex === vIdx;
                      const cellColor = getHeatmapColor(val);

                      return (
                        <td
                          key={vIdx}
                          className={`py-3 px-3 text-center font-mono text-[11px] border border-stone-100 ${cellColor} ${
                            isMaxAbs ? 'ring-2 ring-amber-500 ring-inset shadow-xs' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>
                              {val >= 0 ? '+' : ''}
                              {val.toFixed(2)}σ
                            </span>
                            {isMaxAbs && (
                              <span title="Variable dominante (mayor desviación absoluta en este grupo)">
                                <Award className="h-3 w-3 text-amber-700 shrink-0" />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainer */}
      <ConceptExplainer title="¿Cómo interpretar los signos (+ y -) de la tabla de centroides?">
        <p>
          La tabla de centroides muestra la <strong>"huella digital"</strong> de cada grupo en desviaciones estándar:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-1 text-xs">
          <li>
            <strong>Valor Positivo (+):</strong> Este grupo realiza esa actividad <em>más que el cliente promedio</em>. Por ejemplo, <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">+1.20σ</code> en datos móviles significa uso intensivo de internet.
          </li>
          <li>
            <strong>Valor Negativo (-):</strong> Este grupo realiza esa actividad <em>menos que el cliente promedio</em>. Por ejemplo, <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">-0.85σ</code> en minutos de voz significa que casi no hace llamadas tradicionales.
          </li>
          <li>
            <strong>El icono de medalla (⭐):</strong> Señala la variable con mayor desvío absoluto de cada fila. Es la variable que define el comportamiento clave y nos sirve para bautizar y posicionar al segmento.
          </li>
        </ul>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Diagnóstico de K
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 8 (Perfil de los Grupos) →
        </button>
      </div>
    </div>
  );
};
