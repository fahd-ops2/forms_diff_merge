import { NormalizedFmbModel } from '../fmb/models/fmb-models';
import {
  ChangeStatus,
  FmbComparisonResult,
  ObjectDiffEntry,
} from './diff-models';
import { PropertyDiffCalculator } from './property-diff';

export class DiffEngine {
  /**
   * Compares two NormalizedFmbModel instances and returns a complete,
   * hierarchical semantic comparison result.
   */
  public static compare(
    oldModel: NormalizedFmbModel,
    newModel: NormalizedFmbModel
  ): FmbComparisonResult {
    const formPropertyDiffs = PropertyDiffCalculator.compareProperties(
      oldModel.formProperties,
      newModel.formProperties
    );

    const allIds = Array.from(
      new Set([
        ...oldModel.objects.map((o) => o.id),
        ...newModel.objects.map((o) => o.id),
      ])
    );

    const objectDiffs: ObjectDiffEntry[] = [];
    let added = 0;
    let removed = 0;
    let modified = 0;
    let unchanged = 0;
    let changedPropertyTotal = 0;
    let changedTriggersCount = 0;
    let changedProgramUnitsCount = 0;

    for (const id of allIds) {
      const oldObj = oldModel.objectMap[id];
      const newObj = newModel.objectMap[id];
      const refObj = newObj || oldObj;
      if (!refObj) continue;

      const propertyDiffs = PropertyDiffCalculator.compareProperties(
        oldObj?.properties ?? {},
        newObj?.properties ?? {}
      );

      const changedPropertyCount = propertyDiffs.filter(
        (p) => p.status !== 'UNCHANGED'
      ).length;

      const sourceDiff = PropertyDiffCalculator.compareSourceCode(
        oldObj?.sourceCode,
        newObj?.sourceCode,
        refObj.sourceType ?? 'PLSQL'
      );

      let status: ChangeStatus = 'UNCHANGED';
      if (!oldObj && newObj) {
        status = 'ADDED';
        added++;
      } else if (oldObj && !newObj) {
        status = 'REMOVED';
        removed++;
      } else if (
        changedPropertyCount > 0 ||
        (sourceDiff && sourceDiff.status !== 'UNCHANGED')
      ) {
        status = 'MODIFIED';
        modified++;
      } else {
        status = 'UNCHANGED';
        unchanged++;
      }

      if (status !== 'UNCHANGED') {
        changedPropertyTotal += changedPropertyCount;
        if (refObj.type === 'TRIGGER') changedTriggersCount++;
        if (refObj.type === 'PROGRAM_UNIT') changedProgramUnitsCount++;
      }

      const headlineSummary = this.buildHeadlineSummary(
        status,
        propertyDiffs,
        sourceDiff
      );

      objectDiffs.push({
        id,
        type: refObj.type,
        name: refObj.name,
        parentPath: refObj.parentPath,
        displayPath: refObj.displayPath,
        groupKey: refObj.groupKey,
        groupLabel: refObj.groupLabel,
        status,
        oldObject: oldObj,
        newObject: newObj,
        propertyDiffs,
        changedPropertyCount,
        sourceDiff,
        headlineSummary,
      });
    }

    return {
      oldModel,
      newModel,
      comparedAt: new Date().toISOString(),
      summary: {
        added,
        removed,
        modified,
        unchanged,
        totalObjects: objectDiffs.length,
        changedPropertyTotal,
        changedTriggersCount,
        changedProgramUnitsCount,
      },
      formPropertyDiffs,
      objectDiffs,
    };
  }

  private static buildHeadlineSummary(
    status: ChangeStatus,
    propertyDiffs: ObjectDiffEntry['propertyDiffs'],
    sourceDiff?: ObjectDiffEntry['sourceDiff']
  ): string {
    if (status === 'ADDED') {
      return 'New object added to module';
    }
    if (status === 'REMOVED') {
      return 'Object removed from module';
    }
    if (status === 'UNCHANGED') {
      return 'No changes';
    }

    const changedProps = propertyDiffs.filter((p) => p.status !== 'UNCHANGED');
    if (sourceDiff && sourceDiff.status !== 'UNCHANGED' && changedProps.length === 0) {
      return sourceDiff.summaryText;
    }
    if (changedProps.length === 1 && (!sourceDiff || sourceDiff.status === 'UNCHANGED')) {
      return changedProps[0].summaryText;
    }
    const parts: string[] = [];
    if (changedProps.length > 0) {
      parts.push(`${changedProps.length} ${changedProps.length === 1 ? 'property' : 'properties'} changed`);
    }
    if (sourceDiff && sourceDiff.status !== 'UNCHANGED') {
      parts.push(sourceDiff.summaryText);
    }
    return parts.join(' · ');
  }
}
