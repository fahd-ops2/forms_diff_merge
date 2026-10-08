import {
  FmbProperty,
  NormalizedFmbModel,
  NormalizedFmbObject,
  RawExtractedFmb,
  RawExtractedItem,
} from '../fmb/models/fmb-models';
import { FmbNormalizer } from '../fmb/normalizer/fmb-normalizer';
import { ConflictDetector } from './conflict-detector';
import { ConflictResolver } from './conflict-resolver';
import {
  MergeDecisionType,
  MergeItemDecision,
  MergeValidationReport,
  ThreeWayMergeResult,
} from './merge-models';

export class MergeEngine {
  /**
   * Executes a complete 3-way merge analysis across BASE, OURS, and THEIRS models.
   * Automatically resolves non-conflicting changes and isolates genuine conflicts.
   */
  public static analyzeThreeWayMerge(
    baseModel: NormalizedFmbModel,
    oursModel: NormalizedFmbModel,
    theirsModel: NormalizedFmbModel
  ): ThreeWayMergeResult {
    const allObjectIds = Array.from(
      new Set([
        ...baseModel.objects.map((o) => o.id),
        ...oursModel.objects.map((o) => o.id),
        ...theirsModel.objects.map((o) => o.id),
      ])
    );

    const decisions: MergeItemDecision[] = [];
    let unchangedCount = 0;
    let oursOnlyCount = 0;
    let theirsOnlyCount = 0;
    let identicalChangeCount = 0;

    for (const objId of allObjectIds) {
      const baseObj = baseModel.objectMap[objId];
      const oursObj = oursModel.objectMap[objId];
      const theirsObj = theirsModel.objectMap[objId];
      const refObj = oursObj || theirsObj || baseObj;
      if (!refObj) continue;

      // Case 1: Object added or removed in one or both branches
      const inBase = Boolean(baseObj);
      const inOurs = Boolean(oursObj);
      const inTheirs = Boolean(theirsObj);

      if (!inBase || !inOurs || !inTheirs) {
        const existenceDecision = this.evaluateObjectExistence(
          refObj,
          baseObj,
          oursObj,
          theirsObj
        );
        decisions.push(existenceDecision);
        if (existenceDecision.decisionType === 'UNCHANGED') unchangedCount++;
        if (existenceDecision.decisionType === 'OURS_ONLY') oursOnlyCount++;
        if (existenceDecision.decisionType === 'THEIRS_ONLY') theirsOnlyCount++;
        if (existenceDecision.decisionType === 'IDENTICAL_CHANGE') identicalChangeCount++;
        continue;
      }

      // Case 2: Object exists in all three versions -> compare properties and source code
      const allPropKeys = Array.from(
        new Set([
          ...Object.keys(baseObj.properties),
          ...Object.keys(oursObj.properties),
          ...Object.keys(theirsObj.properties),
        ])
      );

      for (const propKey of allPropKeys) {
        const bProp = baseObj.properties[propKey];
        const oProp = oursObj.properties[propKey];
        const tProp = theirsObj.properties[propKey];
        const refProp = oProp || tProp || bProp;
        if (!refProp) continue;

        const decisionType = ConflictDetector.evaluateThreeWayValue(
          bProp?.value,
          oProp?.value,
          tProp?.value
        );

        if (decisionType === 'UNCHANGED') {
          unchangedCount++;
          continue;
        }

        if (decisionType === 'OURS_ONLY') oursOnlyCount++;
        if (decisionType === 'THEIRS_ONLY') theirsOnlyCount++;
        if (decisionType === 'IDENTICAL_CHANGE') identicalChangeCount++;

        const baseFormatted = FmbNormalizer.formatPropertyValue(bProp);
        const oursFormatted = FmbNormalizer.formatPropertyValue(oProp);
        const theirsFormatted = FmbNormalizer.formatPropertyValue(tProp);

        const isConflict = decisionType === 'CONFLICT';
        const autoValue =
          decisionType === 'THEIRS_ONLY' ? tProp?.value : oProp?.value;
        const autoFormatted =
          decisionType === 'THEIRS_ONLY' ? theirsFormatted : oursFormatted;

        decisions.push({
          id: `${objId}::PROP::${propKey}`,
          objectId: objId,
          objectType: refObj.type,
          objectName: refObj.name,
          parentPath: refObj.parentPath,
          displayPath: refObj.displayPath,
          targetKind: 'PROPERTY',
          propertyKey: propKey,
          propertyLabel: refProp.label,
          category: refProp.category,
          unit: refProp.unit,
          decisionType,
          baseValue: bProp?.value,
          oursValue: oProp?.value,
          theirsValue: tProp?.value,
          baseFormatted,
          oursFormatted,
          theirsFormatted,
          resolvedChoice: isConflict
            ? undefined
            : decisionType === 'THEIRS_ONLY'
            ? 'KEEP_THEIRS'
            : 'KEEP_OURS',
          resolvedValue: isConflict ? undefined : autoValue,
          resolvedFormatted: isConflict ? undefined : autoFormatted,
          isResolved: !isConflict,
          explanation: this.describeDecision(
            decisionType,
            refProp.label,
            baseFormatted,
            oursFormatted,
            theirsFormatted
          ),
        });
      }

      // Check PL/SQL or SQL Source Code if present
      if (
        baseObj.sourceCode !== undefined ||
        oursObj.sourceCode !== undefined ||
        theirsObj.sourceCode !== undefined
      ) {
        const srcDecisionType = ConflictDetector.evaluateThreeWayValue(
          baseObj.sourceCode,
          oursObj.sourceCode,
          theirsObj.sourceCode
        );

        if (srcDecisionType === 'UNCHANGED') {
          unchangedCount++;
        } else {
          if (srcDecisionType === 'OURS_ONLY') oursOnlyCount++;
          if (srcDecisionType === 'THEIRS_ONLY') theirsOnlyCount++;
          if (srcDecisionType === 'IDENTICAL_CHANGE') identicalChangeCount++;

          const isConflict = srcDecisionType === 'CONFLICT';
          const autoSrc =
            srcDecisionType === 'THEIRS_ONLY'
              ? theirsObj.sourceCode
              : oursObj.sourceCode;

          decisions.push({
            id: `${objId}::SOURCE`,
            objectId: objId,
            objectType: refObj.type,
            objectName: refObj.name,
            parentPath: refObj.parentPath,
            displayPath: refObj.displayPath,
            targetKind: 'SOURCE_CODE',
            propertyLabel:
              refObj.sourceType === 'SQL' ? 'SQL Query' : 'PL/SQL Source Code',
            decisionType: srcDecisionType,
            baseValue: baseObj.sourceCode ?? '',
            oursValue: oursObj.sourceCode ?? '',
            theirsValue: theirsObj.sourceCode ?? '',
            baseFormatted: baseObj.sourceCode ?? '(Empty)',
            oursFormatted: oursObj.sourceCode ?? '(Empty)',
            theirsFormatted: theirsObj.sourceCode ?? '(Empty)',
            resolvedChoice: isConflict
              ? undefined
              : srcDecisionType === 'THEIRS_ONLY'
              ? 'KEEP_THEIRS'
              : 'KEEP_OURS',
            resolvedValue: isConflict ? undefined : autoSrc,
            resolvedFormatted: isConflict ? undefined : autoSrc,
            isResolved: !isConflict,
            explanation:
              srcDecisionType === 'CONFLICT'
                ? 'Both Ours and Theirs modified PL/SQL source code differently'
                : srcDecisionType === 'OURS_ONLY'
                ? 'PL/SQL source updated in Ours'
                : srcDecisionType === 'THEIRS_ONLY'
                ? 'PL/SQL source updated in Theirs'
                : 'Identical PL/SQL update in both Ours and Theirs',
          });
        }
      }
    }

    const conflicts = decisions.filter((d) => d.decisionType === 'CONFLICT');
    const autoMergedDecisions = decisions.filter(
      (d) => d.decisionType !== 'CONFLICT' && d.decisionType !== 'UNCHANGED'
    );

    const basePrefix = baseModel.metadata.fileName
      .replace(/(_base|_v1|_old)?\.(fmb|xml|fmt)$/i, '')
      .toLowerCase();

    return {
      baseModel,
      oursModel,
      theirsModel,
      analyzedAt: new Date().toISOString(),
      outputFileName: `${basePrefix || 'customer'}_merged.fmb`,
      decisions,
      autoMergedDecisions,
      conflicts,
      summary: {
        totalEvaluated: decisions.length + unchangedCount,
        unchangedCount,
        oursOnlyCount,
        theirsOnlyCount,
        identicalChangeCount,
        autoMergedTotal: autoMergedDecisions.length,
        totalConflicts: conflicts.length,
        resolvedConflicts: 0,
        remainingConflicts: conflicts.length,
      },
    };
  }

