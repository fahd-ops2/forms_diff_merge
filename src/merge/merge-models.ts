import {
  FmbObjectType,
  NormalizedFmbModel,
  PropertyCategory,
} from '../fmb/models/fmb-models';

export type MergeDecisionType =
  | 'UNCHANGED'
  | 'OURS_ONLY'
  | 'THEIRS_ONLY'
  | 'IDENTICAL_CHANGE'
  | 'CONFLICT';

export type ConflictResolutionChoice =
  | 'KEEP_OURS'
  | 'KEEP_THEIRS'
  | 'KEEP_BASE'
  | 'CUSTOM';

export interface MergeItemDecision {
  id: string;
  objectId: string;
  objectType: FmbObjectType;
  objectName: string;
  parentPath: string[];
  displayPath: string;
  targetKind: 'OBJECT_EXISTENCE' | 'PROPERTY' | 'SOURCE_CODE';
  propertyKey?: string;
  propertyLabel: string;
  category?: PropertyCategory;
  unit?: string;
  decisionType: MergeDecisionType;
  baseValue: string | number | boolean | undefined;
  oursValue: string | number | boolean | undefined;
  theirsValue: string | number | boolean | undefined;
  baseFormatted: string;
  oursFormatted: string;
  theirsFormatted: string;
  /** Populated automatically for non-conflicts, or once resolved by user for conflicts */
  resolvedChoice?: ConflictResolutionChoice;
  resolvedValue?: string | number | boolean;
  resolvedFormatted?: string;
  isResolved: boolean;
  explanation: string;
}

export interface MergeValidationReport {
  isValid: boolean;
  checkedAt: string;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
}

export interface ThreeWayMergeResult {
  baseModel: NormalizedFmbModel;
  oursModel: NormalizedFmbModel;
  theirsModel: NormalizedFmbModel;
  analyzedAt: string;
  outputFileName: string;
  decisions: MergeItemDecision[];
  autoMergedDecisions: MergeItemDecision[];
  conflicts: MergeItemDecision[];
  summary: {
    totalEvaluated: number;
    unchangedCount: number;
    oursOnlyCount: number;
    theirsOnlyCount: number;
    identicalChangeCount: number;
    autoMergedTotal: number;
    totalConflicts: number;
    resolvedConflicts: number;
    remainingConflicts: number;
  };
  validation?: MergeValidationReport;
}
