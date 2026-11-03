import Papa from 'papaparse';
import {
  BusinessContext,
  CategoricalProfileMetric,
  GroupStrategy,
  KMeansResult,
  NumericProfileMetric,
} from '../types/segmentation';

/**
 * Formats a value for Spanish Excel: uses comma as decimal separator
 */
function formatForSpanishExcel(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val;
    // For non-integers, replace dot with comma
    return String(val).replace('.', ',');
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Check if it's a numeric string with a dot like "123.45"
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return trimmed.replace('.', ',');
    }
  }
  return val;
}

/**
 * Downloads the enriched dataset with 'grupo' and 'nombre_grupo' columns as CSV
 * using semicolon delimiter and comma decimal separator for Spanish Excel compatibility.
 */
export function downloadEnrichedCSV(
  originalRows: Record<string, any>[],
  clusterAssignments: number[],
  clusterNames: Record<number, string>,
  filename = 'clientes_segmentados.csv'
) {
  const enrichedData = originalRows.map((row, idx) => {
    const cluster = clusterAssignments[idx];
    const groupNum = cluster !== undefined ? cluster + 1 : '';
    const groupName = cluster !== undefined ? (clusterNames[cluster] || `Grupo ${groupNum}`) : '';

    const formattedRow: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      formattedRow[key] = formatForSpanishExcel(row[key]);
    }

    formattedRow['grupo'] = groupNum !== '' ? `Grupo ${groupNum}` : '';
    formattedRow['nombre_grupo'] = groupName;

    return formattedRow;
  });

  const csvContent = Papa.unparse(enrichedData, {
    quotes: true,
    delimiter: ';', // semicolon for Spanish regional settings
  });

  // Prepend UTF-8 BOM so Excel opens accents and special characters without encoding glitches
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive HTML report ready for viewing and printing/saving as PDF
 */
