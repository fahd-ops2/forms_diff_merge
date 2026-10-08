import {
  FmbObjectType,
  FmbProperty,
  NormalizedFmbModel,
  NormalizedFmbObject,
  PropertyCategory,
} from '../models/fmb-models';
import { ParsedFmbAst } from '../parser/fmb-parser';

interface PropertyDescriptor {
  label: string;
  unit?: string;
  category: PropertyCategory;
}

const PROPERTY_DICTIONARY: Record<string, PropertyDescriptor> = {
  Prompt: { label: 'Prompt', category: 'visual' },
  Title: { label: 'Title', category: 'visual' },
  Width: { label: 'Width', unit: 'px', category: 'layout' },
  Height: { label: 'Height', unit: 'px', category: 'layout' },
  ViewportWidth: { label: 'Viewport Width', unit: 'px', category: 'layout' },
  ViewportHeight: { label: 'Viewport Height', unit: 'px', category: 'layout' },
  XPosition: { label: 'X Position', unit: 'px', category: 'layout' },
  YPosition: { label: 'Y Position', unit: 'px', category: 'layout' },
  MaximumLength: { label: 'Maximum Length', unit: 'chars', category: 'data' },
  DataType: { label: 'Data Type', category: 'data' },
  ItemType: { label: 'Item Type', category: 'general' },
  Required: { label: 'Required', category: 'data' },
  FormatMask: { label: 'Format Mask', category: 'data' },
  CanvasName: { label: 'Canvas', category: 'layout' },
  WindowName: { label: 'Window', category: 'layout' },
  WindowStyle: { label: 'Window Style', category: 'visual' },
  CanvasType: { label: 'Canvas Type', category: 'layout' },
  Modal: { label: 'Modal', category: 'behavior' },
  MinimizeAllowed: { label: 'Minimize Allowed', category: 'behavior' },
  MaximizeAllowed: { label: 'Maximize Allowed', category: 'behavior' },
  DatabaseItem: { label: 'Database Item', category: 'database' },
  DatabaseDataBlock: { label: 'Database Block', category: 'database' },
  QueryDataSourceName: { label: 'Query Data Source', category: 'database' },
  SingleRecord: { label: 'Single Record', category: 'database' },
  RecordsDisplayed: { label: 'Records Displayed', category: 'layout' },
  QueryAllowed: { label: 'Query Allowed', category: 'behavior' },
  InsertAllowed: { label: 'Insert Allowed', category: 'behavior' },
  UpdateAllowed: { label: 'Update Allowed', category: 'behavior' },
  DeleteAllowed: { label: 'Delete Allowed', category: 'behavior' },
  LockingMode: { label: 'Locking Mode', category: 'database' },
  OrderByClause: { label: 'ORDER BY Clause', category: 'database' },
  ValidateFromList: { label: 'Validate from List', category: 'data' },
  LovName: { label: 'LOV Name', category: 'data' },
  RecordGroupName: { label: 'Record Group', category: 'data' },
  RecordGroupType: { label: 'Record Group Type', category: 'data' },
  RecordGroupFetchSize: { label: 'Fetch Size', unit: 'rows', category: 'database' },
  AutoRefresh: { label: 'Auto Refresh', category: 'behavior' },
  ExecutionHierarchy: { label: 'Execution Hierarchy', category: 'behavior' },
  FireInEnterQueryMode: { label: 'Fire in Enter-Query Mode', category: 'behavior' },
  ProgramUnitType: { label: 'Program Unit Type', category: 'general' },
  ConsoleWindow: { label: 'Console Window', category: 'layout' },
  FirstNavigationBlockName: { label: 'First Navigation Block', category: 'behavior' },
  ValidationUnit: { label: 'Validation Unit', category: 'behavior' },
  InteractionMode: { label: 'Interaction Mode', category: 'behavior' },
};

