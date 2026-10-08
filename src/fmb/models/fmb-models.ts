export type FmbObjectType =
  | 'WINDOW'
  | 'CANVAS'
  | 'BLOCK'
  | 'ITEM'
  | 'TRIGGER'
  | 'PROGRAM_UNIT'
  | 'LOV'
  | 'RECORD_GROUP'
  | 'ALERT'
  | 'PARAMETER';

export type PropertyCategory =
  | 'layout'
  | 'data'
  | 'behavior'
  | 'visual'
  | 'database'
  | 'general';

export interface FmbProperty {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  category: PropertyCategory;
}

export interface NormalizedFmbObject {
  /** Stable canonical identity key, e.g., BLOCK:CUSTOMER, ITEM:CUSTOMER.CUSTOMER_NAME, TRIGGER:CUSTOMER.WHEN-VALIDATE-ITEM */
  id: string;
  type: FmbObjectType;
  name: string;
  /** Parent object names in hierarchical order, e.g., ['CUSTOMER'] */
  parentPath: string[];
  /** Human-readable breadcrumb path, e.g., "CUSTOMER → CUSTOMER_NAME" */
  displayPath: string;
  /** Top-level group key for UI section grouping, e.g., "CUSTOMER" or "TRIGGERS" or "PROGRAM_UNITS" */
  groupKey: string;
  groupLabel: string;
  properties: Record<string, FmbProperty>;
  /** PL/SQL or SQL source code for Triggers, Program Units, and Record Groups */
  sourceCode?: string;
  sourceType?: 'PLSQL' | 'SQL';
}

export interface FmbModuleMetadata {
  fileName: string;
  fileSize: number;
  moduleName: string;
  formsVersion: string;
  extractionMethod: 'frmf2xml' | 'xml-direct' | 'fmt-text' | 'binary-heuristic' | 'preset-fixture';
  extractedAt: string;
  checksum: string;
}

export interface NormalizedFmbModel {
  metadata: FmbModuleMetadata;
  formProperties: Record<string, FmbProperty>;
  objects: NormalizedFmbObject[];
  objectMap: Record<string, NormalizedFmbObject>;
}

export interface RawExtractedItem {
  type: FmbObjectType;
  name: string;
  parentPath: string[];
  rawAttributes: Record<string, string | number | boolean>;
  sourceCode?: string;
  sourceType?: 'PLSQL' | 'SQL';
}

export interface RawExtractedFmb {
  fileName: string;
  fileSize: number;
  moduleName: string;
  formsVersion: string;
  extractionMethod: 'frmf2xml' | 'xml-direct' | 'fmt-text' | 'binary-heuristic' | 'preset-fixture';
  formAttributes: Record<string, string | number | boolean>;
  items: RawExtractedItem[];
}

export type FmbErrorCode =
  | 'UNSUPPORTED_EXTENSION'
  | 'EMPTY_OR_CORRUPTED'
  | 'MISSING_ORACLE_TOOLING'
  | 'FILE_LOCKED_OR_UNREADABLE'
  | 'PARSE_FAILURE';

export class FmbExtractionError extends Error {
  public readonly code: FmbErrorCode;
  public readonly fileName: string;
  public readonly technicalDetails: string;
  public readonly remediationSteps: string[];

  constructor(params: {
    code: FmbErrorCode;
    message: string;
    fileName: string;
    technicalDetails: string;
    remediationSteps: string[];
  }) {
    super(params.message);
    this.name = 'FmbExtractionError';
    this.code = params.code;
    this.fileName = params.fileName;
    this.technicalDetails = params.technicalDetails;
    this.remediationSteps = params.remediationSteps;
  }
}
