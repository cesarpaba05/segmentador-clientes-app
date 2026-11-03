/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export function createRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Basic descriptive statistics
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function calculateVariance(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSqDiff = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  return sumSqDiff / (values.length - 1); // Sample variance
}

export function calculateStdDev(values: number[], mean: number): number {
  return Math.sqrt(calculateVariance(values, mean));
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateQuantiles(values: number[]) {
  if (values.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (upper >= n) return sorted[n - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    min: sorted[0],
    q1: getPercentile(0.25),
    median: getPercentile(0.50),
    q3: getPercentile(0.75),
    max: sorted[n - 1],
  };
}

/**
 * Fisher-Pearson sample skewness
 */
export function calculateSkewness(values: number[], mean: number, stdDev: number): number {
  const n = values.length;
  if (n < 3 || stdDev === 0) return 0;
  const sumCubed = values.reduce((acc, v) => acc + Math.pow((v - mean) / stdDev, 3), 0);
  const factor = (n / ((n - 1) * (n - 2)));
  const skew = factor * sumCubed;
  return isNaN(skew) ? 0 : skew;
}

/**
 * Generate histogram bins for a series of numeric values
 */
export function generateHistogram(values: number[], binCount = 8): { bin: string; count: number; min: number; max: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (min === max) {
    return [{ bin: min.toFixed(1), count: values.length, min, max }];
  }

  const range = max - min;
  const step = range / binCount;
  const bins: { bin: string; count: number; min: number; max: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const bMin = min + i * step;
    const bMax = i === binCount - 1 ? max : min + (i + 1) * step;
    const label = `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`;
    bins.push({ bin: label, count: 0, min: bMin, max: bMax });
  }

  for (const v of values) {
    let placed = false;
    for (let i = 0; i < binCount; i++) {
      const bMin = bins[i].min;
      const bMax = bins[i].max;
      if (i === binCount - 1 ? (v >= bMin && v <= bMax) : (v >= bMin && v < bMax)) {
        bins[i].count++;
        placed = true;
        break;
      }
    }
    if (!placed && bins.length > 0) {
      bins[bins.length - 1].count++;
    }
  }

  return bins;
}

/**
 * Euclidean distance squared between two points
 */
export function distSq(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * K-Means++ algorithm with fixed seed, 10 restarts, max 20 iterations
 */
export interface KMeansRunResult {
  clusterAssignments: number[];
  centroids: number[][];
  inertia: number;
  iterations: number;
  bestStart: number;
}

export function runKMeansWithRestarts(
  data: number[][],
  k: number,
  baseSeed = 42,
  numRestarts = 10,
  maxIterations = 20
): KMeansRunResult {
  const n = data.length;
  const m = data[0].length;

  let globalBestInertia = Infinity;
  let globalBestCentroids: number[][] = [];
  let globalBestAssignments: number[] = new Array(n).fill(0);
  let globalBestIter = 0;
  let globalBestStart = 0;

  for (let restart = 0; restart < numRestarts; restart++) {
    const rng = createRNG(baseSeed + restart * 1337);

    // K-means++ initialization
    const centroids: number[][] = [];
    // 1. Pick first centroid uniformly at random
    const firstIdx = Math.floor(rng() * n);
    centroids.push([...data[firstIdx]]);

    // 2. Pick remaining k-1 centroids with probability proportional to D(x)^2
    while (centroids.length < k) {
      const distances: number[] = new Array(n);
      let sumDist = 0;

      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        for (const c of centroids) {
          const d = distSq(data[i], c);
          if (d < minDist) minDist = d;
        }
        distances[i] = minDist;
        sumDist += minDist;
      }

      if (sumDist <= 0) {
        // Fallback: random point
        const randIdx = Math.floor(rng() * n);
        centroids.push([...data[randIdx]]);
      } else {
        const threshold = rng() * sumDist;
        let running = 0;
        let chosenIdx = 0;
        for (let i = 0; i < n; i++) {
          running += distances[i];
          if (running >= threshold) {
            chosenIdx = i;
            break;
          }
        }
        centroids.push([...data[chosenIdx]]);
      }
    }

    // Iterations (max 20)
    let assignments = new Array(n).fill(0);
    let iter = 0;

    for (iter = 0; iter < maxIterations; iter++) {
      let changed = false;

      // Assign each point to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        for (let c = 0; c < k; c++) {
          const d = distSq(data[i], centroids[c]);
          if (d < minDist) {
            minDist = d;
            bestCluster = c;
          }
        }
        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      const clusterCounts = new Array(k).fill(0);
      const newCentroids = Array.from({ length: k }, () => new Array(m).fill(0));

      for (let i = 0; i < n; i++) {
        const cluster = assignments[i];
        clusterCounts[cluster]++;
        for (let j = 0; j < m; j++) {
          newCentroids[cluster][j] += data[i][j];
        }
      }

      for (let c = 0; c < k; c++) {
        if (clusterCounts[c] > 0) {
          for (let j = 0; j < m; j++) {
            newCentroids[c][j] /= clusterCounts[c];
          }
          centroids[c] = newCentroids[c];
        } else {
          // Empty cluster re-seed: take the point with highest error
          let maxError = -1;
          let candidateIdx = 0;
          for (let i = 0; i < n; i++) {
            const err = distSq(data[i], centroids[assignments[i]]);
            if (err > maxError) {
              maxError = err;
              candidateIdx = i;
            }
          }
          centroids[c] = [...data[candidateIdx]];
        }
      }

      if (!changed && iter > 0) {
        break;
      }
    }

    // Calculate final inertia (WCSS)
    let inertia = 0;
    for (let i = 0; i < n; i++) {
      inertia += distSq(data[i], centroids[assignments[i]]);
    }

    if (inertia < globalBestInertia) {
      globalBestInertia = inertia;
      globalBestCentroids = centroids.map((c) => [...c]);
      globalBestAssignments = [...assignments];
      globalBestIter = iter + 1;
      globalBestStart = restart + 1;
    }
  }

  return {
    clusterAssignments: globalBestAssignments,
    centroids: globalBestCentroids,
    inertia: globalBestInertia,
    iterations: globalBestIter,
    bestStart: globalBestStart,
  };
}

/**
 * Silhouette score computation
 */
export function calculateSilhouetteScore(
  data: number[][],
  assignments: number[],
  k: number,
  sampleLimit = 500
): number {
  const n = data.length;
  if (k <= 1 || n <= k) return 0;

  // If data is very large, take a deterministic stratified sample to keep browser UI fast
  const sampleIndices: number[] = [];
  if (n <= sampleLimit) {
    for (let i = 0; i < n; i++) sampleIndices.push(i);
  } else {
    const step = n / sampleLimit;
    for (let i = 0; i < sampleLimit; i++) {
      sampleIndices.push(Math.floor(i * step));
    }
  }

  // Pre-group points by cluster
  const clusterMembers: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusterMembers[assignments[i]].push(i);
  }

  // Check if any cluster is a singleton
  for (let c = 0; c < k; c++) {
    if (clusterMembers[c].length === 0) return 0;
  }

  let totalSilhouette = 0;
  let validCount = 0;

  for (const i of sampleIndices) {
    const currentCluster = assignments[i];
    const ownMembers = clusterMembers[currentCluster];

    // a(i): average distance to other points in the same cluster
    let a_i = 0;
    if (ownMembers.length > 1) {
      let sumDist = 0;
      for (const memberIdx of ownMembers) {
        if (memberIdx !== i) {
          sumDist += Math.sqrt(distSq(data[i], data[memberIdx]));
        }
      }
      a_i = sumDist / (ownMembers.length - 1);
    } else {
      a_i = 0;
    }

    // b(i): minimum average distance to points in another cluster
    let b_i = Infinity;
    for (let otherC = 0; otherC < k; otherC++) {
      if (otherC === currentCluster) continue;
      const otherMembers = clusterMembers[otherC];
      if (otherMembers.length === 0) continue;

      let sumOtherDist = 0;
      for (const oIdx of otherMembers) {
        sumOtherDist += Math.sqrt(distSq(data[i], data[oIdx]));
      }
      const avgDist = sumOtherDist / otherMembers.length;
      if (avgDist < b_i) {
        b_i = avgDist;
      }
    }

    if (b_i === Infinity) continue;

    const maxDenom = Math.max(a_i, b_i);
    if (maxDenom > 0) {
      const s_i = (b_i - a_i) / maxDenom;
      totalSilhouette += s_i;
      validCount++;
    }
  }

  return validCount > 0 ? totalSilhouette / validCount : 0;
}