export class FmbNormalizer {
  /**
   * Produces a canonical NormalizedFmbModel with human-readable property names,
   * stable object identities, and deterministic ordering.
   */
  public static normalize(ast: ParsedFmbAst): NormalizedFmbModel {
    const formProperties: Record<string, FmbProperty> = {};
    for (const [rawKey, rawVal] of Object.entries(ast.formAttributes)) {
      formProperties[rawKey] = this.normalizeProperty(rawKey, rawVal);
    }

    const objects: NormalizedFmbObject[] = [];
    const objectMap: Record<string, NormalizedFmbObject> = {};

    for (const node of ast.nodes) {
      const id = this.buildCanonicalId(node.type, node.parentPath, node.name);
      const displayPath =
        node.parentPath.length > 0
          ? `${node.parentPath.join(' → ')} → ${node.name}`
          : node.name;

      const { groupKey, groupLabel } = this.resolveGroup(node.type, node.parentPath, node.name);

      const properties: Record<string, FmbProperty> = {};
      for (const [rawKey, rawVal] of Object.entries(node.rawAttributes)) {
        properties[rawKey] = this.normalizeProperty(rawKey, rawVal);
      }

      const normalizedObj: NormalizedFmbObject = {
        id,
        type: node.type,
        name: node.name,
        parentPath: node.parentPath,
        displayPath,
        groupKey,
        groupLabel,
        properties,
        sourceCode: node.sourceCode,
        sourceType: node.sourceType,
      };

      objects.push(normalizedObj);
      objectMap[id] = normalizedObj;
    }

    return {
      metadata: {
        fileName: ast.fileName,
        fileSize: ast.fileSize,
        moduleName: ast.moduleName,
        formsVersion: ast.formsVersion,
        extractionMethod: ast.extractionMethod,
        extractedAt: new Date().toISOString(),
        checksum: this.computeChecksum(objects),
      },
      formProperties,
      objects,
      objectMap,
    };
  }

  public static buildCanonicalId(
    type: FmbObjectType,
    parentPath: string[],
    name: string
  ): string {
    const qualifiedName =
      parentPath.length > 0 ? `${parentPath.join('.')}.${name}` : name;
    return `${type}:${qualifiedName}`;
  }

  public static normalizeProperty(
    rawKey: string,
    rawVal: string | number | boolean
  ): FmbProperty {
    const descriptor = PROPERTY_DICTIONARY[rawKey];
    if (descriptor) {
      return {
        key: rawKey,
        label: descriptor.label,
        value: rawVal,
        unit: descriptor.unit,
        category: descriptor.category,
      };
    }

    // Humanize camelCase / PascalCase fallback attribute names
    const humanized = rawKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

    return {
      key: rawKey,
      label: humanized,
      value: rawVal,
      category: 'general',
    };
  }

  public static formatPropertyValue(prop?: FmbProperty): string {
    if (!prop) return '(Not set)';
    const { value, unit } = prop;
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === '' || value === null || value === undefined) {
      return '(None)';
    }
    if (typeof value === 'number' && unit) {
      return `${value} ${unit}`;
    }
    return String(value);
  }

  private static resolveGroup(
    type: FmbObjectType,
    parentPath: string[],
    name: string
  ): { groupKey: string; groupLabel: string } {
    if (type === 'BLOCK') {
      return { groupKey: `BLOCK:${name}`, groupLabel: name };
    }
    if (type === 'ITEM' && parentPath.length > 0) {
      return { groupKey: `BLOCK:${parentPath[0]}`, groupLabel: parentPath[0] };
    }
    if (type === 'TRIGGER') {
      return { groupKey: 'GROUP:TRIGGERS', groupLabel: 'TRIGGERS' };
    }
    if (type === 'PROGRAM_UNIT') {
      return { groupKey: 'GROUP:PROGRAM_UNITS', groupLabel: 'PROGRAM UNITS' };
    }
    if (type === 'WINDOW') {
      return { groupKey: 'GROUP:WINDOWS', groupLabel: 'WINDOWS' };
    }
    if (type === 'CANVAS') {
      return { groupKey: 'GROUP:CANVASES', groupLabel: 'CANVASES' };
    }
    if (type === 'LOV') {
      return { groupKey: 'GROUP:LOVS', groupLabel: 'LOVS' };
    }
    if (type === 'RECORD_GROUP') {
      return { groupKey: 'GROUP:RECORD_GROUPS', groupLabel: 'RECORD GROUPS' };
    }
    return { groupKey: 'GROUP:OTHER', groupLabel: 'OTHER OBJECTS' };
  }

  private static computeChecksum(objects: NormalizedFmbObject[]): string {
    let hash = 2166136261;
    const payload = objects
      .map((o) => `${o.id}:${JSON.stringify(o.properties)}:${o.sourceCode ?? ''}`)
      .join('|');
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}
