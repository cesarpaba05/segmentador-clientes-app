import React, { useState } from 'react';
import {
  BusinessContext,
  CategoricalProfileMetric,
  GroupStrategy,
  KMeansResult,
  NumericProfileMetric,
} from '../types/segmentation';
import { downloadEnrichedCSV, downloadHTMLReport, openPrintableReport } from '../utils/exporter';
import { ConceptExplainer } from '../components/ConceptExplainer';
import {
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface Step10ExportProps {
  originalRows: Record<string, any>[];
  context: BusinessContext;
  kmeansResult: KMeansResult;
  strategies: GroupStrategy[];
  catProfiles: CategoricalProfileMetric[];
  numProfiles: NumericProfileMetric[];
  onPrev: () => void;
  onReset: () => void;
}

export const Step10Export: React.FC<Step10ExportProps> = ({
  originalRows,
  context,
  kmeansResult,
  strategies,
  catProfiles,
  numProfiles,
  onPrev,
  onReset,
}) => {
  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);

  const handleDownloadCSV = () => {
    downloadEnrichedCSV(
      originalRows,
      kmeansResult.clusterAssignments,
      kmeansResult.clusterNames,
      `clientes_segmentados_${context.sector.slice(0, 10).toLowerCase().replace(/\s+/g, '_') || 'datos'}.csv`
    );
    setCsvDownloaded(true);
  };

  const handleDownloadReport = () => {
    downloadHTMLReport(
      context,
      kmeansResult,
      strategies,
      catProfiles,
      numProfiles,
      `informe_ejecutivo_segmentacion_${context.sector.slice(0, 10).toLowerCase().replace(/\s+/g, '_') || 'negocio'}.html`
    );
    setReportDownloaded(true);
  };

  const handleOpenPrint = () => {
    openPrintableReport(context, kmeansResult, strategies, catProfiles, numProfiles);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 10 de 10</span>
          <span>·</span>
          <span>Exportación y Entrega Ejecutiva</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Exportar Base de Datos e Informe Ejecutivo
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          ¡Felicitaciones! Has completado el ciclo integral de segmentación. Descarga la base enriquecida para tu CRM o herramientas publicitarias, y el informe ejecutivo listo para presentar a la dirección.
        </p>
      </div>

      {/* Big Download Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: CSV Base with Group Columns */}
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              {csvDownloaded && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" /> Descargado
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-stone-900">
              1. Base Original Enriquecida (.CSV)
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Tu archivo original de <strong>{originalRows.length} registros</strong> con dos columnas adicionales al final:
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-emerald-200 text-xs font-mono text-emerald-950 space-y-1">
              <div>• <span className="font-bold">grupo</span>: "Grupo 1", "Grupo 2", etc.</div>
              <div>• <span className="font-bold">nombre_grupo</span>: Nombres comerciales definidos.</div>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Compatible con Microsoft Excel, Google Sheets, Power BI, HubSpot, Salesforce y Meta Ads.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="mt-6 w-full rounded-lg bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Descargar Base Enriquecida (.CSV con tildes y UTF-8)
          </button>
        </div>

        {/* Card 2: Executive Report in HTML & PDF */}
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <FileText className="h-6 w-6" />
              </div>
              {reportDownloaded && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" /> Descargado
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-stone-900">
              2. Informe Ejecutivo de Resultados (HTML / PDF)
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Documento estructurado con diseño editorial profesional que incluye:
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-amber-200 text-xs text-amber-950 space-y-1">
              <div>✓ Contexto estratégico inicial y objetivos planteados.</div>
              <div>✓ Tabla de centroides con mapa de calor estandarizado.</div>
              <div>✓ Pruebas Chi-cuadrado y validación de variables de perfil.</div>
              <div>✓ Fichas completas de Estrategia 4P y Pirámide de Maslow.</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex-1 rounded-lg bg-amber-600 py-2.5 px-3 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar Informe HTML
            </button>
            <button
              type="button"
              onClick={handleOpenPrint}
              className="rounded-lg bg-stone-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Recap Summary Box */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          Ficha Resumen del Proyecto
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Sector</span>
            <div className="font-semibold text-stone-900 mt-0.5 truncate">
              {context.sector || 'Comercial'}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Clientes Analizados</span>
            <div className="font-semibold text-stone-900 mt-0.5 font-mono">
              {originalRows.length} registros
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Número de Grupos</span>
            <div className="font-semibold text-stone-900 mt-0.5 font-mono">
              k = {kmeansResult.k} segmentos
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Variables Activas</span>
            <div className="font-semibold text-stone-900 mt-0.5 font-mono">
              {kmeansResult.behaviorVars.length} de comportamiento
            </div>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <ConceptExplainer title="¿Cómo conectar este CSV con tus herramientas de ventas y marketing?">
        <p>
          Una segmentación solo cobra vida cuando entra en acción en tus herramientas del día a día:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-1 text-xs">
          <li>
            <strong>En tu CRM (HubSpot, Salesforce, Zoho):</strong> Importa el archivo actualizando tus contactos. Usa el campo <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">nombre_grupo</code> para crear listas dinámicas y asignar leads VIP al equipo comercial senior.
          </li>
          <li>
            <strong>En Meta Ads y Google Ads:</strong> Sube la base como <em>Audiencias Personalizadas (Custom Audiences)</em> separando cada grupo para mostrar anuncios con el mensaje clave sugerido en el Paso 9.
          </li>
          <li>
            <strong>En Email Marketing:</strong> Configura secuencias de nutrición donde los clientes de bajo consumo reciban tutoriales y tips de ahorro, y los clientes estrella reciban invitaciones a lanzamientos privados.
          </li>
        </ul>
      </ConceptExplainer>

      {/* Footer Nav & Reset */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Estrategia de Marketing
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Comenzar Nueva Segmentación
        </button>
      </div>
    </div>
  );
};
