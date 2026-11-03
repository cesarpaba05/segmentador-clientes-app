export interface BusinessContext {
  sector: string;
  problem: string;
  objective: string;
}

export type VariableType = 'numeric' | 'binary' | 'categorical';

export interface ColumnSummary {
  name: string;
  type: VariableType;
  totalCount: number;
  missingCount: number;
  missingPercent: number;
  // Numeric metrics
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  skewness?: number;
  hasNegativeValues?: boolean;
  isImpossible?: boolean;
  impossibleReason?: string;
  // Categorical metrics
  uniqueCount?: number;
  topCategories?: { value: string; count: number; percent: number }[];
  // Histogram bins (for numeric)
  histogram?: { bin: string; count: number; min: number; max: number }[];
}

export interface VariableSelection {
  behaviorVars: string[];
  profileVars: string[];
  combinedIndices: CombinedIndex[];
}

export interface CombinedIndex {
  id: string;
  name: string;
  sourceVars: string[];
}

export interface TransformProposal {
  variable: string;
  originalSkewness: number;
  suggestLog1p: boolean;
  applyLog1p: boolean;
  explanation: string;
  hasZeros: boolean;
  hasNegatives: boolean;
}

export interface PreparedData {
  originalRows: Record<string, any>[];
  headers: string[];
  behaviorVars: string[];
  // Transformed & standardized matrices
  rawMatrix: number[][]; // N x M behavior values
  transformedMatrix: number[][]; // after accepted log1p
  standardizedMatrix: number[][]; // after Z-score
  means: number[];
  stdDevs: number[];
  transformProposals: Record<string, boolean>; // var -> apply log1p
  histogramsBefore: Record<string, { bin: string; count: number }[]>;
  histogramsAfter: Record<string, { bin: string; count: number }[]>;
}

export interface KScanResult {
  k: number;
  inertia: number;
  silhouette: number;
}

export interface KMeansResult {
  k: number;
  iterations: number;
  bestSeed: number;
  inertia: number;
  clusterAssignments: number[]; // cluster index 0..k-1 for each row
  clusterSizes: { cluster: number; count: number; percent: number }[];
  centroids: number[][]; // k x M standardized centroids
  behaviorVars: string[];
  clusterNames: Record<number, string>;
  maxAbsVarPerCluster: { [cluster: number]: { varIndex: number; varName: string; value: number } };
}

export interface CategoricalProfileMetric {
  varName: string;
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
  isSignificant: boolean; // p < 0.05
}

export interface NumericProfileMetric {
  varName: string;
  clusterStats: {
    clusterId: number;
    clusterName: string;
    count: number;
    median: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
    mean: number;
  }[];
  // Kruskal-Wallis test results
  hStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean;
}

export type OpportunityQuadrant = 'Proteger' | 'Desarrollar' | 'Rentabilizar' | 'Mantener con bajo costo';

export interface GroupStrategy {
  clusterId: number;
  clusterName: string;
  customerCount: number;
  customerPercent: number;
  dominantTraits: string[];
  profileTraits: string[];
  averageStandardizedConsumption: number;
  quadrant: OpportunityQuadrant;
  quadrantDescription: string;
  maslow: {
    need: string;
    desire: string;
    demand: string;
  };
  fourPs: {
    product: string;
    price: string;
    place: string;
    promotion: string;
  };
  productPlanDesign: string;
  communicationPlan: {
    keyMessage: string;
    channels: string[];
    tone: string;
  };
  newProductIdea: string;
}
