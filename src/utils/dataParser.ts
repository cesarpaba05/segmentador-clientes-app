import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnSummary, VariableType } from '../types/segmentation';
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateSkewness,
  generateHistogram,
} from './math';

/**
 * Normalizes number representation (handles comma vs dot decimal)
 */
export function parseFlexibleNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  let str = String(val).trim();
  if (str === '') return null;

  // Handle European/LatAm formatted numbers like 1.234,56 or 1234,56
  // Check if both '.' and ',' exist
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // e.g. 1.250,50 -> 1250.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // e.g. 1,250.50 -> 1250.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma, could be decimal or thousand. Typically decimal in LatAm/Spain
    str = str.replace(',', '.');
  }

  const num = Number(str);
  return isNaN(num) ? null : num;
}

/**
 * Analyzes parsed rows and builds column summaries
 */
export function analyzeColumns(data: Record<string, any>[]): {
  summaries: ColumnSummary[];
  headers: string[];
} {
  if (data.length === 0) return { summaries: [], headers: [] };

  const headers = Object.keys(data[0]);
  const totalRows = data.length;

  const summaries: ColumnSummary[] = headers.map((colName) => {
    let missingCount = 0;
    const rawValues: any[] = [];
    const numValues: number[] = [];
    const catCounts = new Map<string, number>();

    let allBinary = true;
    let strictlyNumeric = true;

    for (const row of data) {
      const v = row[colName];
      if (v === null || v === undefined || String(v).trim() === '') {
        missingCount++;
        continue;
      }
      rawValues.push(v);
      const strVal = String(v).trim();
      catCounts.set(strVal, (catCounts.get(strVal) || 0) + 1);

      const parsedNum = parseFlexibleNumber(v);
      if (parsedNum !== null) {
        numValues.push(parsedNum);
        if (parsedNum !== 0 && parsedNum !== 1) {
          allBinary = false;
        }
      } else {
        strictlyNumeric = false;
        allBinary = false;
      }
    }

    // Determine type
    let type: VariableType = 'categorical';
    const nonMissingCount = rawValues.length;

    if (nonMissingCount > 0) {
      if (strictlyNumeric && numValues.length === nonMissingCount) {
        if (allBinary && (catCounts.size <= 2)) {
          type = 'binary';
        } else {
          type = 'numeric';
        }
      } else if (catCounts.size <= 2 && Array.from(catCounts.keys()).every(k => ['0', '1', 'si', 'no', 'true', 'false', 'sí'].includes(k.toLowerCase()))) {
        type = 'binary';
      }
    }

    const missingPercent = (missingCount / totalRows) * 100;

    const summary: ColumnSummary = {
      name: colName,
      type,
      totalCount: totalRows,
      missingCount,
      missingPercent,
    };

    if (type === 'numeric' || (type === 'binary' && numValues.length > 0)) {
      if (numValues.length > 0) {
        const mean = calculateMean(numValues);
        const stdDev = calculateStdDev(numValues, mean);
        const median = calculateMedian(numValues);
        const min = Math.min(...numValues);
        const max = Math.max(...numValues);
        const skewness = calculateSkewness(numValues, mean, stdDev);

        summary.mean = mean;
        summary.median = median;
        summary.stdDev = stdDev;
        summary.min = min;
        summary.max = max;
        summary.skewness = skewness;
        summary.hasNegativeValues = min < 0;
        summary.histogram = generateHistogram(numValues, 8);

        // Check for suspicious negative or impossible values
        const lowerName = colName.toLowerCase();
        const nonNegativeKeywords = ['edad', 'consumo', 'gasto', 'visita', 'frecuencia', 'precio', 'monto', 'saldo', 'tickets', 'minutos', 'gb'];
        if (min < 0 && nonNegativeKeywords.some(kw => lowerName.includes(kw))) {
          summary.isImpossible = true;
          summary.impossibleReason = `Tiene valores negativos (${min.toFixed(1)}), lo cual es inusual para una variable de ${colName}.`;
        }
      }
    }

    if (type === 'categorical' || type === 'binary') {
      summary.uniqueCount = catCounts.size;
      const sortedCats = Array.from(catCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
          value,
          count,
          percent: nonMissingCount > 0 ? (count / nonMissingCount) * 100 : 0,
        }));
      summary.topCategories = sortedCats;
    }

    return summary;
  });

  return { summaries, headers };
}

/**
 * Parses raw CSV string or file
 */
export function parseCSVData(csvText: string): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      delimitersToGuess: [',', ';', '\t', '|'],
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        resolve(results.data as Record<string, any>[]);
      },
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Parses Excel file buffer
 */
export function parseExcelData(arrayBuffer: ArrayBuffer): Record<string, any>[] {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: null });
}

/**
 * Generates an authentic sample dataset for business demonstration
 */
