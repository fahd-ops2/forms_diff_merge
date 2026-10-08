import { MergeDecisionType } from './merge-models';

export class ConflictDetector {
  /**
   * Evaluates the canonical 3-way merge truth table for any scalar, property, or source string:
   *
   * BASE == OURS && BASE == THEIRS           -> UNCHANGED
   * BASE != OURS && BASE == THEIRS           -> OURS_ONLY (auto use OURS)
   * BASE == OURS && BASE != THEIRS           -> THEIRS_ONLY (auto use THEIRS)
   * BASE != OURS && OURS == THEIRS           -> IDENTICAL_CHANGE (auto use common change)
   * BASE != OURS && BASE != THEIRS && OURS != THEIRS -> CONFLICT
   */
  public static evaluateThreeWayValue(
    baseVal: string | number | boolean | undefined,
    oursVal: string | number | boolean | undefined,
    theirsVal: string | number | boolean | undefined
  ): MergeDecisionType {
    const b = this.canonicalize(baseVal);
    const o = this.canonicalize(oursVal);
    const t = this.canonicalize(theirsVal);

    if (b === o && b === t) {
      return 'UNCHANGED';
    }
    if (b !== o && b === t) {
      return 'OURS_ONLY';
    }
    if (b === o && b !== t) {
      return 'THEIRS_ONLY';
    }
    if (b !== o && o === t) {
      return 'IDENTICAL_CHANGE';
    }
    return 'CONFLICT';
  }

  private static canonicalize(val: string | number | boolean | undefined): string {
    if (val === undefined || val === null) {
      return '__UNDEFINED__';
    }
    if (typeof val === 'string') {
      return `str:${val.replace(/\r\n/g, '\n').trim()}`;
    }
    return `${typeof val}:${String(val)}`;
  }
}
