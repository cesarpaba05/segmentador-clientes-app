import React from 'react';

interface BoxPlotStats {
  clusterId: number;
  clusterName: string;
  count: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  mean: number;
}

interface BoxPlotChartProps {
  stats: BoxPlotStats[];
  varName: string;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({ stats, varName }) => {
  if (!stats || stats.length === 0) return null;

  // Global min and max across all clusters to normalize coordinates
  const allMins = stats.map((s) => s.min);
  const allMaxs = stats.map((s) => s.max);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const range = globalMax - globalMin || 1;

  const width = 640;
  const height = stats.length * 68 + 40;
  const leftPadding = 140;
  const rightPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;

  const scale = (val: number) => {
    return leftPadding + ((val - globalMin) / range) * chartWidth;
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
        <span className="font-medium text-stone-700">Diagrama de Caja por Grupo: {varName.replace(/_/g, ' ')}</span>
        <span>Rango: [{globalMin.toFixed(1).replace('.', ',')} a {globalMax.toFixed(1).replace('.', ',')}]</span>
      </div>

      <svg width={width} height={height} className="mx-auto block text-stone-700">
        {/* Axis line */}
        <line
          x1={leftPadding}
          y1={height - 25}
          x2={width - rightPadding}
          y2={height - 25}
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Axis Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const val = globalMin + pct * range;
          const x = leftPadding + pct * chartWidth;
          return (
            <g key={idx}>
              <line x1={x} y1={height - 25} x2={x} y2={height - 20} stroke="#94a3b8" strokeWidth="1.5" />
              <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
                {val.toFixed(1).replace('.', ',')}
              </text>
            </g>
          );
        })}

        {/* Boxplot rows */}
        {stats.map((s, idx) => {
          const y = 30 + idx * 64;
          const xMin = scale(s.min);
          const xQ1 = scale(s.q1);
          const xMed = scale(s.median);
          const xQ3 = scale(s.q3);
          const xMax = scale(s.max);

          return (
            <g key={s.clusterId} className="group">
              {/* Row label */}
              <text
                x={leftPadding - 12}
                y={y + 5}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="#334155"
              >
                {s.clusterName.length > 22 ? s.clusterName.slice(0, 21) + '…' : s.clusterName}
              </text>

              {/* Whisker line */}
              <line
                x1={xMin}
                y1={y}
                x2={xMax}
                y2={y}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />

              {/* Min and Max whiskers caps */}
              <line x1={xMin} y1={y - 8} x2={xMin} y2={y + 8} stroke="#475569" strokeWidth="2" />
              <line x1={xMax} y1={y - 8} x2={xMax} y2={y + 8} stroke="#475569" strokeWidth="2" />

              {/* Box IQR (Q1 to Q3) */}
              <rect
                x={Math.min(xQ1, xQ3)}
                y={y - 14}
                width={Math.max(2, Math.abs(xQ3 - xQ1))}
                height="28"
                rx="4"
                fill="#e0e7ff"
                stroke="#4338ca"
                strokeWidth="1.5"
              />

              {/* Median Line */}
              <line
                x1={xMed}
                y1={y - 14}
                x2={xMed}
                y2={y + 14}
                stroke="#312e81"
                strokeWidth="2.5"
              />

              {/* Values hover text / helper */}
              <text
                x={xMed}
                y={y - 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#312e81"
              >
                Med: {s.median.toFixed(1).replace('.', ',')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
