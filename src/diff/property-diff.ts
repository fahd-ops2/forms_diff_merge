import { FmbProperty } from '../fmb/models/fmb-models';
import { FmbNormalizer } from '../fmb/normalizer/fmb-normalizer';
import { ChangeStatus, PropertyDiffEntry, SourceCodeDiff, SourceDiffLine } from './diff-models';

export class PropertyDiffCalculator {
  /**
   * Compares two property maps and produces human-readable semantic property diffs.
   */
  public static compareProperties(
    oldProps: Record<string, FmbProperty>,
    newProps: Record<string, FmbProperty>
  ): PropertyDiffEntry[] {
    const allKeys = Array.from(
      new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
    );

    const results: PropertyDiffEntry[] = [];

    for (const key of allKeys) {
      const oldProp = oldProps[key];
      const newProp = newProps[key];

      const oldFormatted = FmbNormalizer.formatPropertyValue(oldProp);
      const newFormatted = FmbNormalizer.formatPropertyValue(newProp);
      const label = newProp?.label || oldProp?.label || key;
      const category = newProp?.category || oldProp?.category || 'general';

      let status: ChangeStatus = 'UNCHANGED';
      let summaryText = `${label} unchanged (${newFormatted})`;

      if (!oldProp && newProp) {
        status = 'ADDED';
        summaryText = `${label} set to ${newFormatted}`;
      } else if (oldProp && !newProp) {
        status = 'REMOVED';
        summaryText = `${label} removed (was ${oldFormatted})`;
      } else if (oldProp && newProp && oldProp.value !== newProp.value) {
        status = 'MODIFIED';
        summaryText = `${label} changed: ${oldFormatted} → ${newFormatted}`;
      }

      results.push({
        key,
        label,
        category,
        status,
        oldProperty: oldProp,
        newProperty: newProp,
        oldFormatted,
        newFormatted,
        summaryText,
      });
    }

    // Sort changed properties first
    return results.sort((a, b) => {
      const aChanged = a.status !== 'UNCHANGED' ? 0 : 1;
      const bChanged = b.status !== 'UNCHANGED' ? 0 : 1;
      if (aChanged !== bChanged) return aChanged - bChanged;
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Computes a line-by-line LCS diff for PL/SQL Triggers, Program Units, and SQL Queries,
   * pairing adjacent removed+added lines as 'modified' lines for side-by-side split view.
   */
  public static compareSourceCode(
    oldSource: string | undefined,
    newSource: string | undefined,
    sourceType: 'PLSQL' | 'SQL' = 'PLSQL'
  ): SourceCodeDiff | undefined {
    if (oldSource === undefined && newSource === undefined) {
      return undefined;
    }

    const cleanOld = (oldSource ?? '').trim();
    const cleanNew = (newSource ?? '').trim();

    if (cleanOld === cleanNew) {
      const unchangedLines = cleanNew ? cleanNew.split('\n') : [];
      return {
        status: 'UNCHANGED',
        sourceType,
        oldSource: cleanOld,
        newSource: cleanNew,
        addedLines: 0,
        removedLines: 0,
        modifiedLines: 0,
        lines: unchangedLines.map((line, idx) => ({
          type: 'unchanged',
          oldLineNumber: idx + 1,
          newLineNumber: idx + 1,
          oldContent: line,
          newContent: line,
        })),
        summaryText: 'No source changes',
      };
    }

    const oldLines = cleanOld ? cleanOld.split('\n') : [];
    const newLines = cleanNew ? cleanNew.split('\n') : [];

    // Compute LCS matrix
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      new Array<number>(n + 1).fill(0)
    );

    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (oldLines[i] === newLines[j]) {
          dp[i][j] = 1 + dp[i + 1][j + 1];
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    const rawOps: Array<{
      op: 'same' | 'del' | 'add';
      oldIdx?: number;
      newIdx?: number;
      text: string;
    }> = [];

    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (oldLines[i] === newLines[j]) {
        rawOps.push({ op: 'same', oldIdx: i + 1, newIdx: j + 1, text: oldLines[i] });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        rawOps.push({ op: 'del', oldIdx: i + 1, text: oldLines[i] });
        i++;
      } else {
        rawOps.push({ op: 'add', newIdx: j + 1, text: newLines[j] });
        j++;
      }
    }
    while (i < m) {
      rawOps.push({ op: 'del', oldIdx: i + 1, text: oldLines[i] });
      i++;
    }
    while (j < n) {
      rawOps.push({ op: 'add', newIdx: j + 1, text: newLines[j] });
      j++;
    }

    // Coalesce adjacent del + add into 'modified' rows for clean side-by-side alignment
    const lines: SourceDiffLine[] = [];
    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    let k = 0;
    while (k < rawOps.length) {
      const curr = rawOps[k];
      const next = rawOps[k + 1];

      if (curr.op === 'same') {
        lines.push({
          type: 'unchanged',
          oldLineNumber: curr.oldIdx,
          newLineNumber: curr.newIdx,
          oldContent: curr.text,
          newContent: curr.text,
        });
        k++;
      } else if (curr.op === 'del' && next && next.op === 'add') {
        lines.push({
          type: 'modified',
          oldLineNumber: curr.oldIdx,
          newLineNumber: next.newIdx,
          oldContent: curr.text,
          newContent: next.text,
        });
        modifiedLines++;
        k += 2;
      } else if (curr.op === 'del') {
        lines.push({
          type: 'removed',
          oldLineNumber: curr.oldIdx,
          oldContent: curr.text,
        });
        removedLines++;
        k++;
      } else {
        lines.push({
          type: 'added',
          newLineNumber: curr.newIdx,
          newContent: curr.text,
        });
        addedLines++;
        k++;
      }
    }

    let status: ChangeStatus = 'MODIFIED';
    if (!cleanOld && cleanNew) status = 'ADDED';
    else if (cleanOld && !cleanNew) status = 'REMOVED';

    const parts: string[] = [];
    if (addedLines > 0) parts.push(`${addedLines} ${addedLines === 1 ? 'line' : 'lines'} added`);
    if (removedLines > 0) parts.push(`${removedLines} ${removedLines === 1 ? 'line' : 'lines'} removed`);
    if (modifiedLines > 0) parts.push(`${modifiedLines} ${modifiedLines === 1 ? 'line' : 'lines'} modified`);

    return {
      status,
      sourceType,
      oldSource: cleanOld,
      newSource: cleanNew,
      addedLines,
      removedLines,
      modifiedLines,
      lines,
      summaryText: parts.join(', ') || 'Source code updated',
    };
  }
}