/**
 * Chi-Square test for independence between cluster assignments and a categorical variable
 */
export function calculateChiSquareTest(
  clusterAssignments: number[],
  categories: string[],
  k: number
): {
  contingencyTable: {
    categories: string[];
    groups: {
      clusterId: number;
      clusterName: string;
      counts: number[];
      rowPercents: number[];
      colPercents: number[];
      total: number;
    }[];
    totalPerCategory: number[];
    grandTotal: number;
  };
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean;
} {
  const uniqueCats = Array.from(new Set(categories.filter((c) => c !== undefined && c !== null && c !== ''))).sort();
  const catIndexMap = new Map<string, number>();
  uniqueCats.forEach((cat, idx) => catIndexMap.set(cat, idx));

  const numCats = uniqueCats.length;
  const observed: number[][] = Array.from({ length: k }, () => new Array(numCats).fill(0));

  for (let i = 0; i < clusterAssignments.length; i++) {
    const cluster = clusterAssignments[i];
    const cat = categories[i];
    if (catIndexMap.has(cat) && cluster >= 0 && cluster < k) {
      observed[cluster][catIndexMap.get(cat)!]++;
    }
  }

  const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals: number[] = new Array(numCats).fill(0);
  for (let c = 0; c < numCats; c++) {
    for (let r = 0; r < k; r++) {
      colTotals[c] += observed[r][c];
    }
  }
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  let chiSquare = 0;
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < numCats; c++) {
      const expected = grandTotal > 0 ? (rowTotals[r] * colTotals[c]) / grandTotal : 0;
      if (expected > 0) {
        chiSquare += Math.pow(observed[r][c] - expected, 2) / expected;
      }
    }
  }

  const degreesOfFreedom = Math.max(1, (k - 1) * (numCats - 1));
  const pValue = chiSquarePValue(chiSquare, degreesOfFreedom);

  const groups = observed.map((row, clusterId) => {
    const total = rowTotals[clusterId];
    return {
      clusterId,
      clusterName: `Grupo ${clusterId + 1}`,
      counts: row,
      rowPercents: row.map((cnt) => (total > 0 ? (cnt / total) * 100 : 0)),
      colPercents: row.map((cnt, cIdx) => (colTotals[cIdx] > 0 ? (cnt / colTotals[cIdx]) * 100 : 0)),
      total,
    };
  });

  return {
    contingencyTable: {
      categories: uniqueCats,
      groups,
      totalPerCategory: colTotals,
      grandTotal,
    },
    chiSquare,
    degreesOfFreedom,
    pValue,
    isSignificant: pValue < 0.05,
  };
}

