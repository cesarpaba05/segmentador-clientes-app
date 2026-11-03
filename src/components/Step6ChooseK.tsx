import React from 'react';
import { KScanResult } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { GitBranch, Sparkles, AlertCircle } from 'lucide-react';

interface Step6ChooseKProps {
  scanResults: KScanResult[];
  selectedK: number;
  recommendedK: number;
  onChangeK: (k: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isCalculating?: boolean;
}

export const Step6ChooseK: React.FC<Step6ChooseKProps> = ({
  scanResults,
  selectedK,
  recommendedK,
  onChangeK,
  onNext,
  onPrev,
  isCalculating = false,
}) => {
  const currentResult = scanResults.find((r) => r.k === selectedK);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 6 de 10</span>
          <span>·</span>
          <span>Diagnóstico de Grupos</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          ¿Cuántos Grupos Formar? (Elección de K)
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Evaluamos matemáticamente entre 2 y 10 grupos mediante el <strong>Método del Codo</strong> (Inercia / Suma de Cuadrados) y el <strong>Coeficiente de Silueta Promedio</strong>. Tú tienes la última palabra según la capacidad de tu equipo comercial.
        </p>
      </div>

      {/* Recommended K Callout & Selector */}
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50/60 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-200 text-amber-900 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-950">
                Sugerencia estadística del algoritmo: k = {recommendedK} grupos
              </h3>
              <span className="text-[11px] font-semibold bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded">
                Equilibrio óptimo
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1 max-w-xl">
              Basado en la desaceleración de la inercia (codo) y la cohesión de silueta. En mercadeo y operaciones, una segmentación manejable suele tener entre <strong>3 y 6 grupos</strong>.
            </p>
          </div>
        </div>

        {/* Interactive Selector */}
        <div className="bg-white p-3 rounded-lg border border-amber-300 flex items-center gap-3 shrink-0">
          <label htmlFor="k-selector" className="text-xs font-bold text-stone-800">
            Tu elección final de K:
          </label>
          <select
            id="k-selector"
            value={selectedK}
            onChange={(e) => onChangeK(Number(e.target.value))}
            className="rounded-md border border-stone-300 bg-stone-50 px-3 py-1.5 font-bold text-sm text-amber-950 focus:outline-none focus:border-amber-600"
          >
            {scanResults.map((r) => (
              <option key={r.k} value={r.k}>
                k = {r.k} {r.k === recommendedK ? '(Recomendado)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Elbow Chart (WCSS / Inertia) */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                1. Gráfico del Codo (Inercia / Suma de Cuadrados)
              </h3>
              <p className="text-[11px] text-stone-500">
                Busca el punto donde la curva se dobla y la ganancia marginal disminuye.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">
              k actual: <strong>{selectedK}</strong>
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scanResults} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={11} label={{ value: 'Número de Grupos (k)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toFixed(1), 'Inercia (WCSS)']}
                  labelFormatter={(k) => `k = ${k} grupos`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="inertia"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#d97706' }}
                  activeDot={{ r: 6 }}
                />
                {currentResult && (
                  <ReferenceDot
                    x={currentResult.k}
                    y={currentResult.inertia}
                    r={7}
                    fill="#b45309"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 text-center">
            Inercia para k={selectedK}: <strong className="font-mono text-stone-800">{currentResult?.inertia.toFixed(1)}</strong>
          </div>
        </div>

        {/* Chart 2: Average Silhouette Coefficient */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                2. Coeficiente de Silueta Promedio
              </h3>
              <p className="text-[11px] text-stone-500">
                Mide qué tan nítida y separada es la división de grupos (mayor es mejor).
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Escala de -1 a +1
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scanResults} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={11} label={{ value: 'Número de Grupos (k)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toFixed(3), 'Silueta Promedio']}
                  labelFormatter={(k) => `k = ${k} grupos`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="silhouette"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
                {currentResult && (
                  <ReferenceDot
                    x={currentResult.k}
                    y={currentResult.silhouette}
                    r={7}
                    fill="#3730a3"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 text-center">
            Silueta para k={selectedK}: <strong className="font-mono text-stone-800">{currentResult?.silhouette.toFixed(3)}</strong>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <ConceptExplainer title="¿Cómo balancear la matemática con la realidad de mercadeo?">
        <p>
          <strong>El Gráfico del Codo:</strong> A medida que agregas más grupos, la inercia (error total dentro de cada grupo) siempre disminuye. Si tuvieras tantos grupos como clientes, el error sería cero, pero eso no segmenta nada. Por eso buscamos el punto de inflexión donde la ganancia de agregar un grupo adicional ya es mínima.
        </p>
        <p>
          <strong>La Silueta Promedio:</strong> Si un cliente está muy cerca de los miembros de su propio grupo y muy lejos de los otros grupos, su silueta se acerca a +1. Un pico en la silueta indica que esa partición es natural y orgánica.
        </p>
        <p>
          <strong>El filtro de negocio:</strong> Recuerda: <em>"El número de grupos lo decide el negocio, no solo la estadística"</em>. Si 4 grupos tienen una interpretación comercial nítida que tu equipo puede comercializar de inmediato, 4 es mucho mejor que 7, aunque la matemática sugiera 7.
        </p>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Preparar Datos
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 7 (Resultados con k = {selectedK}) →
        </button>
      </div>
    </div>
  );
};
