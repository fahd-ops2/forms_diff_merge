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
import { useI18n } from '../i18n/translations';
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
  const { t } = useI18n();
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
      `${result.outputFileName} (${result.summary.autoMergedTotal} auto, ${result.summary.resolvedConflicts} resolved)`
    );
  };

  const btnClass = isDark
    ? 'border-[#34363d] bg-[#25272c] text-zinc-200 hover:bg-[#2f3138]'
    : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top 3-Way Path Bar & Merge Analysis Strip */}
      <div
        className={`px-4 py-2 border-b ${
          isDark ? 'border-[#2b2d32] bg-[#1e1f23]' : 'border-zinc-300 bg-zinc-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-1.5 py-0.5 border border-zinc-600/50 text-[10px] font-semibold text-zinc-400">
              {t.mergeHome.baseLabel}
            </span>
            <span className="font-semibold">{result.baseModel.metadata.fileName}</span>
            <span className="text-zinc-500">·</span>
            <span className="px-1.5 py-0.5 border border-sky-500/40 text-[10px] font-semibold text-sky-400">
              {t.mergeHome.oursLabel}
            </span>
            <span className="font-semibold">{result.oursModel.metadata.fileName}</span>
            <span className="text-zinc-500">·</span>
            <span className="px-1.5 py-0.5 border border-amber-500/40 text-[10px] font-semibold text-amber-400">
              {t.mergeHome.theirsLabel}
            </span>
            <span className="font-semibold">{result.theirsModel.metadata.fileName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResetFiles}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnClass}`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t.toolbar.openFiles}
            </button>
            <button
              type="button"
              onClick={onPreviewMergeReport}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnClass}`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {t.toolbar.viewReport}
            </button>
            <button
              type="button"
              onClick={onExportMergeReport}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-zinc-400 bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {t.toolbar.exportReport}
            </button>
          </div>
        </div>

        {/* Merge Status Banner */}
        <div
          className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'border-[#2b2d32]' : 'border-zinc-300'
          }`}
        >
          <div className="flex flex-wrap items-center gap-5 text-xs tabular-nums">
            <span className="font-semibold">{t.mergeView.analysisComplete}</span>
            <span
              className={`font-mono font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              ✓ {result.summary.autoMergedTotal} {t.mergeView.autoMergeCountMsg}
            </span>
            {result.summary.remainingConflicts > 0 ? (
              <span
                className={`font-mono font-semibold ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                ⚠ {result.summary.remainingConflicts}{' '}
                {t.mergeView.conflictsRequireDecisionMsg}
              </span>
            ) : (
              <span
                className={`font-mono font-semibold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                ✓ {t.mergeView.zeroConflictsReadyMsg}
              </span>
            )}
          </div>

          <div
            className={`flex items-center border ${
              isDark ? 'border-[#2e3036] bg-[#121316]' : 'border-zinc-300 bg-zinc-200/70'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('conflicts')}
              className={`px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'conflicts'
                  ? isDark
                    ? 'bg-[#2b2d34] text-white font-semibold'
                    : 'bg-white text-zinc-950 font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {t.mergeView.tabConflicts} ({result.summary.resolvedConflicts}/
              {result.summary.totalConflicts})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('auto')}
              className={`px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'auto'
                  ? isDark
                    ? 'bg-[#2b2d34] text-white font-semibold'
                    : 'bg-white text-zinc-950 font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {t.mergeView.tabAutoMerged} ({result.summary.autoMergedTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? isDark
                    ? 'bg-[#2b2d34] text-white font-semibold'
                    : 'bg-white text-zinc-950 font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {t.mergeView.tabSummary}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Dock */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'conflicts' && (
          <>
            {result.conflicts.length === 0 ? (
              <div
                className={`max-w-md mx-auto my-12 p-6 border text-center ${
                  isDark
                    ? 'border-[#2e3036] bg-[#18191c]'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <h2 className="text-sm font-semibold mb-1">
                  {t.mergeView.noConflictsTitle}
                </h2>
                <p className="text-xs text-zinc-400 mb-4">
                  {t.mergeView.noConflictsDesc} ({result.summary.autoMergedTotal})
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-1.5 text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-zinc-300 bg-zinc-100 text-zinc-950 hover:bg-white'
                      : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {t.mergeView.proceedToExportBtn}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                {/* Left Dock: Conflict List Queue */}
                <aside
                  className={`w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col ${
                    isDark
                      ? 'border-[#2b2d32] bg-[#18191c]'
                      : 'border-zinc-300 bg-zinc-100/70'
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between text-xs font-mono font-semibold ${
                      isDark
                        ? 'border-[#2b2d32] bg-[#1e1f23] text-zinc-300'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>
                      {t.mergeView.tabConflicts} ({result.conflicts.length})
                    </span>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {result.summary.remainingConflicts} {t.mergeView.remainingCount}
                    </span>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto divide-y ${
                      isDark ? 'divide-[#26282d]' : 'divide-zinc-200'
                    }`}
                  >
                    {result.conflicts.map((c, idx) => {
                      const isSelected = idx === activeConflictIndex;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectConflict(idx)}
                          className={`w-full text-left px-3 py-2.5 transition-colors ${
                            isSelected
                              ? isDark
                                ? 'bg-[#282a30] border-l-2 border-l-amber-400'
                                : 'bg-white border-l-2 border-l-zinc-900'
                              : isDark
                              ? 'hover:bg-[#202227]'
                              : 'hover:bg-zinc-200/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                              #{idx + 1} · {c.objectType}
                            </span>
                            {c.isResolved ? (
                              <span className="font-mono text-[11px] font-semibold text-emerald-400">
                                ✓ {t.summary.resolved}
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] font-semibold text-amber-400">
                                ⚠ {t.summary.conflict}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs font-semibold truncate">
                            {c.displayPath}
                          </div>
                          <div className="text-xs text-zinc-400 truncate">
                            {c.propertyLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`p-3 border-t space-y-2 ${
                      isDark
                        ? 'border-[#2b2d32] bg-[#141518]'
                        : 'border-zinc-300 bg-zinc-100'
                    }`}
                  >
                    <div className="text-[11px] text-zinc-400 leading-relaxed">
                      ✓ {result.summary.identicalChangeCount}{' '}
                      {t.mergeView.identicalAutoMergedNote}
                    </div>
                    {result.summary.remainingConflicts > 0 && (
                      <button
                        type="button"
                        onClick={() => onResolveAllRemaining('KEEP_OURS')}
                        className={`w-full px-2.5 py-1.5 text-xs font-medium border transition-colors ${btnClass}`}
                      >
                        {t.mergeView.resolveRemainingOursBtn}
                      </button>
                    )}
                  </div>
                </aside>

                {/* Right Workbench: Conflict 1 of N Inspector */}
                {currentConflict && (
                  <main className="flex-1 overflow-y-auto p-5">
                    <div
                      className={`max-w-4xl border p-5 ${
                        isDark
                          ? 'border-[#2e3036] bg-[#16171a]'
                          : 'border-zinc-300 bg-white'
                      }`}
                    >
                      <div
                        className={`flex flex-wrap items-center justify-between gap-4 pb-3 border-b ${
                          isDark ? 'border-[#2b2d32]' : 'border-zinc-200'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                            {t.mergeView.conflictCounter}{' '}
                            {activeConflictIndex + 1} / {result.conflicts.length}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {t.mergeView.conflictExplanation}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={activeConflictIndex === 0}
                            onClick={() =>
                              handleSelectConflict(Math.max(0, activeConflictIndex - 1))
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs border transition-colors disabled:opacity-40 ${btnClass}`}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t.mergeView.prevBtn}
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
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs border transition-colors disabled:opacity-40 ${btnClass}`}
                          >
                            {t.mergeView.nextBtn}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Hierarchy Path Tree (CUSTOMER -> NAME -> Width) */}
                      <div
                        dir="ltr"
                        className={`my-4 p-3 border font-mono text-xs leading-relaxed ${
                          isDark
                            ? 'bg-[#121316] border-[#2e3036] text-zinc-200'
                            : 'bg-zinc-50 border-zinc-300 text-zinc-800'
                        }`}
                      >
                        {currentConflict.parentPath.length > 0 ? (
                          <>
                            <div className="font-semibold text-zinc-300">
                              {currentConflict.parentPath[0]}
                            </div>
                            <div className="pl-2 text-zinc-300">
                              └──{' '}
                              <span className="font-semibold">
                                {currentConflict.objectName}
                              </span>
                            </div>
                            <div className="pl-6 text-amber-400 font-semibold">
                              └── {currentConflict.propertyLabel}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-zinc-300">
                              {currentConflict.objectType}: {currentConflict.objectName}
                            </div>
                            <div className="pl-2 text-amber-400 font-semibold">
                              └── {currentConflict.propertyLabel}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Three-Way Value Comparison Grid: BASE | OURS | THEIRS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                        <div
                          className={`p-3.5 border ${
                            currentConflict.resolvedChoice === 'KEEP_BASE'
                              ? 'border-emerald-500'
                              : isDark
                              ? 'border-[#2e3036] bg-[#121316]'
                              : 'border-zinc-300 bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-mono font-bold text-zinc-400">
                              {t.mergeHome.baseLabel}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500 truncate">
                              {result.baseModel.metadata.fileName}
                            </span>
                          </div>
                          <pre
                            dir="ltr"
                            className="font-mono text-sm font-semibold whitespace-pre-wrap break-words"
                          >
                            {currentConflict.baseFormatted}
                          </pre>
                        </div>

                        <div
                          className={`p-3.5 border ${
                            currentConflict.resolvedChoice === 'KEEP_OURS'
                              ? 'border-emerald-500'
                              : isDark
                              ? 'border-sky-800/60 bg-[#131d27]'
                              : 'border-sky-300 bg-sky-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-mono font-bold text-sky-400">
                              {t.mergeHome.oursLabel}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500 truncate">
                              {result.oursModel.metadata.fileName}
                            </span>
                          </div>
                          <pre
                            dir="ltr"
                            className="font-mono text-sm font-semibold whitespace-pre-wrap break-words"
                          >
                            {currentConflict.oursFormatted}
                          </pre>
                        </div>

                        <div
                          className={`p-3.5 border ${
                            currentConflict.resolvedChoice === 'KEEP_THEIRS'
                              ? 'border-emerald-500'
                              : isDark
                              ? 'border-amber-800/60 bg-[#241d12]'
                              : 'border-amber-300 bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-mono font-bold text-amber-400">
                              {t.mergeHome.theirsLabel}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500 truncate">
                              {result.theirsModel.metadata.fileName}
                            </span>
                          </div>
                          <pre
                            dir="ltr"
                            className="font-mono text-sm font-semibold whitespace-pre-wrap break-words"
                          >
                            {currentConflict.theirsFormatted}
                          </pre>
                        </div>
                      </div>

                      {/* Resolution Actions: [ Keep Ours ] [ Keep Theirs ] [ Keep Base ] [ Custom ] */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApplyResolution('KEEP_OURS')}
                          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap ${
                            currentConflict.resolvedChoice === 'KEEP_OURS'
                              ? 'bg-sky-600 border-sky-500 text-white'
                              : btnClass
                          }`}
                        >
                          {t.mergeView.keepOursBtn}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyResolution('KEEP_THEIRS')}
                          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap ${
                            currentConflict.resolvedChoice === 'KEEP_THEIRS'
                              ? 'bg-amber-600 border-amber-500 text-white'
                              : btnClass
                          }`}
                        >
                          {t.mergeView.keepTheirsBtn}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyResolution('KEEP_BASE')}
                          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap ${
                            currentConflict.resolvedChoice === 'KEEP_BASE'
                              ? 'bg-zinc-600 border-zinc-400 text-white'
                              : btnClass
                          }`}
                        >
                          {t.mergeView.keepBaseBtn}
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
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap ${
                            currentConflict.resolvedChoice === 'CUSTOM' ||
                            customInputMode
                              ? 'bg-emerald-700 border-emerald-500 text-white'
                              : btnClass
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {t.mergeView.customBtn}
                        </button>
                      </div>

                      {customInputMode && (
                        <div
                          className={`mt-4 p-3.5 border ${
                            isDark
                              ? 'border-[#2e3036] bg-[#121316]'
                              : 'border-zinc-300 bg-zinc-50'
                          }`}
                        >
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            {t.mergeView.customValueLabel} (
                            {currentConflict.displayPath} →{' '}
                            {currentConflict.propertyLabel})
                          </label>
                          {currentConflict.targetKind === 'SOURCE_CODE' ? (
                            <textarea
                              dir="ltr"
                              rows={6}
                              value={customDraftValue}
                              onChange={(e) => setCustomDraftValue(e.target.value)}
                              className={`w-full p-2 text-xs font-mono border outline-none ${
                                isDark
                                  ? 'bg-[#18191c] border-[#34363d] text-zinc-100'
                                  : 'bg-white border-zinc-300 text-zinc-900'
                              }`}
                            />
                          ) : (
                            <input
                              dir="ltr"
                              type="text"
                              value={customDraftValue}
                              onChange={(e) => setCustomDraftValue(e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs font-mono border outline-none ${
                                isDark
                                  ? 'bg-[#18191c] border-[#34363d] text-zinc-100'
                                  : 'bg-white border-zinc-300 text-zinc-900'
                              }`}
                            />
                          )}
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomInputMode(false)}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              {t.mergeView.cancelBtn}
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
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t.mergeView.applyCustomBtn}
                            </button>
                          </div>
                        </div>
                      )}

                      {currentConflict.isResolved && (
                        <div
                          className={`mt-4 p-3 border flex flex-wrap items-center justify-between gap-3 ${
                            isDark
                              ? 'border-emerald-800/60 bg-[#13261d] text-emerald-200'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-950'
                          }`}
                        >
                          <div className="text-xs">
                            <span className="font-semibold">
                              {t.mergeView.conflictResolvedBanner}
                            </span>{' '}
                            · {t.mergeView.resultWillUse}{' '}
                            <span className="font-mono font-semibold">
                              {currentConflict.resolvedFormatted}
                            </span>{' '}
                            ({currentConflict.resolvedChoice})
                          </div>

                          {result.summary.remainingConflicts > 0 ? (
                            <button
                              type="button"
                              onClick={handleJumpToNextUnresolved}
                              className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                            >
                              {t.mergeView.nextConflictBtn}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveTab('summary')}
                              className={`px-3 py-1 text-xs font-semibold ${
                                isDark
                                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                              }`}
                            >
                              {t.mergeView.allResolvedReviewBtn}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </main>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'auto' && (
          <div className="p-5 overflow-y-auto">
            <div
              className={`max-w-5xl mx-auto border overflow-hidden ${
                isDark ? 'border-[#2e3036] bg-[#16171a]' : 'border-zinc-300 bg-white'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b ${
                  isDark ? 'border-[#2e3036] bg-[#1e1f23]' : 'border-zinc-200 bg-zinc-100'
                }`}
              >
                <h3 className="text-xs font-semibold">
                  {t.mergeView.autoMergedTableTitle} (
                  {result.autoMergedDecisions.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {t.mergeView.autoMergedTableSub}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={
                        isDark
                          ? 'bg-[#18191c] text-zinc-400 border-b border-[#2e3036]'
                          : 'bg-zinc-50 text-zinc-600 border-b border-zinc-300'
                      }
                    >
                      <th className="py-1.5 px-3 font-medium">
                        {t.mergeView.colObject}
                      </th>
                      <th className="py-1.5 px-3 font-medium">
                        {t.mergeView.colTarget}
                      </th>
                      <th className="py-1.5 px-3 font-medium">
                        {t.mergeView.colRule}
                      </th>
                      <th className="py-1.5 px-3 font-medium">
                        {t.mergeHome.baseLabel}
                      </th>
                      <th className="py-1.5 px-3 font-medium">
                        {t.mergeView.colMergedValue}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-mono ${
                      isDark ? 'divide-[#26282d]' : 'divide-zinc-200'
                    }`}
                  >
                    {result.autoMergedDecisions.map((d) => (
                      <tr key={d.id}>
                        <td className="py-1.5 px-3 font-semibold">
                          {d.displayPath}
                        </td>
                        <td className="py-1.5 px-3 font-sans">
                          {d.propertyLabel}
                        </td>
                        <td className="py-1.5 px-3 text-zinc-400">
                          {d.decisionType}
                        </td>
                        <td className="py-1.5 px-3 text-zinc-400 truncate max-w-[180px]">
                          {d.baseFormatted}
                        </td>
                        <td className="py-1.5 px-3 text-emerald-400 font-semibold truncate max-w-[240px]">
                          {d.resolvedFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="p-6">
            <div
              className={`max-w-lg mx-auto border p-5 ${
                isDark ? 'border-[#2e3036] bg-[#16171a]' : 'border-zinc-300 bg-white'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-3 mb-4 border-b ${
                  isDark ? 'border-[#2e3036]' : 'border-zinc-200'
                }`}
              >
                <h2 className="text-sm font-semibold">
                  {allConflictsResolved
                    ? t.mergeView.mergeReadyTitle
                    : t.mergeView.mergeStatusTitle}
                </h2>
                {allConflictsResolved ? (
                  <span className="font-mono text-xs text-emerald-400 font-semibold">
                    {t.mergeView.readyForExportBadge}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    {t.mergeView.unresolvedConflictsBadge} (
                    {result.summary.remainingConflicts})
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs tabular-nums mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    ✓ {t.mergeView.statAutoMerged}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {result.summary.autoMergedTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    ✓ {t.mergeView.statConflictsResolved}
                  </span>
                  <span className="font-mono font-bold text-sky-400">
                    {result.summary.resolvedConflicts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    {result.summary.remainingConflicts === 0 ? '✓' : '⚠'}{' '}
                    {t.mergeView.statRemainingConflicts}
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

              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {t.mergeView.outputLabel}
                </label>
                <input
                  dir="ltr"
                  type="text"
                  value={result.outputFileName}
                  onChange={(e) => onUpdateOutputFileName(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs font-mono border outline-none ${
                    isDark
                      ? 'bg-[#121316] border-[#34363d] text-zinc-100'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              {validationReport && (
                <div
                  className={`mb-4 p-3 border text-xs space-y-1.5 ${
                    validationReport.isValid
                      ? isDark
                        ? 'border-emerald-800/60 bg-[#13261d]'
                        : 'border-emerald-300 bg-emerald-50'
                      : isDark
                      ? 'border-rose-800/60 bg-[#2d1619]'
                      : 'border-rose-300 bg-rose-50'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {validationReport.isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>
                      {validationReport.isValid
                        ? t.mergeView.validationPassedBanner
                        : t.mergeView.validationBlockedBanner}
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
                          <span className="text-zinc-400">{chk.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exportBanner && (
                <div
                  className={`mb-4 p-2.5 border text-xs font-mono ${
                    isDark
                      ? 'border-emerald-800/60 bg-[#13261d] text-emerald-200'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  ✓ {exportBanner}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleTriggerValidation}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap ${btnClass}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.mergeView.validateBtn}
                </button>

                <button
                  type="button"
                  disabled={!allConflictsResolved}
                  onClick={handleTriggerExport}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap disabled:opacity-40 ${
                    isDark
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                      : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.mergeView.exportMergedFmbBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