/**
 * Lanczos approximation for log-gamma ln(Gamma(z))
 */
export function logGamma(z: number): number {
  const c = [
    57.1562356658629235,
    -59.5979603554754912,
    14.1360979747417471,
    -0.491913816097620199,
    0.339946499848118887e-4,
    0.465236289270485756e-4,
    -0.983744753048795646e-4,
    0.158088703224377371e-3,
    -0.210264441724104883e-3,
    0.217439618115212643e-3,
    -0.16431810653676389e-3,
    0.844182239838527433e-4,
    -0.261908384015814087e-4,
    0.368991826595316234e-5,
  ];
  if (z <= 0) return 0;
  let sum = 0.999999999999997092;
  for (let i = 0; i < c.length; i++) {
    sum += c[i] / (z + i + 1);
  }
  const t = z + 671 / 128;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

/**
 * Regularized lower incomplete gamma P(a, x) via series expansion
 */
function gammpSeries(a: number, x: number): number {
  if (x <= 0) return 0;
  const ITMAX = 120;
  const EPS = 1.0e-12;
  let ap = a;
  let sum = 1.0 / a;
  let del = sum;
  for (let n = 1; n <= ITMAX; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) {
      break;
    }
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/**
 * Regularized upper incomplete gamma Q(a, x) via continued fraction (Lentz's method)
 */
function gammqContinuedFraction(a: number, x: number): number {
  const ITMAX = 120;
  const EPS = 1.0e-12;
  const FPMIN = 1.0e-30;
  let b = x + 1.0 - a;
  let c = 1.0 / FPMIN;
  let d = 1.0 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - a);
    b += 2.0;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/**
 * Exact p-value for Chi-Square distribution: Q(df / 2, chi2 / 2)
 */
export function chiSquarePValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1.0;
  const a = df / 2;
  const x = chi2 / 2;
  if (x < a + 1.0) {
    return Math.max(0, Math.min(1, 1.0 - gammpSeries(a, x)));
  } else {
    return Math.max(0, Math.min(1, gammqContinuedFraction(a, x)));
  }
}

/**
 * Kruskal-Wallis H Test for numeric profile variables across k clusters
 */
export function calculateKruskalWallis(
  clusterAssignments: number[],
  values: (number | null)[],
  k: number
): {
  hStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean;
} {
  // Collect valid (value, cluster) pairs
  const items: { val: number; cluster: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const c = clusterAssignments[i];
    if (v !== null && v !== undefined && !isNaN(v) && c >= 0 && c < k) {
      items.push({ val: v, cluster: c });
    }
  }

  const N = items.length;
  const df = k - 1;
  if (N <= k || df <= 0) {
    return { hStatistic: 0, degreesOfFreedom: df, pValue: 1.0, isSignificant: false };
  }

  // Sort ascending by value
  items.sort((a, b) => a.val - b.val);

  // Assign ranks with average tie correction
  const ranks: number[] = new Array(N);
  let tieSum = 0;
  let i = 0;
  while (i < N) {
    let j = i;
    while (j < N && items[j].val === items[i].val) {
      j++;
    }
    const tieCount = j - i;
    const avgRank = (i + 1 + j) / 2;
    for (let m = i; m < j; m++) {
      ranks[m] = avgRank;
    }
    if (tieCount > 1) {
      tieSum += Math.pow(tieCount, 3) - tieCount;
    }
    i = j;
  }

  // Compute rank sums per cluster
  const clusterRankSums = new Array(k).fill(0);
  const clusterCounts = new Array(k).fill(0);
  for (let idx = 0; idx < N; idx++) {
    const c = items[idx].cluster;
    clusterRankSums[c] += ranks[idx];
    clusterCounts[c]++;
  }

  let sumR2OverN = 0;
  for (let c = 0; c < k; c++) {
    if (clusterCounts[c] > 0) {
      sumR2OverN += Math.pow(clusterRankSums[c], 2) / clusterCounts[c];
    }
  }

  let H = (12.0 / (N * (N + 1))) * sumR2OverN - 3.0 * (N + 1);

  // Tie correction factor
  const denom = Math.pow(N, 3) - N;
  if (denom > 0 && tieSum > 0) {
    const C = 1.0 - tieSum / denom;
    if (C > 0) {
      H /= C;
    }
  }

  H = Math.max(0, H);
  const pValue = chiSquarePValue(H, df);

  return {
    hStatistic: H,
    degreesOfFreedom: df,
    pValue,
    isSignificant: pValue < 0.05,
  };
}

