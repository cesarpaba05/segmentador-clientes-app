/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BusinessContext,
  ColumnSummary,
  VariableSelection,
  TransformProposal,
  KScanResult,
  KMeansResult,
  CategoricalProfileMetric,
  NumericProfileMetric,
  GroupStrategy,
} from './types/segmentation';
import {
  analyzeColumns,
  generateSampleBusinessData,
  parseFlexibleNumber,
} from './utils/dataParser';
import {
  calculateMean,
  calculateStdDev,
  calculateSkewness,
  generateHistogram,
  runKMeansWithRestarts,
  calculateSilhouetteScore,
  calculateChiSquareTest,
  calculateQuantiles,
  calculateKruskalWallis,
} from './utils/math';
import {
  proposeClusterNames,
  generateMarketingStrategies,
} from './utils/strategyGenerator';

import { StepNavigation } from './components/StepNavigation';
import { Step1Context } from './components/Step1Context';
import { Step2DataUpload } from './components/Step2DataUpload';
import { Step3VariableUnderstanding } from './components/Step3VariableUnderstanding';
import { Step4VariableSelection } from './components/Step4VariableSelection';
import { Step5DataPreparation } from './components/Step5DataPreparation';
import { Step6ChooseK } from './components/Step6ChooseK';
import { Step7KmeansResults } from './components/Step7KmeansResults';
import { Step8GroupProfiles } from './components/Step8GroupProfiles';
import { Step9MarketingStrategy } from './components/Step9MarketingStrategy';
import { Step10Export } from './components/Step10Export';

import { BarChart3, Database, Layers, CheckCircle2 } from 'lucide-react';

