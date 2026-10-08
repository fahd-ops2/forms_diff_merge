import { RawExtractedFmb, RawExtractedItem } from '../models/fmb-models';

export interface ParsedFmbAst {
  fileName: string;
  fileSize: number;
  moduleName: string;
  formsVersion: string;
  extractionMethod: RawExtractedFmb['extractionMethod'];
  formAttributes: Record<string, string | number | boolean>;
  nodes: RawExtractedItem[];
}

export class FmbParser {
  /**
   * Validates and cleans raw extracted items into a deterministic AST
   * ready for semantic normalization.
   */
  public static parse(raw: RawExtractedFmb): ParsedFmbAst {
    const cleanedNodes: RawExtractedItem[] = raw.items.map((item) => {
      const normalizedParentPath = item.parentPath
        .map((segment) => segment.trim().toUpperCase())
        .filter(Boolean);

      // Strip transient Oracle Forms Builder internal flags (DirtyInfo, SubclassSubObject)
      const cleanedAttributes: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(item.rawAttributes)) {
        if (key === 'DirtyInfo' || key === 'PersistentClientInfoLength') {
          continue;
        }
        cleanedAttributes[key] = value;
      }

      // Normalize PL/SQL & SQL line endings
      const normalizedSource = item.sourceCode
        ? item.sourceCode
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((line) => line.replace(/\s+$/, ''))
            .join('\n')
            .trim()
        : undefined;

      return {
        type: item.type,
        name: item.name.trim().toUpperCase(),
        parentPath: normalizedParentPath,
        rawAttributes: cleanedAttributes,
        sourceCode: normalizedSource,
        sourceType: item.sourceType,
      };
    });

    return {
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      moduleName: raw.moduleName.trim().toUpperCase(),
      formsVersion: raw.formsVersion,
      extractionMethod: raw.extractionMethod,
      formAttributes: { ...raw.formAttributes },
      nodes: cleanedNodes,
    };
  }
}
