import { FmbObjectType, FmbProperty, NormalizedFmbModel, NormalizedFmbObject, PropertyCategory } from '../fmb/models/fmb-models';

export type ChangeStatus = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export interface PropertyDiffEntry {
  key: string;
  label: string;
  category: PropertyCategory;
  status: ChangeStatus;
  oldProperty?: FmbProperty;
  newProperty?: FmbProperty;
  oldFormatted: string;
  newFormatted: string;
  /** Semantic summary e.g. "Width changed: 150 px → 180 px" */
  summaryText: string;
}

export interface SourceDiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  oldContent?: string;
  newContent?: string;
}

export interface SourceCodeDiff {
  status: ChangeStatus;
  sourceType: 'PLSQL' | 'SQL';
  oldSource: string;
  newSource: string;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  lines: SourceDiffLine[];
  summaryText: string;
}

export interface ObjectDiffEntry {
  id: string;
  type: FmbObjectType;
  name: string;
  parentPath: string[];
  displayPath: string;
  groupKey: string;
  groupLabel: string;
  status: ChangeStatus;
  oldObject?: NormalizedFmbObject;
  newObject?: NormalizedFmbObject;
  propertyDiffs: PropertyDiffEntry[];
  changedPropertyCount: number;
  sourceDiff?: SourceCodeDiff;
  headlineSummary: string;
}

export interface DiffSummaryMetrics {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  totalObjects: number;
  changedPropertyTotal: number;
  changedTriggersCount: number;
  changedProgramUnitsCount: number;
}

export interface FmbComparisonResult {
  oldModel: NormalizedFmbModel;
  newModel: NormalizedFmbModel;
  comparedAt: string;
  summary: DiffSummaryMetrics;
  formPropertyDiffs: PropertyDiffEntry[];
  objectDiffs: ObjectDiffEntry[];
}
