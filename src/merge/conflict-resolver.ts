import { FmbNormalizer } from '../fmb/normalizer/fmb-normalizer';
import {
  ConflictResolutionChoice,
  MergeItemDecision,
  ThreeWayMergeResult,
} from './merge-models';

export class ConflictResolver {
  /**
   * Resolves a specific conflict decision with the user's selected choice
   * ('KEEP_OURS' | 'KEEP_THEIRS' | 'KEEP_BASE' | 'CUSTOM') and returns
   * an updated immutable ThreeWayMergeResult.
   */
  public static resolveConflict(
    mergeResult: ThreeWayMergeResult,
    decisionId: string,
    choice: ConflictResolutionChoice,
    customValue?: string | number | boolean
  ): ThreeWayMergeResult {
    const updateDecision = (d: MergeItemDecision): MergeItemDecision => {
      if (d.id !== decisionId) return d;

      let resolvedValue: string | number | boolean | undefined;
      if (choice === 'KEEP_OURS') {
        resolvedValue = d.oursValue;
      } else if (choice === 'KEEP_THEIRS') {
        resolvedValue = d.theirsValue;
      } else if (choice === 'KEEP_BASE') {
        resolvedValue = d.baseValue;
      } else {
        resolvedValue = customValue ?? d.oursValue;
      }

      const resolvedFormatted = this.formatScalar(resolvedValue, d.unit);

      return {
        ...d,
        resolvedChoice: choice,
        resolvedValue,
        resolvedFormatted,
        isResolved: true,
      };
    };

    const decisions = mergeResult.decisions.map(updateDecision);
    const conflicts = decisions.filter((d) => d.decisionType === 'CONFLICT');
    const resolvedConflicts = conflicts.filter((c) => c.isResolved).length;
    const remainingConflicts = conflicts.length - resolvedConflicts;

    return {
      ...mergeResult,
      decisions,
      conflicts,
      summary: {
        ...mergeResult.summary,
        resolvedConflicts,
        remainingConflicts,
      },
      validation: undefined, // Reset validation when resolution state changes
    };
  }

  /**
   * Resolves all remaining conflicts where OURS and THEIRS have compatible/normalized
   * convergence or applies a safe bulk strategy (e.g., Keep Ours / Keep Theirs for all remaining).
   */
  public static resolveAllRemaining(
    mergeResult: ThreeWayMergeResult,
    choice: 'KEEP_OURS' | 'KEEP_THEIRS' | 'KEEP_BASE'
  ): ThreeWayMergeResult {
    let current = mergeResult;
    for (const conflict of current.conflicts) {
      if (!conflict.isResolved) {
        current = this.resolveConflict(current, conflict.id, choice);
      }
    }
    return current;
  }

  public static formatScalar(
    value: string | number | boolean | undefined,
    unit?: string
  ): string {
    if (value === undefined || value === null) return '(Removed / Not present)';
    return FmbNormalizer.formatPropertyValue({
      key: 'val',
      label: 'Value',
      value,
      unit,
      category: 'general',
    });
  }
}