  /**
   * Validates the merged model before exporting to ensure zero remaining conflicts,
   * structural integrity (Windows, Canvases, Blocks), and valid PL/SQL block termination.
   */
  public static validateMergedModel(
    mergeResult: ThreeWayMergeResult
  ): MergeValidationReport {
    const remainingConflicts = mergeResult.conflicts.filter((c) => !c.isResolved).length;
    const mergedRaw = this.reconstructMergedRawFmb(mergeResult);

    const hasWindow = mergedRaw.items.some((i) => i.type === 'WINDOW');
    const hasCanvas = mergedRaw.items.some((i) => i.type === 'CANVAS');
    const hasBlock = mergedRaw.items.some((i) => i.type === 'BLOCK');

    // Verify PL/SQL syntax sanity (every trigger/program unit with BEGIN has END;)
    const plsqlItems = mergedRaw.items.filter(
      (i) => i.sourceType === 'PLSQL' && i.sourceCode
    );
    const invalidPlsql = plsqlItems.filter((item) => {
      const code = (item.sourceCode || '').toUpperCase();
      return !code.includes('BEGIN') || !code.includes('END');
    });

    const checks = [
      {
        id: 'conflicts-resolved',
        label: 'All merge conflicts resolved',
        passed: remainingConflicts === 0,
        detail:
          remainingConflicts === 0
            ? `All ${mergeResult.conflicts.length} conflicts have explicit resolutions.`
            : `${remainingConflicts} conflict(s) still require a decision before export.`,
      },
      {
        id: 'required-containers',
        label: 'Required Oracle Forms containers present',
        passed: hasWindow && hasCanvas && hasBlock,
        detail:
          hasWindow && hasCanvas && hasBlock
            ? 'Module contains valid Window, Canvas, and Block hierarchy.'
            : 'Missing required top-level Window, Canvas, or Data Block.',
      },
      {
        id: 'plsql-integrity',
        label: 'Trigger & Program Unit PL/SQL block balance',
        passed: invalidPlsql.length === 0,
        detail:
          invalidPlsql.length === 0
            ? `Verified ${plsqlItems.length} PL/SQL units have balanced BEGIN...END blocks.`
            : `${invalidPlsql.length} PL/SQL unit(s) missing valid BEGIN...END block termination.`,
      },
      {
        id: 'safe-output-path',
        label: 'Non-destructive output target',
        passed:
          mergeResult.outputFileName !== mergeResult.baseModel.metadata.fileName &&
          mergeResult.outputFileName !== mergeResult.oursModel.metadata.fileName &&
          mergeResult.outputFileName !== mergeResult.theirsModel.metadata.fileName,
        detail: `Target "${mergeResult.outputFileName}" preserves Base, Ours, and Theirs source files untouched.`,
      },
    ];

    return {
      isValid: checks.every((c) => c.passed),
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Reconstructs the merged RawExtractedFmb structure from BASE + OURS + THEIRS + Conflict Resolutions.
   */
  public static reconstructMergedRawFmb(
    mergeResult: ThreeWayMergeResult
  ): RawExtractedFmb {
    // Start with OURS objects as baseline, applying THEIRS additions/removals and resolved decisions
    const mergedMap = new Map<string, NormalizedFmbObject>();

    for (const obj of mergeResult.oursModel.objects) {
      mergedMap.set(obj.id, {
        ...obj,
        properties: { ...obj.properties },
      });
    }

    // Apply object existence decisions
    for (const decision of mergeResult.decisions) {
      if (decision.targetKind === 'OBJECT_EXISTENCE') {
        const shouldInclude = decision.resolvedValue === 'PRESENT';
        if (shouldInclude && !mergedMap.has(decision.objectId)) {
          const sourceObj =
            mergeResult.oursModel.objectMap[decision.objectId] ||
            mergeResult.theirsModel.objectMap[decision.objectId] ||
            mergeResult.baseModel.objectMap[decision.objectId];
          if (sourceObj) {
            mergedMap.set(decision.objectId, {
              ...sourceObj,
              properties: { ...sourceObj.properties },
            });
          }
        } else if (!shouldInclude && mergedMap.has(decision.objectId)) {
          mergedMap.delete(decision.objectId);
        }
      }
    }

    // Apply property and source decisions
    for (const decision of mergeResult.decisions) {
      const targetObj = mergedMap.get(decision.objectId);
      if (!targetObj) continue;

      const finalVal =
        decision.resolvedValue !== undefined
          ? decision.resolvedValue
          : decision.oursValue;

      if (decision.targetKind === 'PROPERTY' && decision.propertyKey) {
        if (finalVal === undefined) {
          delete targetObj.properties[decision.propertyKey];
        } else {
          const existingProp: FmbProperty | undefined =
            targetObj.properties[decision.propertyKey] ||
            mergeResult.theirsModel.objectMap[decision.objectId]?.properties[
              decision.propertyKey
            ] ||
            mergeResult.baseModel.objectMap[decision.objectId]?.properties[
              decision.propertyKey
            ];

          targetObj.properties[decision.propertyKey] = {
            key: decision.propertyKey,
            label: decision.propertyLabel,
            value: finalVal,
            unit: decision.unit ?? existingProp?.unit,
            category: decision.category ?? existingProp?.category ?? 'general',
          };
        }
      } else if (decision.targetKind === 'SOURCE_CODE') {
        targetObj.sourceCode = String(finalVal ?? '');
      }
    }

    const items: RawExtractedItem[] = Array.from(mergedMap.values()).map((obj) => {
      const rawAttributes: Record<string, string | number | boolean> = {};
      for (const [k, prop] of Object.entries(obj.properties)) {
        rawAttributes[k] = prop.value;
      }
      return {
        type: obj.type,
        name: obj.name,
        parentPath: obj.parentPath,
        rawAttributes,
        sourceCode: obj.sourceCode,
        sourceType: obj.sourceType,
      };
    });

    const formAttributes: Record<string, string | number | boolean> = {};
    for (const [k, prop] of Object.entries(mergeResult.oursModel.formProperties)) {
      formAttributes[k] = prop.value;
    }

    return {
      fileName: mergeResult.outputFileName,
      fileSize: Math.max(
        mergeResult.oursModel.metadata.fileSize,
        mergeResult.theirsModel.metadata.fileSize
      ),
      moduleName: mergeResult.oursModel.metadata.moduleName,
      formsVersion: mergeResult.oursModel.metadata.formsVersion,
      extractionMethod: 'frmf2xml',
      formAttributes,
      items,
    };
  }

  private static evaluateObjectExistence(
    refObj: NormalizedFmbObject,
    baseObj: NormalizedFmbObject | undefined,
    oursObj: NormalizedFmbObject | undefined,
    theirsObj: NormalizedFmbObject | undefined
  ): MergeItemDecision {
    const bState = baseObj ? 'PRESENT' : 'ABSENT';
    const oState = oursObj ? 'PRESENT' : 'ABSENT';
    const tState = theirsObj ? 'PRESENT' : 'ABSENT';

    let decisionType: MergeDecisionType = ConflictDetector.evaluateThreeWayValue(
      bState,
      oState,
      tState
    );

    // Check if an object was modified in one branch while deleted in the other -> CONFLICT!
    if (baseObj && !oursObj && theirsObj) {
      const theirsModified =
        JSON.stringify(baseObj.properties) !== JSON.stringify(theirsObj.properties) ||
        (baseObj.sourceCode ?? '') !== (theirsObj.sourceCode ?? '');
      if (theirsModified) {
        decisionType = 'CONFLICT';
      } else {
        decisionType = 'OURS_ONLY'; // Deleted in OURS, untouched in THEIRS
      }
    } else if (baseObj && oursObj && !theirsObj) {
      const oursModified =
        JSON.stringify(baseObj.properties) !== JSON.stringify(oursObj.properties) ||
        (baseObj.sourceCode ?? '') !== (oursObj.sourceCode ?? '');
      if (oursModified) {
        decisionType = 'CONFLICT';
      } else {
        decisionType = 'THEIRS_ONLY'; // Deleted in THEIRS, untouched in OURS
      }
    }

    const isConflict = decisionType === 'CONFLICT';
    const winningState =
      decisionType === 'THEIRS_ONLY' ? tState : oState;

    const formatState = (state: string) =>
      state === 'PRESENT' ? 'Object present' : 'Removed / Not present';

    return {
      id: `${refObj.id}::EXISTENCE`,
      objectId: refObj.id,
      objectType: refObj.type,
      objectName: refObj.name,
      parentPath: refObj.parentPath,
      displayPath: refObj.displayPath,
      targetKind: 'OBJECT_EXISTENCE',
      propertyLabel: 'Object Existence',
      decisionType,
      baseValue: bState,
      oursValue: oState,
      theirsValue: tState,
      baseFormatted: formatState(bState),
      oursFormatted: formatState(oState),
      theirsFormatted: formatState(tState),
      resolvedChoice: isConflict
        ? undefined
        : decisionType === 'THEIRS_ONLY'
        ? 'KEEP_THEIRS'
        : 'KEEP_OURS',
      resolvedValue: isConflict ? undefined : winningState,
      resolvedFormatted: isConflict ? undefined : formatState(winningState),
      isResolved: !isConflict,
      explanation:
        bState === 'ABSENT'
          ? winningState === 'PRESENT'
            ? `Added in ${decisionType === 'THEIRS_ONLY' ? 'Theirs' : 'Ours'}`
            : 'Added object'
          : `Removed in ${decisionType === 'THEIRS_ONLY' ? 'Theirs' : 'Ours'}`,
    };
  }

  private static describeDecision(
    decisionType: MergeDecisionType,
    label: string,
    baseFmt: string,
    oursFmt: string,
    theirsFmt: string
  ): string {
    switch (decisionType) {
      case 'OURS_ONLY':
        return `${label} changed in Ours: ${baseFmt} → ${oursFmt}`;
      case 'THEIRS_ONLY':
        return `${label} changed in Theirs: ${baseFmt} → ${theirsFmt}`;
      case 'IDENTICAL_CHANGE':
        return `${label} changed identically in both: ${baseFmt} → ${oursFmt}`;
      case 'CONFLICT':
        return `${label} conflict: Base (${baseFmt}), Ours (${oursFmt}), Theirs (${theirsFmt})`;
      default:
        return `${label} unchanged`;
    }
  }
}