export function generateSampleBusinessData(): Record<string, any>[] {
  // Pre-configured realistic dataset of 220 customers in Telecom / Digital Services
  const regions = ['Metropolitana', 'Norte', 'Centro', 'Occidente', 'Sur'];
  const channels = ['Sitio Web', 'App Móvil', 'Tienda Física', 'Call Center'];
  const incomeTiers = ['Bajo', 'Medio', 'Medio-Alto', 'Alto'];
  const genders = ['Femenino', 'Masculino'];

  const rows: Record<string, any>[] = [];

  // Generate 4 natural archetypes to guarantee distinct, realistic clusters
  // 1. Digital Power Users (high data, high app visits, medium voice, subscriptions)
  for (let i = 1; i <= 65; i++) {
    const id = `CLI-${1000 + rows.length + 1}`;
    rows.push({
      id_cliente: id,
      gasto_mensual_usd: +(65 + Math.random() * 45).toFixed(1),
      consumo_datos_gb: +(38 + Math.random() * 55).toFixed(1),
      minutos_voz: Math.round(180 + Math.random() * 220),
      visitas_app_mes: Math.round(24 + Math.random() * 30),
      antiguedad_meses: Math.round(8 + Math.random() * 32),
      soporte_tickets: Math.round(Math.random() * 2),
      linea_adicional: Math.random() > 0.4 ? 1 : 0,
      servicio_streaming: 1,
      seguro_dispositivo: Math.random() > 0.5 ? 1 : 0,
      factura_digital: 1,
      genero: genders[Math.floor(Math.random() * genders.length)],
      edad: Math.round(22 + Math.random() * 18),
      nivel_ingresos: Math.random() > 0.3 ? 'Medio-Alto' : 'Alto',
      region: regions[Math.floor(Math.random() * regions.length)],
      canal_adquisicion: Math.random() > 0.4 ? 'App Móvil' : 'Sitio Web',
    });
  }

  // 2. Traditional Voice/Calling (low data, high voice, older, offline store)
  for (let i = 1; i <= 55; i++) {
    const id = `CLI-${1000 + rows.length + 1}`;
    rows.push({
      id_cliente: id,
      gasto_mensual_usd: +(28 + Math.random() * 22).toFixed(1),
      consumo_datos_gb: +(2 + Math.random() * 6).toFixed(1),
      minutos_voz: Math.round(450 + Math.random() * 450),
      visitas_app_mes: Math.round(1 + Math.random() * 4),
      antiguedad_meses: Math.round(36 + Math.random() * 48),
      soporte_tickets: Math.round(Math.random() * 2),
      linea_adicional: Math.random() > 0.7 ? 1 : 0,
      servicio_streaming: 0,
      seguro_dispositivo: 0,
      factura_digital: Math.random() > 0.6 ? 1 : 0,
      genero: genders[Math.floor(Math.random() * genders.length)],
      edad: Math.round(52 + Math.random() * 22),
      nivel_ingresos: Math.random() > 0.5 ? 'Medio' : 'Bajo',
      region: regions[Math.floor(Math.random() * regions.length)],
      canal_adquisicion: Math.random() > 0.3 ? 'Tienda Física' : 'Call Center',
    });
  }

  // 3. High Value VIP / Corporate (very high spend, all services, high voice & data)
  for (let i = 1; i <= 45; i++) {
    const id = `CLI-${1000 + rows.length + 1}`;
    rows.push({
      id_cliente: id,
      gasto_mensual_usd: +(120 + Math.random() * 70).toFixed(1),
      consumo_datos_gb: +(50 + Math.random() * 60).toFixed(1),
      minutos_voz: Math.round(550 + Math.random() * 500),
      visitas_app_mes: Math.round(18 + Math.random() * 25),
      antiguedad_meses: Math.round(24 + Math.random() * 50),
      soporte_tickets: Math.round(Math.random() * 4),
      linea_adicional: 1,
      servicio_streaming: 1,
      seguro_dispositivo: 1,
      factura_digital: 1,
      genero: genders[Math.floor(Math.random() * genders.length)],
      edad: Math.round(35 + Math.random() * 25),
      nivel_ingresos: 'Alto',
      region: 'Metropolitana',
      canal_adquisicion: Math.random() > 0.5 ? 'Sitio Web' : 'Tienda Física',
    });
  }

  // 4. Low-Cost / Economical / Price Sensitive (minimal consumption, prepaid-like)
  for (let i = 1; i <= 55; i++) {
    const id = `CLI-${1000 + rows.length + 1}`;
    rows.push({
      id_cliente: id,
      gasto_mensual_usd: +(12 + Math.random() * 14).toFixed(1),
      consumo_datos_gb: +(3 + Math.random() * 8).toFixed(1),
      minutos_voz: Math.round(60 + Math.random() * 110),
      visitas_app_mes: Math.round(2 + Math.random() * 5),
      antiguedad_meses: Math.round(4 + Math.random() * 18),
      soporte_tickets: Math.round(Math.random() * 1),
      linea_adicional: 0,
      servicio_streaming: 0,
      seguro_dispositivo: 0,
      factura_digital: Math.random() > 0.4 ? 1 : 0,
      genero: genders[Math.floor(Math.random() * genders.length)],
      edad: Math.round(19 + Math.random() * 35),
      nivel_ingresos: 'Bajo',
      region: regions[Math.floor(Math.random() * regions.length)],
      canal_adquisicion: Math.random() > 0.4 ? 'Sitio Web' : 'Call Center',
    });
  }

  // Shuffle rows deterministically
  return rows.sort((a, b) => a.id_cliente.localeCompare(b.id_cliente));
}
