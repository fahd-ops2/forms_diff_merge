import { DiffEngine } from '../diff/diff-engine';
import { RawExtractedFmb, RawExtractedItem } from '../fmb/models/fmb-models';
import { FmbNormalizer } from '../fmb/normalizer/fmb-normalizer';
import { FmbParser } from '../fmb/parser/fmb-parser';
import { ConflictDetector } from '../merge/conflict-detector';
import { ConflictResolver } from '../merge/conflict-resolver';
import { MergeEngine } from '../merge/merge-engine';

export interface TestCaseResult {
  id: string;
  name: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

function buildTestModel(fileName: string, items: RawExtractedItem[]) {
  const raw: RawExtractedFmb = {
    fileName,
    fileSize: 1024,
    moduleName: 'TEST_FORM',
    formsVersion: '12.2.1.4.0',
    extractionMethod: 'preset-fixture',
    formAttributes: { Title: 'Test Form' },
    items,
  };
  return FmbNormalizer.normalize(FmbParser.parse(raw));
}

export function runAllEngineTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // 1. UNCHANGED
  {
    const decision = ConflictDetector.evaluateThreeWayValue('Name', 'Name', 'Name');
    results.push({
      id: 'UNCHANGED',
      name: '3-Way Merge: UNCHANGED',
      scenario: 'BASE: Prompt="Name" | OURS: Prompt="Name" | THEIRS: Prompt="Name"',
      expected: 'UNCHANGED',
      actual: decision,
      passed: decision === 'UNCHANGED',
    });
  }

  // 2. OURS_ONLY
  {
    const decision = ConflictDetector.evaluateThreeWayValue(
      'Name',
      'Customer Name',
      'Name'
    );
    results.push({
      id: 'OURS_ONLY',
      name: '3-Way Merge: OURS_ONLY',
      scenario: 'BASE: Prompt="Name" | OURS: Prompt="Customer Name" | THEIRS: Prompt="Name"',
      expected: 'OURS_ONLY (Automatically use OURS)',
      actual:
        decision === 'OURS_ONLY'
          ? 'OURS_ONLY (Automatically use OURS)'
          : decision,
      passed: decision === 'OURS_ONLY',
    });
  }

  // 3. THEIRS_ONLY
  {
    const decision = ConflictDetector.evaluateThreeWayValue(
      'Name',
      'Name',
      'Client Name'
    );
    results.push({
      id: 'THEIRS_ONLY',
      name: '3-Way Merge: THEIRS_ONLY',
      scenario: 'BASE: Prompt="Name" | OURS: Prompt="Name" | THEIRS: Prompt="Client Name"',
      expected: 'THEIRS_ONLY (Automatically use THEIRS)',
      actual:
        decision === 'THEIRS_ONLY'
          ? 'THEIRS_ONLY (Automatically use THEIRS)'
          : decision,
      passed: decision === 'THEIRS_ONLY',
    });
  }

  // 4. IDENTICAL_CHANGE
  {
    const decision = ConflictDetector.evaluateThreeWayValue(
      150,
      180,
      180
    );
    results.push({
      id: 'IDENTICAL_CHANGE',
      name: '3-Way Merge: IDENTICAL_CHANGE',
      scenario: 'BASE: Width=150 | OURS: Width=180 | THEIRS: Width=180',
      expected: 'IDENTICAL_CHANGE (Use common change 180)',
      actual:
        decision === 'IDENTICAL_CHANGE'
          ? 'IDENTICAL_CHANGE (Use common change 180)'
          : decision,
      passed: decision === 'IDENTICAL_CHANGE',
    });
  }

  // 5. CONFLICT
  {
    const decision = ConflictDetector.evaluateThreeWayValue(
      'Name',
      'Customer Name',
      'Client Name'
    );
    results.push({
      id: 'CONFLICT',
      name: '3-Way Merge: CONFLICT',
      scenario: 'BASE: Prompt="Name" | OURS: Prompt="Customer Name" | THEIRS: Prompt="Client Name"',
      expected: 'CONFLICT',
      actual: decision,
      passed: decision === 'CONFLICT',
    });
  }