const STEP_NAMES = [
  'Contexto',
  'Cargar Datos',
  'Entender Variables',
  'Elegir Variables',
  'Preparar Datos',
  '¿Cuántos Grupos?',
  'Resultados K-Means',
  'Perfil Grupos',
  'Estrategia Marketing',
  'Exportar',
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);

  // Step 1 State
  const [businessContext, setBusinessContext] = useState<BusinessContext>({
    sector: 'Telecomunicaciones y Servicios Digitales',
    problem: 'Pérdida de clientes prepago y baja adopción de servicios digitales de mayor margen. La oferta actual es genérica y trata igual al cliente que solo llama y al que consume streaming intensivo.',
    objective: 'Identificar 3 a 5 grupos claros con patrones de consumo divergentes para diseñar planes comerciales diferenciados, reducir el churn y aumentar el ARPU con ventas cruzadas.',
  });

  // Step 2 State
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // Step 3 State
  const [summaries, setSummaries] = useState<ColumnSummary[]>([]);

  // Step 4 State
  const [selection, setSelection] = useState<VariableSelection>({
    behaviorVars: [],
    profileVars: [],
    combinedIndices: [],
  });

  // Step 5 State
  const [appliedTransforms, setAppliedTransforms] = useState<Record<string, boolean>>({});

  // Step 6 State
  const [kScanResults, setKScanResults] = useState<KScanResult[]>([]);
  const [selectedK, setSelectedK] = useState<number>(4);
  const [recommendedK, setRecommendedK] = useState<number>(4);
  const [isScanningK, setIsScanningK] = useState<boolean>(false);

  // Step 7 State
  const [customClusterNames, setCustomClusterNames] = useState<Record<number, string>>({});

  // Initialize sample data on first mount for instant readiness
  useEffect(() => {
    handleLoadSampleDataset();
  }, []);

  const handleLoadSampleDataset = () => {
    const sample = generateSampleBusinessData();
    handleDataLoaded(sample, 'clientes_telecomunicaciones_ejemplo.csv');
  };

  const handleDataLoaded = (data: Record<string, any>[], name: string) => {
    setRawRows(data);
    setFileName(name);
    const { summaries: analyzed, headers: cols } = analyzeColumns(data);
    setSummaries(analyzed);
    setHeaders(cols);

    // Smart default selection
    const behaviorDefaults: string[] = [];
    const profileDefaults: string[] = [];

    analyzed.forEach((col) => {
      const lower = col.name.toLowerCase();
      // Skip IDs
      if (lower.includes('id') || lower === 'codigo' || lower === 'rut' || lower === 'dni') {
        return;
      }
      if (
        lower.includes('genero') ||
        lower.includes('sexo') ||
        lower.includes('edad') ||
        lower.includes('region') ||
        lower.includes('ciudad') ||
        lower.includes('ingreso') ||
        lower.includes('canal')
      ) {
        profileDefaults.push(col.name);
      } else if (col.type === 'numeric' && behaviorDefaults.length < 5) {
        behaviorDefaults.push(col.name);
      }
    });

    setSelection({
      behaviorVars: behaviorDefaults.length >= 2 ? behaviorDefaults : cols.slice(1, 4),
      profileVars: profileDefaults,
      combinedIndices: [],
    });

    setMaxAccessibleStep((prev) => Math.max(prev, 2));
  };

  // Build matrix with behavior variables + any combined indices
  const preparedData = useMemo(() => {
    if (rawRows.length === 0 || selection.behaviorVars.length === 0) return null;

    const n = rawRows.length;
    const behaviorCols = selection.behaviorVars;

    // First, resolve row values for behavior variables (including combined index sums)
    const rawMatrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      const row = rawRows[i];
      const rowVals: number[] = [];

      for (const varName of behaviorCols) {
        // Check if it's a combined index
        const combined = selection.combinedIndices.find((idx) => idx.name === varName);
        if (combined) {
          // Sum the source binary variables
          let sumVal = 0;
          for (const sVar of combined.sourceVars) {
            const parsed = parseFlexibleNumber(row[sVar]);
            if (parsed !== null && parsed > 0) {
              sumVal += 1;
            }
          }
          rowVals.push(sumVal);
        } else {
          const parsed = parseFlexibleNumber(row[varName]);
          rowVals.push(parsed !== null ? parsed : 0);
        }
      }
      rawMatrix.push(rowVals);
    }

    // Step 5: Proposals for log(1+x)
    const proposals: TransformProposal[] = behaviorCols.map((varName, colIdx) => {
      const colValues = rawMatrix.map((r) => r[colIdx]);
      const mean = calculateMean(colValues);
      const std = calculateStdDev(colValues, mean);
      const skew = calculateSkewness(colValues, mean, std);
      const hasZeros = colValues.some((v) => v === 0);
      const hasNegatives = colValues.some((v) => v < 0);

      const suggestLog = (skew > 1 || skew < -1) && !hasNegatives;

      return {
        variable: varName,
        originalSkewness: skew,
        suggestLog1p: suggestLog,
        applyLog1p: appliedTransforms[varName] !== undefined ? appliedTransforms[varName] : suggestLog,
        explanation: `Presenta asimetría de ${skew > 0 ? '+' : ''}${skew.toFixed(2)}. ${
          suggestLog
            ? 'La transformación log(1 + x) comprimirá la cola de valores extremos. Se suma 1 porque el logaritmo de 0 no existe matemáticamente.'
            : 'Su distribución es relativamente simétrica; no es estrictamente necesaria la transformación.'
        }`,
        hasZeros,
        hasNegatives,
      };
    });

    // Apply active log(1+x) transformations
    const transformedMatrix: number[][] = rawMatrix.map((row) => {
      return row.map((val, colIdx) => {
        const prop = proposals[colIdx];
        if (prop && prop.applyLog1p) {
          return Math.log(1 + Math.max(0, val));
        }
        return val;
      });
    });

    // Calculate means and stdDevs of transformed matrix for Z-score standardization
    const m = behaviorCols.length;
    const means: number[] = [];
    const stdDevs: number[] = [];

    for (let j = 0; j < m; j++) {
      const colVals = transformedMatrix.map((r) => r[j]);
      const mean = calculateMean(colVals);
      const std = calculateStdDev(colVals, mean) || 1;
      means.push(mean);
      stdDevs.push(std);
    }

    // Standardized Matrix (Z-Score: mean 0, std 1)
    const standardizedMatrix: number[][] = transformedMatrix.map((row) => {
      return row.map((val, j) => (val - means[j]) / stdDevs[j]);
    });

    // Histograms before and after for comparison
    const histogramsBefore: Record<string, { bin: string; count: number }[]> = {};
    const histogramsAfter: Record<string, { bin: string; count: number }[]> = {};

    behaviorCols.forEach((v, idx) => {
      histogramsBefore[v] = generateHistogram(rawMatrix.map((r) => r[idx]), 8);
      histogramsAfter[v] = generateHistogram(standardizedMatrix.map((r) => r[idx]), 8);
    });

    return {
      rawMatrix,
      transformedMatrix,
      standardizedMatrix,
      proposals,
      behaviorCols,
      histogramsBefore,
      histogramsAfter,
    };
  }, [rawRows, selection, appliedTransforms]);

  // Compute K scan (k=2 to 10) when entering Step 6 or when matrix changes
  useEffect(() => {
    if (!preparedData || preparedData.standardizedMatrix.length === 0) return;

    const data = preparedData.standardizedMatrix;
    const scanResults: KScanResult[] = [];

    for (let k = 2; k <= 10; k++) {
      const run = runKMeansWithRestarts(data, k, 42, 10, 20);
      const sil = calculateSilhouetteScore(data, run.clusterAssignments, k, 400);
      scanResults.push({
        k,
        inertia: run.inertia,
        silhouette: sil,
      });
    }

    setKScanResults(scanResults);

    // Find recommended K based on silhouette peak & second derivative drop
    let bestK = 4;
    let maxSil = -1;
    for (const res of scanResults) {
      if (res.k >= 3 && res.k <= 6 && res.silhouette > maxSil) {
        maxSil = res.silhouette;
        bestK = res.k;
      }
    }
    // If no clear silhouette peak, default to 3 or 4
    if (bestK < 3) bestK = 3;
    setRecommendedK(bestK);
    setSelectedK((prev) => (prev >= 2 && prev <= 10 ? prev : bestK));
  }, [preparedData]);

  // Final KMeans Result for the currently selected K
  const kmeansResult: KMeansResult | null = useMemo(() => {
    if (!preparedData || !preparedData.standardizedMatrix || preparedData.standardizedMatrix.length === 0) {
      return null;
    }

    const data = preparedData.standardizedMatrix;
    const k = selectedK;
    const run = runKMeansWithRestarts(data, k, 42, 10, 20);

    const clusterSizes = Array.from({ length: k }, (_, idx) => {
      const count = run.clusterAssignments.filter((c) => c === idx).length;
      return {
        cluster: idx,
        count,
        percent: data.length > 0 ? (count / data.length) * 100 : 0,
      };
    });

    // Propose default names based on dominant variables
    const proposed = proposeClusterNames(run.centroids, preparedData.behaviorCols);

    // Merge with any user custom names
    const clusterNames: Record<number, string> = {};
    for (let i = 0; i < k; i++) {
      clusterNames[i] = customClusterNames[i] || proposed[i] || `Grupo ${i + 1}`;
    }

    // Find max absolute variable per cluster row
    const maxAbsVarPerCluster: { [cluster: number]: { varIndex: number; varName: string; value: number } } = {};
    run.centroids.forEach((row, cIdx) => {
      let maxAbs = -1;
      let bestVIdx = 0;
      row.forEach((val, vIdx) => {
        if (Math.abs(val) > maxAbs) {
          maxAbs = Math.abs(val);
          bestVIdx = vIdx;
        }
      });
      maxAbsVarPerCluster[cIdx] = {
        varIndex: bestVIdx,
        varName: preparedData.behaviorCols[bestVIdx],
        value: row[bestVIdx],
      };
    });

    return {
      k,
      iterations: run.iterations,
      bestSeed: run.bestStart,
      inertia: run.inertia,
      clusterAssignments: run.clusterAssignments,
      clusterSizes,
      centroids: run.centroids,
      behaviorVars: preparedData.behaviorCols,
      clusterNames,
      maxAbsVarPerCluster,
    };
  }, [preparedData, selectedK, customClusterNames]);

  // Profiles (Step 8)
  const { catProfiles, numProfiles } = useMemo(() => {
    if (!kmeansResult || rawRows.length === 0) {
      return { catProfiles: [], numProfiles: [] };
    }

    const assignments = kmeansResult.clusterAssignments;
    const k = kmeansResult.k;
    const catList: CategoricalProfileMetric[] = [];
    const numList: NumericProfileMetric[] = [];

    selection.profileVars.forEach((varName) => {
      const colSum = summaries.find((s) => s.name === varName);
      if (!colSum) return;

      if (colSum.type === 'categorical' || colSum.type === 'binary') {
        const catValues = rawRows.map((r) => (r[varName] !== null && r[varName] !== undefined ? String(r[varName]).trim() : 'Sin dato'));
        const chiRes = calculateChiSquareTest(assignments, catValues, k);
        catList.push({
          varName,
          ...chiRes,
        });
      } else if (colSum.type === 'numeric') {
        const clusterStats = Array.from({ length: k }, (_, cIdx) => {
          const vals: number[] = [];
          for (let i = 0; i < rawRows.length; i++) {
            if (assignments[i] === cIdx) {
              const num = parseFlexibleNumber(rawRows[i][varName]);
              if (num !== null) vals.push(num);
            }
          }
          const quant = calculateQuantiles(vals);
          const mean = calculateMean(vals);
          return {
            clusterId: cIdx,
            clusterName: kmeansResult.clusterNames[cIdx] || `Grupo ${cIdx + 1}`,
            count: vals.length,
            median: quant.median,
            q1: quant.q1,
            q3: quant.q3,
            min: quant.min,
            max: quant.max,
            mean,
          };
        });

        const allRowValues = rawRows.map((r) => parseFlexibleNumber(r[varName]));
        const kw = calculateKruskalWallis(assignments, allRowValues, k);

        numList.push({
          varName,
          clusterStats,
          hStatistic: kw.hStatistic,
          degreesOfFreedom: kw.degreesOfFreedom,
          pValue: kw.pValue,
          isSignificant: kw.isSignificant,
        });
      }
    });

    return { catProfiles: catList, numProfiles: numList };
  }, [kmeansResult, rawRows, selection.profileVars, summaries]);

  // Marketing Strategies (Step 9)
  const strategies: GroupStrategy[] = useMemo(() => {
    if (!kmeansResult) return [];
    return generateMarketingStrategies(kmeansResult, businessContext, kmeansResult.clusterNames, numProfiles);
  }, [kmeansResult, businessContext, numProfiles]);

  // Handlers
  const handleToggleTransform = (varName: string) => {
    setAppliedTransforms((prev) => {
      const current = prev[varName] !== undefined ? prev[varName] : false;
      return { ...prev, [varName]: !current };
    });
  };

  const handleUpdateClusterName = (clusterIdx: number, newName: string) => {
    setCustomClusterNames((prev) => ({
      ...prev,
      [clusterIdx]: newName,
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 10) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxAccessibleStep((prev) => Math.max(prev, next));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep = (step: number) => {
    if (step <= maxAccessibleStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setMaxAccessibleStep(1);
    setCustomClusterNames({});
    handleLoadSampleDataset();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 leading-tight">
                Segmentador de Clientes
              </h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Segmentación estratégica con k-means para equipos de mercadeo y negocio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Paso {currentStep} de 10
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stepper Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={10}
          stepNames={STEP_NAMES}
          canGoNext={true}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
          onGoToStep={handleGoToStep}
          maxAccessibleStep={maxAccessibleStep}
        />

        {/* Step Views */}
        <div className="mt-4">
          {currentStep === 1 && (
            <Step1Context
              context={businessContext}
              onChange={setBusinessContext}
              onNext={handleNextStep}
              onLoadSampleData={handleLoadSampleDataset}
            />
          )}

          {currentStep === 2 && (
            <Step2DataUpload
              data={rawRows}
              headers={headers}
              fileName={fileName}
              onDataLoaded={handleDataLoaded}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3VariableUnderstanding
              summaries={summaries}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4VariableSelection
              summaries={summaries}
              selection={selection}
              onChange={setSelection}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 5 && preparedData && (
            <Step5DataPreparation
              proposals={preparedData.proposals}
              summaries={summaries}
              histogramsBefore={preparedData.histogramsBefore}
              histogramsAfter={preparedData.histogramsAfter}
              onToggleTransform={handleToggleTransform}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 6 && (
            <Step6ChooseK
              scanResults={kScanResults}
              selectedK={selectedK}
              recommendedK={recommendedK}
              onChangeK={setSelectedK}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              isCalculating={isScanningK}
            />
          )}

          {currentStep === 7 && kmeansResult && (
            <Step7KmeansResults
              kmeansResult={kmeansResult}
              onUpdateClusterName={handleUpdateClusterName}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 8 && (
            <Step8GroupProfiles
              catProfiles={catProfiles}
              numProfiles={numProfiles}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 9 && kmeansResult && (
            <Step9MarketingStrategy
              strategies={strategies}
              businessContext={businessContext}
              kmeansResult={kmeansResult}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {currentStep === 10 && kmeansResult && (
            <Step10Export
              originalRows={rawRows}
              context={businessContext}
              kmeansResult={kmeansResult}
              strategies={strategies}
              catProfiles={catProfiles}
              numProfiles={numProfiles}
              onPrev={handlePrevStep}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      {/* Footer Required by Prompt */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-600">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-stone-800">
            Desarrollado por Héctor – Introducción a la Analítica de Datos
          </p>
          <p className="text-[11px] text-stone-500">
            Procesamiento 100% en cliente con k-means++, semilla determinista fija, SheetJS, PapaParse y Recharts. Sin almacenamiento en servidores externos.
          </p>
        </div>
      </footer>
    </div>
  );
}
