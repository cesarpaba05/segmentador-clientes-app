import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { parseCSVData, parseExcelData, generateSampleBusinessData } from '../utils/dataParser';
import { ConceptExplainer } from '../components/ConceptExplainer';

interface Step2DataUploadProps {
  data: Record<string, any>[];
  headers: string[];
  fileName?: string;
  onDataLoaded: (data: Record<string, any>[], fileName: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2DataUpload: React.FC<Step2DataUploadProps> = ({
  data,
  headers,
  fileName,
  onDataLoaded,
  onNext,
  onPrev,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const parsed = await parseCSVData(text);
        if (parsed.length === 0) {
          throw new Error('El archivo CSV está vacío o no tiene encabezados válidos.');
        }
        onDataLoaded(parsed, file.name);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const parsed = parseExcelData(buffer);
        if (parsed.length === 0) {
          throw new Error('La hoja de cálculo de Excel está vacía.');
        }
        onDataLoaded(parsed, file.name);
      } else {
        throw new Error('Formato no soportado. Por favor sube un archivo .CSV o .XLSX.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar el archivo. Verifica el formato.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleLoadSample = () => {
    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      const sample = generateSampleBusinessData();
      onDataLoaded(sample, 'clientes_telecom_muestra.csv');
      setLoading(false);
    }, 150);
  };

  const hasData = data && data.length > 0;
  const previewRows = hasData ? data.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 2 de 10</span>
          <span>·</span>
          <span>Ingesta de Información</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Cargar Archivo de Datos
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Sube tu archivo de clientes en formato CSV (delimitado por coma o punto y coma) o libro de Excel (.xlsx). Todo el cálculo se realiza localmente en tu navegador sin enviar datos a ningún servidor.
        </p>
      </div>

      {/* Upload Zone & Quick Sample Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`md:col-span-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center min-h-[170px] ${
            isDragOver
              ? 'border-amber-500 bg-amber-50/60'
              : 'border-stone-300 bg-white hover:border-amber-400 hover:bg-stone-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-3">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-stone-800">
            {loading ? 'Procesando archivo...' : 'Haz clic o arrastra tu archivo aquí'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Admite CSV (separador coma/punto y coma, decimales coma/punto) y Excel (.xlsx)
          </p>
        </div>

        {/* Instant Sample Card */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              <Database className="h-4 w-4 text-amber-600" />
              ¿Sin archivo a mano?
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mt-1">
              Prueba la aplicación de inmediato con una base realista de <strong>220 clientes de Telecomunicaciones</strong> que incluye consumo de datos, minutos de voz, gasto mensual, servicios contratados y perfil sociodemográfico.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            Cargar Datos de Ejemplo (220 clientes)
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <strong>Error al cargar:</strong> {errorMsg}
          </div>
        </div>
      )}

      {/* Loaded summary banner */}
      {hasData && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-200 text-emerald-800">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Archivo cargado con éxito: <span className="font-mono text-xs">{fileName || 'datos.csv'}</span>
              </div>
              <div className="text-xs text-emerald-800 mt-0.5 flex items-center gap-2">
                <span><strong>{data.length}</strong> filas (clientes)</span>
                <span>·</span>
                <span><strong>{headers.length}</strong> columnas (variables)</span>
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
            Listo para analizar variables
          </span>
        </div>
      )}

      {/* First 5 rows preview table */}
      {hasData && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-stone-500" />
              Vista previa: Primeras 5 filas
            </h3>
            <span className="text-xs text-stone-500">
              Mostrando 5 de {data.length} registros
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-semibold">
                  <th className="py-2 px-3 border-r border-stone-200 text-stone-400 w-12 text-center">#</th>
                  {headers.map((h) => (
                    <th key={h} className="py-2 px-3 whitespace-nowrap font-medium text-stone-800">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-mono text-[11px]">
                {previewRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-amber-50/30">
                    <td className="py-2 px-3 text-stone-400 border-r border-stone-200 text-center font-sans">
                      {rowIdx + 1}
                    </td>
                    {headers.map((h) => (
                      <td key={h} className="py-2 px-3 whitespace-nowrap">
                        {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-stone-300 italic">vacío</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explainer */}
      <ConceptExplainer title="¿Cómo debe ser la tabla para que k-means funcione bien?">
        <p>
          En la analítica de clientes, cada <strong>fila</strong> debe representar a un cliente único (o cuenta, o contrato), y cada <strong>columna</strong> representa una característica medible de ese cliente.
        </p>
        <p>
          Si tienes una columna con el nombre o ID del cliente, no te preocupes: en el Paso 4 te permitiremos excluir identificadores para que el algoritmo trabaje únicamente con métricas de comportamiento (como consumo, gasto o frecuencia).
        </p>
      </ConceptExplainer>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Contexto
        </button>

        <button
          type="button"
          disabled={!hasData}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
            hasData
              ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          Continuar al Paso 3 (Entender Variables) →
        </button>
      </div>
    </div>
  );
};