export function generateHTMLReport(
  context: BusinessContext,
  kmeansResult: KMeansResult,
  strategies: GroupStrategy[],
  catProfiles: CategoricalProfileMetric[],
  numProfiles: NumericProfileMetric[]
): string {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const { centroids, behaviorVars, clusterSizes } = kmeansResult;
  const total = clusterSizes.reduce((a, b) => a + b.count, 0);

  // Helper for Spanish formatted decimals
  const fmtNum = (n: number, decimals = 2) => n.toFixed(decimals).replace('.', ',');
  const fmtPValue = (p: number) => (p < 0.001 ? '< 0,001' : p.toFixed(3).replace('.', ','));

  // Build Centroids HTML
  const centroidHeaders = behaviorVars.map((v) => `<th>${v.replace(/_/g, ' ')}</th>`).join('');
  const centroidRows = centroids
    .map((row, cIdx) => {
      const groupName = kmeansResult.clusterNames[cIdx] || `Grupo ${cIdx + 1}`;
      const size = clusterSizes.find((c) => c.cluster === cIdx);
      const cells = row
        .map((val) => {
          const bg = val > 0.4 ? '#fee2e2' : val < -0.4 ? '#dbeafe' : '#f8fafc';
          const color = val > 0.4 ? '#991b1b' : val < -0.4 ? '#1e40af' : '#334155';
          return `<td style="background-color: ${bg}; color: ${color}; font-weight: ${Math.abs(val) > 0.6 ? '700' : '500'}; text-align: center;">${val >= 0 ? '+' : ''}${fmtNum(val)}σ</td>`;
        })
        .join('');

      return `
      <tr>
        <td><strong>${groupName}</strong><br><small style="color: #64748b;">${size?.count || 0} clientes (${fmtNum(size?.percent || 0, 1)}%)</small></td>
        ${cells}
      </tr>
    `;
    })
    .join('');

  // Build Strategy Sheets
  const strategyCards = strategies
    .map((strat) => {
      return `
      <div class="strategy-card">
        <div class="strategy-header">
          <div>
            <h3>${strat.clusterName}</h3>
            <p class="subtitle">${strat.customerCount} clientes (${fmtNum(strat.customerPercent, 1)}% de la base) · Prioridad Comercial: <strong>${strat.quadrant}</strong></p>
          </div>
          <span class="badge ${strat.quadrant.toLowerCase().replace(/\s+/g, '-')}">${strat.quadrant}</span>
        </div>

        <p class="rationale"><em>${strat.quadrantDescription}</em></p>

        <div class="traits-box">
          <strong>Rasgos y Variables Dominantes de este Segmento:</strong>
          <ul>
            ${strat.dominantTraits.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        </div>

        <div class="grid-2">
          <div class="card-section">
            <h4>Motivación del Consumidor (Pirámide de Maslow)</h4>
            <p><strong>1. Necesidad:</strong> ${strat.maslow.need}</p>
            <p><strong>2. Deseo:</strong> ${strat.maslow.desire}</p>
            <p><strong>3. Demanda:</strong> ${strat.maslow.demand}</p>
          </div>

          <div class="card-section">
            <h4>Estrategia 4P Diferenciada</h4>
            <p><strong>Producto:</strong> ${strat.fourPs.product}</p>
            <p><strong>Precio:</strong> ${strat.fourPs.price}</p>
            <p><strong>Plaza:</strong> ${strat.fourPs.place}</p>
            <p><strong>Promoción:</strong> ${strat.fourPs.promotion}</p>
          </div>
        </div>

        <div class="grid-2" style="margin-top: 12px;">
          <div class="card-section">
            <h4>Plan de Comunicación</h4>
            <p><strong>Mensaje clave:</strong> "${strat.communicationPlan.keyMessage}"</p>
            <p><strong>Canales prioritarios:</strong> ${strat.communicationPlan.channels.join(', ')}</p>
            <p><strong>Tono de comunicación:</strong> ${strat.communicationPlan.tone}</p>
          </div>

          <div class="card-section">
            <h4>Diseño de Oferta e Innovación</h4>
            <p><strong>Diseño de plan sugerido:</strong> ${strat.productPlanDesign}</p>
            <p><strong>Idea de nuevo producto o servicio:</strong> ${strat.newProductIdea}</p>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  // Build Categorical Profiles HTML
  const catProfileTables = catProfiles
    .map((prof) => {
      const catHeaders = prof.contingencyTable.categories.map((c) => `<th>${c}</th>`).join('');
      const groupRows = prof.contingencyTable.groups
        .map((g) => {
          const cName = kmeansResult.clusterNames[g.clusterId] || `Grupo ${g.clusterId + 1}`;
          const cells = g.counts
            .map((cnt, i) => `<td>${cnt} (${fmtNum(g.rowPercents[i], 1)}%)</td>`)
            .join('');
          return `<tr><td><strong>${cName}</strong></td>${cells}<td><strong>${g.total}</strong></td></tr>`;
        })
        .join('');

      return `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h4>Variable Categórica: ${prof.varName.replace(/_/g, ' ')}</h4>
          <span style="font-size: 13px; color: ${prof.isSignificant ? '#047857' : '#64748b'}; font-weight: 600;">
            ${prof.isSignificant ? '✓ Sí diferencia los grupos' : '– No diferencia los grupos'} (Chi² = ${fmtNum(prof.chiSquare)}, gl = ${prof.degreesOfFreedom}, p-value = ${fmtPValue(prof.pValue)})
          </span>
        </div>
        <table>
          <thead><tr><th>Grupo</th>${catHeaders}<th>Total</th></tr></thead>
          <tbody>${groupRows}</tbody>
        </table>
      </div>
    `;
    })
    .join('');

  // Build Numeric Profiles HTML with Kruskal-Wallis test
  const numProfileTables = numProfiles
    .map((prof) => {
      const groupRows = prof.clusterStats
        .map((st) => {
          const cName = kmeansResult.clusterNames[st.clusterId] || `Grupo ${st.clusterId + 1}`;
          return `
          <tr>
            <td><strong>${cName}</strong></td>
            <td style="text-align: right; font-weight: bold;">${fmtNum(st.median, 1)}</td>
            <td style="text-align: right;">${fmtNum(st.q1, 1)}</td>
            <td style="text-align: right;">${fmtNum(st.q3, 1)}</td>
            <td style="text-align: right;">${fmtNum(st.min, 1)}</td>
            <td style="text-align: right;">${fmtNum(st.max, 1)}</td>
            <td style="text-align: right;">${st.count}</td>
          </tr>
        `;
        })
        .join('');

      return `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h4>Variable Numérica: ${prof.varName.replace(/_/g, ' ')}</h4>
          <span style="font-size: 13px; color: ${prof.isSignificant ? '#047857' : '#64748b'}; font-weight: 600;">
            ${prof.isSignificant ? '✓ Sí diferencia los grupos' : '– No diferencia los grupos'} (Kruskal-Wallis H = ${fmtNum(prof.hStatistic)}, gl = ${prof.degreesOfFreedom}, p-value = ${fmtPValue(prof.pValue)})
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th style="text-align: right;">Mediana</th>
              <th style="text-align: right;">Q1 (25%)</th>
              <th style="text-align: right;">Q3 (75%)</th>
              <th style="text-align: right;">Mínimo</th>
              <th style="text-align: right;">Máximo</th>
              <th style="text-align: right;">Clientes (N)</th>
            </tr>
          </thead>
          <tbody>
            ${groupRows}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de Segmentación de Clientes</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 32px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 26px;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
    }
    .context-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }
    .context-box h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 16px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    .strategy-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }
    .strategy-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .strategy-header h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      color: #0f172a;
    }
    .subtitle {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge.proteger { background: #dcfce7; color: #166534; }
    .badge.rentabilizar { background: #fef3c7; color: #92400e; }
    .badge.desarrollar { background: #e0e7ff; color: #3730a3; }
    .badge.mantener-con-bajo-costo { background: #f1f5f9; color: #475569; }
    .traits-box {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 14px;
    }
    .traits-box ul {
      margin: 6px 0 0 18px;
      padding: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .card-section {
      background: #fafafa;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      padding: 12px;
      font-size: 13px;
    }
    .card-section h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-section p {
      margin: 4px 0;
    }
    .rationale {
      font-size: 13px;
      color: #475569;
      margin-bottom: 12px;
    }
    footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 40px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .strategy-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
      <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>

    <header>
      <h1>Informe Ejecutivo: Segmentación de Clientes</h1>
      <div class="meta">
        Fecha: ${dateStr} · Base analizada: ${total} clientes · Grupos identificados: ${kmeansResult.k}
      </div>
    </header>

    <div class="context-box">
      <h3>1. Contexto Estratégico del Negocio</h3>
      <p><strong>Sector económico:</strong> ${context.sector || 'No especificado'}</p>
      <p><strong>Problema abordado:</strong> ${context.problem || 'Optimización de segmentación y personalización'}</p>
      <p><strong>Objetivo de mercadeo:</strong> ${context.objective || 'Diseño de propuestas de valor y planes comerciales a la medida'}</p>
    </div>

    <section>
      <h2>2. Tabla de Centroides (Variables de Comportamiento Estandarizadas)</h2>
      <p style="font-size: 13px; color: #64748b;">
        Valores expresados en desviaciones estándar respecto al promedio global (0,00σ). Los valores positivos (+σ) indican un comportamiento superior al promedio; los valores negativos (-σ), inferior.
      </p>
      <table>
        <thead>
          <tr>
            <th>Grupo / Segmento</th>
            ${centroidHeaders}
          </tr>
        </thead>
        <tbody>
          ${centroidRows}
        </tbody>
      </table>
    </section>

    <section style="margin-top: 32px;">
      <h2>3. Perfil de los Grupos y Validación Estadística</h2>
      <h3 style="font-size: 16px; color: #334155; margin-top: 16px;">3.1. Variables Categóricas (Prueba Chi-Cuadrado)</h3>
      ${catProfileTables || '<p style="color: #64748b; font-size: 13px;">No se seleccionaron variables de perfil categóricas.</p>'}

      <h3 style="font-size: 16px; color: #334155; margin-top: 24px;">3.2. Variables Numéricas (Prueba Kruskal-Wallis)</h3>
      ${numProfileTables || '<p style="color: #64748b; font-size: 13px;">No se seleccionaron variables de perfil numéricas.</p>'}
    </section>

    <section style="margin-top: 32px;">
      <h2>4. Fichas de Estrategia de Marketing por Segmento</h2>
      ${strategyCards}
    </section>

    <footer>
      Desarrollado por Héctor – Introducción a la Analítica de Datos
    </footer>
  </div>
</body>
</html>
  `;
}

/**
 * Downloads the HTML report as a standalone file
 */
export function downloadHTMLReport(
  context: BusinessContext,
  kmeansResult: KMeansResult,
  strategies: GroupStrategy[],
  catProfiles: CategoricalProfileMetric[],
  numProfiles: NumericProfileMetric[],
  filename = 'informe_segmentacion_clientes.html'
) {
  const htmlContent = generateHTMLReport(
    context,
    kmeansResult,
    strategies,
    catProfiles,
    numProfiles
  );
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openPrintableReport(
  context: BusinessContext,
  kmeansResult: KMeansResult,
  strategies: GroupStrategy[],
  catProfiles: CategoricalProfileMetric[],
  numProfiles: NumericProfileMetric[]
) {
  const htmlContent = generateHTMLReport(
    context,
    kmeansResult,
    strategies,
    catProfiles,
    numProfiles
  );
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
