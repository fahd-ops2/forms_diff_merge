import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Download,
  FileCode,
  FolderOpen,
  Edit3,
  Check,
} from 'lucide-react';
import {
  ConflictResolutionChoice,
  MergeValidationReport,
  ThreeWayMergeResult,
} from '../merge/merge-models';

interface MergeWorkspaceProps {
  result: ThreeWayMergeResult;
  isDark: boolean;
  onResolveConflict: (
    decisionId: string,
    choice: ConflictResolutionChoice,
    customValue?: string | number | boolean
  ) => void;
  onResolveAllRemaining: (choice: 'KEEP_OURS' | 'KEEP_THEIRS' | 'KEEP_BASE') => void;
  onUpdateOutputFileName: (name: string) => void;
  onValidateMerge: () => MergeValidationReport;
  onExportMergedFmb: () => void;
  onExportMergeReport: () => void;
  onPreviewMergeReport: () => void;
  onResetFiles: () => void;
}

export const MergeWorkspace: React.FC<MergeWorkspaceProps> = ({
  result,
  isDark,
  onResolveConflict,
  onResolveAllRemaining,
  onUpdateOutputFileName,
  onValidateMerge,
  onExportMergedFmb,
  onExportMergeReport,
  onPreviewMergeReport,
  onResetFiles,
}) => {
  const [activeConflictIndex, setActiveConflictIndex] = useState<number>(0);
  const [customInputMode, setCustomInputMode] = useState<boolean>(false);
  const [customDraftValue, setCustomDraftValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'conflicts' | 'auto' | 'summary'>(
    result.conflicts.length > 0 ? 'conflicts' : 'summary'
  );
  const [validationReport, setValidationReport] = useState<
    MergeValidationReport | undefined
  >(result.validation);
  const [exportBanner, setExportBanner] = useState<string | null>(null);

  const currentConflict = result.conflicts[activeConflictIndex];
  const allConflictsResolved = result.summary.remainingConflicts === 0;

  const handleSelectConflict = (index: number) => {
    setActiveConflictIndex(index);
    setCustomInputMode(false);
    const target = result.conflicts[index];
    if (target) {
      setCustomDraftValue(
        String(target.resolvedValue ?? target.oursValue ?? '')
      );
    }
  };

  const handleApplyResolution = (
    choice: ConflictResolutionChoice,
    customVal?: string | number | boolean
  ) => {
    if (!currentConflict) return;
    onResolveConflict(currentConflict.id, choice, customVal);
    setCustomInputMode(false);
    setValidationReport(undefined);
    setExportBanner(null);
  };

  const handleJumpToNextUnresolved = () => {
    const nextIdx = result.conflicts.findIndex(
      (c, idx) => idx > activeConflictIndex && !c.isResolved
    );
    if (nextIdx !== -1) {
      handleSelectConflict(nextIdx);
      return;
    }
    const firstUnresolved = result.conflicts.findIndex((c) => !c.isResolved);
    if (firstUnresolved !== -1) {
      handleSelectConflict(firstUnresolved);
    } else {
      setActiveTab('summary');
    }
  };

  const handleTriggerValidation = () => {
    const report = onValidateMerge();
    setValidationReport(report);
  };

  const handleTriggerExport = () => {
    const report = onValidateMerge();
    setValidationReport(report);
    if (!report.isValid) return;
    onExportMergedFmb();
    setExportBanner(
      `Exported validated merged module "${result.outputFileName}" (${result.summary.autoMergedTotal} auto-merged, ${result.summary.resolvedConflicts} conflicts resolved).`
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top Merge Status Header */}
      <div
        className={`px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">
              3-Way Merge Analysis · Module {result.oursModel.metadata.moduleName}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">BASE:</span>
              <span className="font-semibold">{result.baseModel.metadata.fileName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-blue-400">OURS:</span>
              <span className="font-semibold">{result.oursModel.metadata.fileName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-purple-400">THEIRS:</span>
              <span className="font-semibold">{result.theirsModel.metadata.fileName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFiles}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Select files
            </button>
            <button
              type="button"
              onClick={onPreviewMergeReport}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              View Report
            </button>
            <button
              type="button"
              onClick={onExportMergeReport}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export HTML Report
            </button>
          </div>
        </div>

        {/* Immediate Merge Analysis Complete Banner */}
        <div
          className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-6 text-sm tabular-nums">
            <span className="font-semibold">Merge analysis complete</span>
            <span
              className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              ✓ {result.summary.autoMergedTotal} changes can be merged automatically
            </span>
            {result.summary.remainingConflicts > 0 ? (
              <span
                className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                ⚠ {result.summary.remainingConflicts}{' '}
                {result.summary.remainingConflicts === 1 ? 'conflict requires' : 'conflicts require'}{' '}
                your decision
              </span>
            ) : (
              <span
                className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                ✓ 0 remaining conflicts — Merge ready to export
              </span>
            )}
          </div>

          {/* Navigation Tabs inside Merge Workspace */}
          <div
            className={`flex items-center gap-1 p-0.5 rounded border ${
              isDark
                ? 'bg-slate-950 border-slate-800'
                : 'bg-slate-100 border-slate-300/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('conflicts')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'conflicts'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-2xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conflicts ({result.summary.resolvedConflicts}/{result.summary.totalConflicts})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('auto')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'auto'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-2xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto-Merged ({result.summary.autoMergedTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-2xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Merge Summary &amp; Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {activeTab === 'conflicts' && (
          <>
            {result.conflicts.length === 0 ? (
              /* Empty State: No Conflicts */
              <div
                className={`p-8 rounded-lg border text-center ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h2 className="text-base font-semibold mb-1">✓ No conflicts</h2>
                <p className="text-xs text-slate-400 mb-4">
                  All {result.summary.autoMergedTotal} changes can be merged automatically without manual intervention.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className="px-4 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  Proceed to Merge Summary &amp; Export →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
                {/* Left Sidebar: Conflict Queue */}
                <div
                  className={`rounded-lg border overflow-hidden ${
                    isDark
                      ? 'border-slate-800 bg-slate-900/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 border-b flex items-center justify-between text-xs font-semibold ${
                      isDark
                        ? 'border-slate-800 bg-slate-900/80 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Conflicts ({result.conflicts.length})</span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {result.summary.remainingConflicts} remaining
                    </span>
                  </div>

                  <div
                    className={`divide-y ${
                      isDark ? 'divide-slate-800/70' : 'divide-slate-200'
                    }`}
                  >
                    {result.conflicts.map((c, idx) => {
                      const isSelected = idx === activeConflictIndex;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectConflict(idx)}
                          className={`w-full text-left px-3.5 py-3 transition-colors ${
                            isSelected
                              ? isDark
                                ? 'bg-blue-500/15'
                                : 'bg-blue-50'
                              : isDark
                              ? 'hover:bg-slate-800/50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs mb-1">
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              #{idx + 1} · {c.objectType}
                            </span>
                            {c.isResolved ? (
                              <span className="font-mono text-[11px] font-semibold text-emerald-400">
                                ✓ Resolved
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] font-semibold text-amber-400">
                                ⚠ Conflict
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs font-semibold truncate">
                            {c.displayPath}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {c.propertyLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Safe bulk resolution helper */}
                  <div
                    className={`p-3 border-t space-y-2 ${
                      isDark
                        ? 'border-slate-800 bg-slate-950/60'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      ✓ {result.summary.identicalChangeCount} identical changes in Ours &amp; Theirs were merged automatically.
                    </div>
                    {result.summary.remainingConflicts > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onResolveAllRemaining('KEEP_OURS')}
                          className={`w-full px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Resolve remaining with Ours
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Active Conflict Inspector Card */}
                {currentConflict && (
                  <div
                    className={`rounded-lg border p-6 ${
                      isDark
                        ? 'border-slate-800 bg-slate-900/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Conflict Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
                      <div>
                        <div className="font-mono text-xs font-bold tracking-wide text-amber-400 tabular-nums">
                          CONFLICT {activeConflictIndex + 1} OF {result.conflicts.length}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Both Ours and Theirs modified this value differently from Base.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activeConflictIndex === 0}
                          onClick={() =>
                            handleSelectConflict(Math.max(0, activeConflictIndex - 1))
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-40 ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={
                            activeConflictIndex === result.conflicts.length - 1
                          }
                          onClick={() =>
                            handleSelectConflict(
                              Math.min(
                                result.conflicts.length - 1,
                                activeConflictIndex + 1
                              )
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-40 ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Next
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Hierarchy Tree Path (CUSTOMER -> NAME -> Width) */}
                    <div
                      className={`my-4 p-3.5 rounded border font-mono text-xs leading-relaxed ${
                        isDark
                          ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {currentConflict.parentPath.length > 0 ? (
                        <>
                          <div className="font-semibold text-slate-300">
                            {currentConflict.parentPath[0]}
                          </div>
                          <div className="pl-2 text-slate-300">
                            └── <span className="font-semibold">{currentConflict.objectName}</span>
                          </div>
                          <div className="pl-6 text-amber-400 font-semibold">
                            └── {currentConflict.propertyLabel}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-300">
                            {currentConflict.objectType}: {currentConflict.objectName}
                          </div>
                          <div className="pl-2 text-amber-400 font-semibold">
                            └── {currentConflict.propertyLabel}
                          </div>
                        </>
                      )}
                    </div>

                    {/* BASE / OURS / THEIRS Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
                      {/* BASE */}
                      <div
                        className={`p-4 rounded border ${
                          currentConflict.resolvedChoice === 'KEEP_BASE'
                            ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                            : isDark
                            ? 'border-slate-800 bg-slate-950/60'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono font-bold text-slate-400">
                            BASE
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {result.baseModel.metadata.fileName}
                          </span>
                        </div>
                        <pre className="font-mono text-sm font-semibold whitespace-pre-wrap break-words">
                          {currentConflict.baseFormatted}
                        </pre>
                      </div>

                      {/* OURS */}
                      <div
                        className={`p-4 rounded border ${
                          currentConflict.resolvedChoice === 'KEEP_OURS'
                            ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                            : isDark
                            ? 'border-blue-900/50 bg-blue-950/20'
                            : 'border-blue-200 bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono font-bold text-blue-400">
                            OURS
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {result.oursModel.metadata.fileName}
                          </span>
                        </div>
                        <pre className="font-mono text-sm font-semibold whitespace-pre-wrap break-words">
                          {currentConflict.oursFormatted}
                        </pre>
                      </div>

                      {/* THEIRS */}
                      <div
                        className={`p-4 rounded border ${
                          currentConflict.resolvedChoice === 'KEEP_THEIRS'
                            ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                            : isDark
                            ? 'border-purple-900/50 bg-purple-950/20'
                            : 'border-purple-200 bg-purple-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono font-bold text-purple-400">
                            THEIRS
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {result.theirsModel.metadata.fileName}
                          </span>
                        </div>
                        <pre className="font-mono text-sm font-semibold whitespace-pre-wrap break-words">
                          {currentConflict.theirsFormatted}
                        </pre>
                      </div>
                    </div>

                    {/* Decision Action Buttons: [ Keep Ours ] [ Keep Theirs ] [ Keep Base ] [ Custom ] */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplyResolution('KEEP_OURS')}
                        className={`px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap ${
                          currentConflict.resolvedChoice === 'KEEP_OURS'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : isDark
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                            : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        Keep Ours
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyResolution('KEEP_THEIRS')}
                        className={`px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap ${
                          currentConflict.resolvedChoice === 'KEEP_THEIRS'
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : isDark
                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                            : 'border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        Keep Theirs
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyResolution('KEEP_BASE')}
                        className={`px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap ${
                          currentConflict.resolvedChoice === 'KEEP_BASE'
                            ? 'bg-slate-600 border-slate-500 text-white'
                            : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Keep Base
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomInputMode((prev) => !prev);
                          setCustomDraftValue(
                            String(
                              currentConflict.resolvedValue ??
                                currentConflict.oursValue ??
                                ''
                            )
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap ${
                          currentConflict.resolvedChoice === 'CUSTOM' || customInputMode
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Custom
                      </button>
                    </div>

                    {/* Custom Value / PL/SQL Editor */}
                    {customInputMode && (
                      <div
                        className={`mt-4 p-4 rounded border ${
                          isDark
                            ? 'border-slate-700 bg-slate-950'
                            : 'border-slate-300 bg-slate-50'
                        }`}
                      >
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Enter custom merged value for {currentConflict.displayPath} →{' '}
                          {currentConflict.propertyLabel}:
                        </label>
                        {currentConflict.targetKind === 'SOURCE_CODE' ? (
                          <textarea
                            rows={6}
                            value={customDraftValue}
                            onChange={(e) => setCustomDraftValue(e.target.value)}
                            className={`w-full p-2.5 text-xs font-mono rounded border outline-none ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={customDraftValue}
                            onChange={(e) => setCustomDraftValue(e.target.value)}
                            className={`w-full px-3 py-1.5 text-xs font-mono rounded border outline-none ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                            }`}
                          />
                        )}
                        <div className="mt-2.5 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomInputMode(false)}
                            className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const parsed =
                                typeof currentConflict.oursValue === 'number' &&
                                !Number.isNaN(Number(customDraftValue))
                                  ? Number(customDraftValue)
                                  : customDraftValue;
                              handleApplyResolution('CUSTOM', parsed);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Apply Custom Resolution
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Post-resolution feedback banner: ✓ Conflict resolved + Next conflict → */}
                    {currentConflict.isResolved && (
                      <div
                        className={`mt-5 p-3.5 rounded border flex flex-wrap items-center justify-between gap-4 ${
                          isDark
                            ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        }`}
                      >
                        <div className="text-xs">
                          <span className="font-semibold">✓ Conflict resolved</span> ·
                          Result will use{' '}
                          <span className="font-mono font-semibold">
                            {currentConflict.resolvedFormatted}
                          </span>{' '}
                          ({currentConflict.resolvedChoice})
                        </div>

                        {result.summary.remainingConflicts > 0 ? (
                          <button
                            type="button"
                            onClick={handleJumpToNextUnresolved}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                          >
                            Next conflict
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('summary')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                          >
                            All conflicts resolved — Review &amp; Export
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'auto' && (
          <div
            className={`rounded-lg border overflow-hidden ${
              isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <h3 className="text-xs font-semibold">
                  Automatically Merged Changes ({result.autoMergedDecisions.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Non-conflicting changes from Ours ({result.summary.oursOnlyCount}), Theirs ({result.summary.theirsOnlyCount}), and identical updates ({result.summary.identicalChangeCount}).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={
                      isDark
                        ? 'bg-slate-900/60 text-slate-400 border-b border-slate-800'
                        : 'bg-slate-100 text-slate-600 border-b border-slate-200'
                    }
                  >
                    <th className="py-2 px-4 font-medium">Object</th>
                    <th className="py-2 px-4 font-medium">Property / Target</th>
                    <th className="py-2 px-4 font-medium">3-Way Rule</th>
                    <th className="py-2 px-4 font-medium">BASE</th>
                    <th className="py-2 px-4 font-medium">MERGED VALUE</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y font-mono ${
                    isDark ? 'divide-slate-800/70' : 'divide-slate-200'
                  }`}
                >
                  {result.autoMergedDecisions.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 px-4 font-semibold">{d.displayPath}</td>
                      <td className="py-2 px-4 font-sans">{d.propertyLabel}</td>
                      <td className="py-2 px-4 text-slate-400">{d.decisionType}</td>
                      <td className="py-2 px-4 text-slate-400 truncate max-w-[200px]">
                        {d.baseFormatted}
                      </td>
                      <td className="py-2 px-4 text-emerald-400 font-semibold truncate max-w-[240px]">
                        {d.resolvedFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Merge Summary Card (Always shown in Summary tab or below conflicts when all resolved) */}
        {(activeTab === 'summary' || allConflictsResolved) && (
          <div
            className={`max-w-xl mx-auto rounded-lg border p-6 ${
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <h2 className="text-base font-semibold">
                {allConflictsResolved ? 'Merge ready' : 'Merge status'}
              </h2>
              {allConflictsResolved ? (
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  ✓ Ready for export
                </span>
              ) : (
                <span className="font-mono text-xs text-amber-400 font-semibold">
                  ⚠ {result.summary.remainingConflicts} unresolved conflict(s)
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-sm tabular-nums mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">✓ Automatically merged</span>
                <span className="font-mono font-bold text-emerald-400">
                  {result.summary.autoMergedTotal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">✓ Conflicts resolved</span>
                <span className="font-mono font-bold text-blue-400">
                  {result.summary.resolvedConflicts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {result.summary.remainingConflicts === 0 ? '✓' : '⚠'} Remaining
                  conflicts
                </span>
                <span
                  className={`font-mono font-bold ${
                    result.summary.remainingConflicts === 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {result.summary.remainingConflicts}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Output (never overwrites original files):
              </label>
              <input
                type="text"
                value={result.outputFileName}
                onChange={(e) => onUpdateOutputFileName(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs font-mono rounded border outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
            </div>

            {/* Validation Results */}
            {validationReport && (
              <div
                className={`mb-5 p-3.5 rounded border text-xs space-y-2 ${
                  validationReport.isValid
                    ? isDark
                      ? 'border-emerald-800/60 bg-emerald-950/25'
                      : 'border-emerald-200 bg-emerald-50'
                    : isDark
                    ? 'border-rose-800/60 bg-rose-950/25'
                    : 'border-rose-200 bg-rose-50'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {validationReport.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>
                    {validationReport.isValid
                      ? 'Pre-export Oracle Forms structural validation passed'
                      : 'Validation blocked — resolve issues below before exporting'}
                  </span>
                </div>
                <div className="space-y-1 pl-5">
                  {validationReport.checks.map((chk) => (
                    <div key={chk.id} className="flex items-baseline gap-2">
                      <span
                        className={`font-mono font-bold ${
                          chk.passed ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {chk.passed ? '✓' : '×'}
                      </span>
                      <div>
                        <span className="font-medium">{chk.label}:</span>{' '}
                        <span className="text-slate-400">{chk.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exportBanner && (
              <div
                className={`mb-4 p-3 rounded border text-xs ${
                  isDark
                    ? 'border-blue-800/60 bg-blue-950/30 text-blue-200'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
                }`}
              >
                ✓ {exportBanner}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleTriggerValidation}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Validate
              </button>

              <button
                type="button"
                disabled={!allConflictsResolved}
                onClick={handleTriggerExport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Export merged FMB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