  // 6. ADDED_OBJECT
  {
    const m1 = buildTestModel('v1.fmb', [
      {
        type: 'BLOCK',
        name: 'CUSTOMER',
        parentPath: [],
        rawAttributes: { DatabaseDataBlock: true },
      },
    ]);
    const m2 = buildTestModel('v2.fmb', [
      {
        type: 'BLOCK',
        name: 'CUSTOMER',
        parentPath: [],
        rawAttributes: { DatabaseDataBlock: true },
      },
      {
        type: 'ITEM',
        name: 'EMAIL',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 220, Prompt: 'Email' },
      },
    ]);
    const diff = DiffEngine.compare(m1, m2);
    const emailObj = diff.objectDiffs.find((o) => o.id === 'ITEM:CUSTOMER.EMAIL');
    results.push({
      id: 'ADDED_OBJECT',
      name: 'Diff Engine: ADDED_OBJECT',
      scenario: 'ITEM:CUSTOMER.EMAIL added in NEW FMB',
      expected: 'status=ADDED, summary.added=1',
      actual: `status=${emailObj?.status}, summary.added=${diff.summary.added}`,
      passed: emailObj?.status === 'ADDED' && diff.summary.added === 1,
    });
  }

  // 7. REMOVED_OBJECT
  {
    const m1 = buildTestModel('v1.fmb', [
      {
        type: 'ITEM',
        name: 'OLD_CODE',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 80 },
      },
    ]);
    const m2 = buildTestModel('v2.fmb', []);
    const diff = DiffEngine.compare(m1, m2);
    const oldCodeObj = diff.objectDiffs.find((o) => o.id === 'ITEM:CUSTOMER.OLD_CODE');
    results.push({
      id: 'REMOVED_OBJECT',
      name: 'Diff Engine: REMOVED_OBJECT',
      scenario: 'ITEM:CUSTOMER.OLD_CODE removed in NEW FMB',
      expected: 'status=REMOVED, summary.removed=1',
      actual: `status=${oldCodeObj?.status}, summary.removed=${diff.summary.removed}`,
      passed: oldCodeObj?.status === 'REMOVED' && diff.summary.removed === 1,
    });
  }

  // 8. MODIFIED_PROPERTY
  {
    const m1 = buildTestModel('v1.fmb', [
      {
        type: 'ITEM',
        name: 'NAME',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 150, Prompt: 'Name' },
      },
    ]);
    const m2 = buildTestModel('v2.fmb', [
      {
        type: 'ITEM',
        name: 'NAME',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 180, Prompt: 'Customer Name' },
      },
    ]);
    const diff = DiffEngine.compare(m1, m2);
    const nameObj = diff.objectDiffs.find((o) => o.id === 'ITEM:CUSTOMER.NAME');
    const widthDiff = nameObj?.propertyDiffs.find((p) => p.key === 'Width');
    results.push({
      id: 'MODIFIED_PROPERTY',
      name: 'Diff Engine: MODIFIED_PROPERTY',
      scenario: 'CUSTOMER.NAME Width 150 → 180 and Prompt "Name" → "Customer Name"',
      expected: 'status=MODIFIED, 150 px → 180 px',
      actual: `status=${nameObj?.status}, ${widthDiff?.oldFormatted} → ${widthDiff?.newFormatted}`,
      passed:
        nameObj?.status === 'MODIFIED' &&
        widthDiff?.oldFormatted === '150 px' &&
        widthDiff?.newFormatted === '180 px',
    });
  }

  // 9. MULTIPLE_CONFLICTS
  {
    const base = buildTestModel('base.fmb', [
      {
        type: 'ITEM',
        name: 'NAME',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 150, Prompt: 'Name' },
      },
    ]);
    const ours = buildTestModel('ours.fmb', [
      {
        type: 'ITEM',
        name: 'NAME',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 180, Prompt: 'Customer Name' },
      },
    ]);
    const theirs = buildTestModel('theirs.fmb', [
      {
        type: 'ITEM',
        name: 'NAME',
        parentPath: ['CUSTOMER'],
        rawAttributes: { Width: 200, Prompt: 'Client Name' },
      },
    ]);
    const mergeRes = MergeEngine.analyzeThreeWayMerge(base, ours, theirs);
    const resolved1 = ConflictResolver.resolveConflict(
      mergeRes,
      mergeRes.conflicts[0].id,
      'KEEP_OURS'
    );
    const resolvedAll = ConflictResolver.resolveConflict(
      resolved1,
      mergeRes.conflicts[1].id,
      'KEEP_THEIRS'
    );
    results.push({
      id: 'MULTIPLE_CONFLICTS',
      name: '3-Way Merge: MULTIPLE_CONFLICTS & Resolution',
      scenario: 'Width (150/180/200) + Prompt (Name/Customer Name/Client Name) conflicts detected & resolved',
      expected: 'totalConflicts=2, remainingAfterResolve=0',
      actual: `totalConflicts=${mergeRes.summary.totalConflicts}, remainingAfterResolve=${resolvedAll.summary.remainingConflicts}`,
      passed:
        mergeRes.summary.totalConflicts === 2 &&
        resolvedAll.summary.remainingConflicts === 0,
    });
  }

  return results;
}
