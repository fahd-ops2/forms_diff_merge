import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  FileCode,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowLeftRight,
  FolderOpen,
} from 'lucide-react';
import {
  ChangeStatus,
  FmbComparisonResult,
  ObjectDiffEntry,
} from '../diff/diff-models';
import { FmbObjectType } from '../fmb/models/fmb-models';
import { useI18n } from '../i18n/translations';
import { SplitSourceDiff } from './SplitSourceDiff';

interface CompareWorkspaceProps {
  result: FmbComparisonResult;
  isDark: boolean;
  onResetFiles: () => void;
  onRerun: () => void;
  onSwapFiles: () => void;
  onExportHtmlReport: () => void;
  onPreviewHtmlReport: () => void;
}

type StatusFilter = 'CHANGES_ONLY' | 'ALL' | 'ADDED' | 'REMOVED' | 'MODIFIED';
type TypeFilter = 'ALL' | FmbObjectType;

export const CompareWorkspace: React.FC<CompareWorkspaceProps> = ({
  result,
  isDark,
  onResetFiles,
  onRerun,
  onSwapFiles,
  onExportHtmlReport,
  onPreviewHtmlReport,
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('CHANGES_ONLY');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedObjects, setExpandedObjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const firstTrigger = result.objectDiffs.find(
      (o) => o.status === 'MODIFIED' && o.sourceDiff
    );
    if (firstTrigger) {
      initial[firstTrigger.id] = true;
    }
    return initial;
  });
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [showDevJsonFor, setShowDevJsonFor] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const objectTypeOptions: Array<{ value: TypeFilter; label: string }> = [
    { value: 'ALL', label: t.filters.allTypes },
    { value: 'BLOCK', label: t.filters.blocks },
    { value: 'ITEM', label: t.filters.items },
    { value: 'TRIGGER', label: t.filters.triggers },
    { value: 'PROGRAM_UNIT', label: t.filters.programUnits },
    { value: 'CANVAS', label: t.filters.canvases },
    { value: 'WINDOW', label: t.filters.windows },
    { value: 'LOV', label: t.filters.lovs },
    { value: 'RECORD_GROUP', label: t.filters.recordGroups },
  ];

  const totalChanges =
    result.summary.added + result.summary.removed + result.summary.modified;

  const filteredObjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return result.objectDiffs.filter((obj) => {
      if (statusFilter === 'CHANGES_ONLY' && obj.status === 'UNCHANGED') {
        return false;
      }
      if (
        (statusFilter === 'ADDED' ||
          statusFilter === 'REMOVED' ||
          statusFilter === 'MODIFIED') &&
        obj.status !== statusFilter
      ) {
        return false;
      }

      if (typeFilter !== 'ALL' && obj.type !== typeFilter) {
        return false;
      }

      if (selectedTreeNode !== 'ALL') {
        if (selectedTreeNode.startsWith('CATEGORY:')) {
          const catType = selectedTreeNode.replace('CATEGORY:', '');
          if (obj.type !== catType) return false;
        } else if (selectedTreeNode.startsWith('BLOCK_GROUP:')) {
          const blkName = selectedTreeNode.replace('BLOCK_GROUP:', '');
          const belongsToBlock =
            (obj.type === 'BLOCK' && obj.name === blkName) ||
            obj.parentPath[0] === blkName;
          if (!belongsToBlock) return false;
        } else if (obj.id !== selectedTreeNode) {
          return false;
        }
      }

      if (q) {
        const matchesName =
          obj.name.toLowerCase().includes(q) ||
          obj.displayPath.toLowerCase().includes(q) ||
          obj.type.toLowerCase().includes(q);
        const matchesProps = obj.propertyDiffs.some(
          (p) =>
            p.status !== 'UNCHANGED' &&
            (p.label.toLowerCase().includes(q) ||
              p.oldFormatted.toLowerCase().includes(q) ||
              p.newFormatted.toLowerCase().includes(q))
        );
        const matchesSource =
          obj.sourceDiff &&
          (obj.sourceDiff.oldSource.toLowerCase().includes(q) ||
            obj.sourceDiff.newSource.toLowerCase().includes(q));
        return Boolean(matchesName || matchesProps || matchesSource);
      }

      return true;
    });
  }, [result.objectDiffs, searchQuery, statusFilter, typeFilter, selectedTreeNode]);

  const groupedSections = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; items: ObjectDiffEntry[] }
    >();
    for (const obj of filteredObjects) {
      const existing = groups.get(obj.groupKey);
      if (existing) {
        existing.items.push(obj);
      } else {
        groups.set(obj.groupKey, {
          key: obj.groupKey,
          label: obj.groupLabel,
          items: [obj],
        });
      }
    }
    return Array.from(groups.values());
  }, [filteredObjects]);

  const treeSummary = useMemo(() => {
    const countChanges = (predicate: (o: ObjectDiffEntry) => boolean) => {
      const matching = result.objectDiffs.filter(predicate);
      const changed = matching.filter((o) => o.status !== 'UNCHANGED');
      return {
        total: matching.length,
        changedCount: changed.length,
        allAdded: changed.length > 0 && changed.every((o) => o.status === 'ADDED'),
      };
    };

    const blockNames = Array.from(
      new Set(
        result.objectDiffs
          .filter((o) => o.type === 'BLOCK' || o.parentPath.length > 0)
          .map((o) => (o.type === 'BLOCK' ? o.name : o.parentPath[0]))
          .filter(Boolean)
      )
    );

    const blocks = blockNames.map((blkName) => ({
      name: blkName,
      nodeKey: `BLOCK_GROUP:${blkName}`,
      stats: countChanges(
        (o) => (o.type === 'BLOCK' && o.name === blkName) || o.parentPath[0] === blkName
      ),
    }));

    return {
      windows: countChanges((o) => o.type === 'WINDOW'),
      canvases: countChanges((o) => o.type === 'CANVAS'),
      blocks,
      triggers: countChanges((o) => o.type === 'TRIGGER'),
      programUnits: countChanges((o) => o.type === 'PROGRAM_UNIT'),
      lovs: countChanges((o) => o.type === 'LOV'),
      recordGroups: countChanges((o) => o.type === 'RECORD_GROUP'),
    };
  }, [result.objectDiffs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          Math.min(prev + 1, Math.max(0, filteredObjects.length - 1))
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && filteredObjects[focusedIndex]) {
        e.preventDefault();
        const targetId = filteredObjects[focusedIndex].id;
        setExpandedObjects((prev) => ({ ...prev, [targetId]: !prev[targetId] }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredObjects, focusedIndex]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleObjectExpand = (id: string) => {
    setExpandedObjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderStatusIndicator = (status: ChangeStatus) => {
    switch (status) {
      case 'ADDED':
        return (
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            + {t.summary.added}
          </span>
        );
      case 'REMOVED':
        return (
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              isDark ? 'text-rose-400' : 'text-rose-700'
            }`}
          >
            − {t.summary.removed}
          </span>
        );
      case 'MODIFIED':
        return (
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            ● {t.summary.modified}
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-zinc-500 whitespace-nowrap">
            ✓ {t.summary.unchanged}
          </span>
        );
    }
  };

  const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const btnClass = isDark
    ? 'border-[#34363d] bg-[#25272c] text-zinc-200 hover:bg-[#2f3138]'
    : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100';

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Dual Path Bar & Summary Strip (Beyond Compare / Sublime Merge style) */}
      <div
        className={`px-4 py-2 border-b ${
          isDark ? 'border-[#2b2d32] bg-[#1e1f23]' : 'border-zinc-300 bg-zinc-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* File comparison path header */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-1.5 py-0.5 border border-zinc-600/50 text-[10px] font-semibold text-zinc-400">
              {t.compareHome.oldLabel}
            </span>
            <span className="font-semibold">{result.oldModel.metadata.fileName}</span>
            <span className="text-zinc-500 tabular-nums">
              ({formatBytes(result.oldModel.metadata.fileSize)})
            </span>
            <span className="text-zinc-500 px-1">→</span>
            <span className="px-1.5 py-0.5 border border-zinc-500/60 text-[10px] font-semibold text-zinc-300">
              {t.compareHome.newLabel}
            </span>
            <span className="font-semibold">{result.newModel.metadata.fileName}</span>
            <span className="text-zinc-500 tabular-nums">
              ({formatBytes(result.newModel.metadata.fileSize)})
            </span>
          </div>

          {/* Utilitarian Action Strip */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSwapFiles}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnClass}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {t.toolbar.swapSides}
            </button>
            <button
              type="button"
              onClick={onRerun}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnClass}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.toolbar.rerun}
            </button>
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
              onClick={onPreviewHtmlReport}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnClass}`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {t.toolbar.viewReport}
            </button>
            <button
              type="button"
              onClick={onExportHtmlReport}
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

        {/* Immediate Summary Counters Bar */}
        <div
          className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'border-[#2b2d32]' : 'border-zinc-300'
          }`}
        >
          <div className="flex flex-wrap items-center gap-5 text-xs tabular-nums">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'ADDED' ? 'CHANGES_ONLY' : 'ADDED')
              }
              className={`flex items-center gap-1.5 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'ADDED'
                  ? 'opacity-40 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-sm ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                +{result.summary.added}
              </span>
              <span className="font-medium">{t.summary.added}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'REMOVED' ? 'CHANGES_ONLY' : 'REMOVED')
              }
              className={`flex items-center gap-1.5 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'REMOVED'
                  ? 'opacity-40 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-sm ${
                  isDark ? 'text-rose-400' : 'text-rose-700'
                }`}
              >
                −{result.summary.removed}
              </span>
              <span className="font-medium">{t.summary.removed}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'MODIFIED' ? 'CHANGES_ONLY' : 'MODIFIED'
                )
              }
              className={`flex items-center gap-1.5 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'MODIFIED'
                  ? 'opacity-40 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-sm ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                ● {result.summary.modified}
              </span>
              <span className="font-medium">{t.summary.modified}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'ALL' ? 'CHANGES_ONLY' : 'ALL')
              }
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span className="font-mono font-semibold text-sm tabular-nums">
                ✓ {result.summary.unchanged}
              </span>
              <span>{t.summary.same}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
            {result.summary.changedPropertyTotal} {t.summary.propertyChanges} ·{' '}
            {result.summary.changedTriggersCount} {t.summary.triggersModified} ·{' '}
            {result.summary.changedProgramUnitsCount} {t.summary.programUnitsModified}
          </div>
        </div>
      </div>

      {/* Utilitarian Filter & Search Bar */}
      <div
        className={`px-4 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-[#2b2d32] bg-[#18191c]' : 'border-zinc-300 bg-zinc-50'
        }`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.filters.searchPlaceholder}
            className={`w-full pl-8 pr-7 py-1 text-xs font-mono border outline-none transition-colors ${
              isDark
                ? 'bg-[#121316] border-[#2e3036] text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-600'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center border ${
              isDark ? 'border-[#2e3036] bg-[#121316]' : 'border-zinc-300 bg-zinc-200/60'
            }`}
          >
            {(
              [
                ['CHANGES_ONLY', t.filters.onlyChanges],
                ['ADDED', t.summary.added],
                ['REMOVED', t.summary.removed],
                ['MODIFIED', t.summary.modified],
                ['ALL', t.filters.showUnchanged],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === val
                    ? isDark
                      ? 'bg-[#2b2d34] text-white font-semibold'
                      : 'bg-white text-zinc-950 font-semibold shadow-2xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              aria-label={t.filters.allTypes}
              className={`pl-7 pr-6 py-1 text-xs font-medium border outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#121316] border-[#2e3036] text-zinc-200'
                  : 'bg-white border-zinc-300 text-zinc-800'
              }`}
            >
              {objectTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Dock: Left Object Tree + Right Diff Table */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Dock: Object Hierarchy Navigator */}
        <aside
          className={`w-60 shrink-0 border-r overflow-y-auto p-2 select-none ${
            isDark ? 'border-[#2b2d32] bg-[#18191c]' : 'border-zinc-300 bg-zinc-100/80'
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[11px] font-mono font-semibold text-zinc-400">
              {t.tree.objectHierarchy}
            </span>
            {selectedTreeNode !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedTreeNode('ALL')}
                className="text-[11px] font-mono text-zinc-300 underline"
              >
                {t.tree.showAll}
              </button>
            )}
          </div>

          {/* Root Module Node */}
          <button
            type="button"
            onClick={() => setSelectedTreeNode('ALL')}
            className={`w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-semibold mb-0.5 transition-colors ${
              selectedTreeNode === 'ALL'
                ? isDark
                  ? 'bg-[#2b2d34] text-white'
                  : 'bg-zinc-300/80 text-zinc-950'
                : isDark
                ? 'text-zinc-300 hover:bg-[#22242a]'
                : 'text-zinc-800 hover:bg-zinc-200/70'
            }`}
          >
            <span className="truncate">{result.newModel.metadata.moduleName}</span>
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {totalChanges}
            </span>
          </button>

          <div
            className={`pl-2 border-l ml-2 space-y-0.5 text-xs ${
              isDark ? 'border-[#2e3036]' : 'border-zinc-300'
            }`}
          >
            <TreeCategoryButton
              label={t.tree.windows}
              nodeKey="CATEGORY:WINDOW"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.windows.changedCount}
              isDark={isDark}
            />

            <TreeCategoryButton
              label={t.tree.canvases}
              nodeKey="CATEGORY:CANVAS"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.canvases.changedCount}
              isDark={isDark}
            />

            <div className="pt-0.5">
              <div className="px-2 py-0.5 text-[11px] font-mono text-zinc-500">
                {t.tree.blocks}
              </div>
              <div
                className={`pl-2 border-l ml-2 space-y-0.5 ${
                  isDark ? 'border-[#2e3036]' : 'border-zinc-300'
                }`}
              >
                {treeSummary.blocks.map((blk) => {
                  const isActive = selectedTreeNode === blk.nodeKey;
                  const indicator = blk.stats.allAdded ? (
                    <span className="font-mono font-bold text-emerald-400">+</span>
                  ) : blk.stats.changedCount > 0 ? (
                    <span className="font-mono font-bold text-amber-400">●</span>
                  ) : null;

                  return (
                    <button
                      key={blk.nodeKey}
                      type="button"
                      onClick={() =>
                        setSelectedTreeNode(isActive ? 'ALL' : blk.nodeKey)
                      }
                      className={`w-full flex items-center justify-between px-2 py-1 text-xs font-mono transition-colors ${
                        isActive
                          ? isDark
                            ? 'bg-[#2b2d34] text-white font-semibold'
                            : 'bg-zinc-300 text-zinc-950 font-semibold'
                          : isDark
                          ? 'text-zinc-300 hover:bg-[#22242a]'
                          : 'text-zinc-700 hover:bg-zinc-200/70'
                      }`}
                    >
                      <span className="truncate">{blk.name}</span>
                      <span className="flex items-center gap-1.5">
                        {blk.stats.changedCount > 0 && (
                          <span className="text-[11px] text-zinc-500 tabular-nums">
                            {blk.stats.changedCount}
                          </span>
                        )}
                        {indicator}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <TreeCategoryButton
              label={t.tree.triggers}
              nodeKey="CATEGORY:TRIGGER"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.triggers.changedCount}
              badgeSuffix={t.tree.changesCount}
              isDark={isDark}
            />

            <TreeCategoryButton
              label={t.tree.programUnits}
              nodeKey="CATEGORY:PROGRAM_UNIT"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.programUnits.changedCount}
              badgeSuffix={t.tree.changesCount}
              isDark={isDark}
            />

            <TreeCategoryButton
              label={t.tree.lovs}
              nodeKey="CATEGORY:LOV"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.lovs.changedCount}
              isDark={isDark}
            />

            <TreeCategoryButton
              label={t.tree.recordGroups}
              nodeKey="CATEGORY:RECORD_GROUP"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.recordGroups.changedCount}
              isDark={isDark}
            />
          </div>
        </aside>

        {/* Right Main Diff Viewport */}
        <main className="flex-1 overflow-y-auto p-4">
          {totalChanges === 0 && statusFilter === 'CHANGES_ONLY' ? (
            <div
              className={`max-w-md mx-auto my-12 p-6 border text-center ${
                isDark
                  ? 'border-[#2e3036] bg-[#18191c]'
                  : 'border-zinc-300 bg-white'
              }`}
            >
              <div className="text-emerald-400 font-mono text-xl mb-1">✓</div>
              <h2 className="text-sm font-semibold mb-1">
                {t.diffView.noDifferencesTitle}
              </h2>
              <p className="text-xs text-zinc-400 mb-4">
                {t.diffView.noDifferencesDesc} ({result.summary.unchanged})
              </p>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${btnClass}`}
              >
                {t.diffView.inspectUnchangedBtn} ({result.summary.unchanged})
              </button>
            </div>
          ) : groupedSections.length === 0 ? (
            <div
              className={`max-w-md mx-auto my-12 p-6 border text-center ${
                isDark
                  ? 'border-[#2e3036] bg-[#18191c]'
                  : 'border-zinc-300 bg-white'
              }`}
            >
              <h2 className="text-sm font-semibold mb-1">
                {t.diffView.noFilterMatchesTitle}
              </h2>
              <p className="text-xs text-zinc-400 mb-4">
                {t.diffView.noFilterMatchesDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('CHANGES_ONLY');
                  setTypeFilter('ALL');
                  setSelectedTreeNode('ALL');
                }}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${btnClass}`}
              >
                {t.filters.resetFilters}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSections.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.key]);

                return (
                  <section
                    key={group.key}
                    className={`border ${
                      isDark
                        ? 'border-[#2e3036] bg-[#16171a]'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {/* Section Group Header (▼ CUSTOMER, ▼ TRIGGERS) */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left border-b transition-colors ${
                        isDark
                          ? 'border-[#2e3036] bg-[#1e1f23] hover:bg-[#25272c]'
                          : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="font-mono text-xs font-bold">
                          {group.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                        {group.items.length}{' '}
                        {group.items.length === 1
                          ? t.diffView.objectSingle
                          : t.diffView.objectsCount}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div
                        className={`divide-y ${
                          isDark ? 'divide-[#26282d]' : 'divide-zinc-200'
                        }`}
                      >
                        {group.items.map((obj) => {
                          const isExpanded = Boolean(expandedObjects[obj.id]);
                          const changedProps = obj.propertyDiffs.filter(
                            (p) => p.status !== 'UNCHANGED'
                          );
                          const hasSourceChanges =
                            obj.sourceDiff && obj.sourceDiff.status !== 'UNCHANGED';
                          const showDevJson = Boolean(showDevJsonFor[obj.id]);

                          return (
                            <div
                              key={obj.id}
                              className={`transition-colors ${
                                isDark ? 'hover:bg-[#1c1d21]' : 'hover:bg-zinc-50'
                              }`}
                            >
                              <div
                                onClick={() => toggleObjectExpand(obj.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleObjectExpand(obj.id);
                                  }
                                }}
                                className="px-3.5 py-2.5 cursor-pointer select-none"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`font-mono text-xs font-bold w-4 text-center ${
                                        obj.status === 'ADDED'
                                          ? 'text-emerald-400'
                                          : obj.status === 'REMOVED'
                                          ? 'text-rose-400'
                                          : obj.status === 'MODIFIED'
                                          ? 'text-amber-400'
                                          : 'text-zinc-500'
                                      }`}
                                    >
                                      {obj.status === 'ADDED'
                                        ? '+'
                                        : obj.status === 'REMOVED'
                                        ? '−'
                                        : obj.status === 'MODIFIED'
                                        ? '●'
                                        : '✓'}
                                    </span>
                                    <span className="font-mono text-xs font-semibold truncate">
                                      {obj.displayPath}
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500">
                                      · {obj.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    {renderStatusIndicator(obj.status)}
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                                    )}
                                  </div>
                                </div>

                                {/* Progressive Disclosure Level 2: Direct Property Diffs */}
                                {obj.status === 'MODIFIED' && changedProps.length > 0 && (
                                  <div className="mt-1.5 pl-6 space-y-0.5">
                                    {changedProps.map((prop) => (
                                      <div
                                        key={prop.key}
                                        className="grid grid-cols-[150px_1fr] items-baseline gap-2 text-xs font-mono"
                                      >
                                        <span className="text-zinc-400 font-sans">
                                          {prop.label}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className={
                                              isDark ? 'text-zinc-400' : 'text-zinc-600'
                                            }
                                          >
                                            {prop.oldFormatted}
                                          </span>
                                          <span className="text-zinc-500">→</span>
                                          <span
                                            className={`font-semibold ${
                                              isDark ? 'text-amber-300' : 'text-amber-800'
                                            }`}
                                          >
                                            {prop.newFormatted}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Source Diff Summary */}
                                {hasSourceChanges && obj.sourceDiff && (
                                  <div className="mt-1.5 pl-6 flex flex-wrap items-center gap-3 text-xs font-mono">
                                    <span className="text-zinc-400">
                                      {obj.sourceDiff.sourceType}:
                                    </span>
                                    {obj.sourceDiff.addedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                                        }
                                      >
                                        +{obj.sourceDiff.addedLines}{' '}
                                        {t.diffView.linesAdded}
                                      </span>
                                    )}
                                    {obj.sourceDiff.removedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-rose-400' : 'text-rose-700'
                                        }
                                      >
                                        −{obj.sourceDiff.removedLines}{' '}
                                        {t.diffView.linesRemoved}
                                      </span>
                                    )}
                                    {obj.sourceDiff.modifiedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-amber-400' : 'text-amber-700'
                                        }
                                      >
                                        ~{obj.sourceDiff.modifiedLines}{' '}
                                        {t.diffView.linesModified}
                                      </span>
                                    )}
                                    <span className="text-zinc-400 underline text-[11px] font-sans">
                                      {isExpanded
                                        ? t.diffView.hideSplitDiff
                                        : t.diffView.inspectSplitDiff}
                                    </span>
                                  </div>
                                )}

                                {(obj.status === 'ADDED' || obj.status === 'REMOVED') && (
                                  <div className="mt-1 pl-6 text-xs text-zinc-400 font-mono">
                                    {obj.propertyDiffs
                                      .slice(0, 4)
                                      .map(
                                        (p) =>
                                          `${p.label}: ${
                                            obj.status === 'ADDED'
                                              ? p.newFormatted
                                              : p.oldFormatted
                                          }`
                                      )
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>

                              {/* Progressive Disclosure Level 3: Expanded Split Diff & Full Property Grid */}
                              {isExpanded && (
                                <div
                                  className={`px-4 pb-3.5 pt-2 pl-9 border-t text-xs ${
                                    isDark
                                      ? 'border-[#26282d] bg-[#121316]'
                                      : 'border-zinc-200 bg-zinc-50'
                                  }`}
                                >
                                  {obj.sourceDiff && (
                                    <SplitSourceDiff
                                      diff={obj.sourceDiff}
                                      isDark={isDark}
                                    />
                                  )}

                                  {obj.propertyDiffs.length > 0 && (
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono font-semibold text-zinc-400">
                                          {t.diffView.objectProperties} ({obj.propertyDiffs.length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowDevJsonFor((prev) => ({
                                              ...prev,
                                              [obj.id]: !prev[obj.id],
                                            }))
                                          }
                                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-300"
                                        >
                                          <Code2 className="w-3 h-3" />
                                          {showDevJson
                                            ? t.diffView.hideNormalizedView
                                            : t.diffView.devNormalizedView}
                                        </button>
                                      </div>

                                      <div
                                        className={`border overflow-hidden ${
                                          isDark ? 'border-[#2e3036]' : 'border-zinc-300'
                                        }`}
                                      >
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr
                                              className={
                                                isDark
                                                  ? 'bg-[#1e1f23] text-zinc-400 border-b border-[#2e3036]'
                                                  : 'bg-zinc-100 text-zinc-600 border-b border-zinc-300'
                                              }
                                            >
                                              <th className="py-1 px-2.5 font-medium">
                                                {t.diffView.colProperty}
                                              </th>
                                              <th className="py-1 px-2.5 font-medium">
                                                {t.diffView.colOld} ({result.oldModel.metadata.fileName})
                                              </th>
                                              <th className="py-1 px-2.5 font-medium">
                                                {t.diffView.colNew} ({result.newModel.metadata.fileName})
                                              </th>
                                              <th className="py-1 px-2.5 font-medium text-right">
                                                {t.diffView.colState}
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody
                                            className={`divide-y font-mono ${
                                              isDark
                                                ? 'divide-[#26282d]'
                                                : 'divide-zinc-200'
                                            }`}
                                          >
                                            {obj.propertyDiffs.map((p) => {
                                              const isChanged = p.status !== 'UNCHANGED';
                                              return (
                                                <tr
                                                  key={p.key}
                                                  className={
                                                    isChanged
                                                      ? isDark
                                                        ? 'bg-[#2c2416]'
                                                        : 'bg-amber-50/80'
                                                      : 'opacity-65'
                                                  }
                                                >
                                                  <td className="py-1 px-2.5 font-sans font-medium">
                                                    {p.label}
                                                  </td>
                                                  <td className="py-1 px-2.5">
                                                    {p.oldFormatted}
                                                  </td>
                                                  <td
                                                    className={`py-1 px-2.5 ${
                                                      isChanged ? 'font-semibold' : ''
                                                    }`}
                                                  >
                                                    {p.newFormatted}
                                                  </td>
                                                  <td className="py-1 px-2.5 text-right">
                                                    {p.status}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {showDevJson && (
                                    <pre
                                      dir="ltr"
                                      className={`mt-2 p-2.5 border font-mono text-[11px] overflow-x-auto ${
                                        isDark
                                          ? 'bg-[#0e0f11] border-[#2e3036] text-zinc-300'
                                          : 'bg-zinc-900 border-zinc-400 text-zinc-100'
                                      }`}
                                    >
                                      {JSON.stringify(
                                        {
                                          canonicalId: obj.id,
                                          oldNormalized: obj.oldObject,
                                          newNormalized: obj.newObject,
                                        },
                                        null,
                                        2
                                      )}
                                    </pre>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

interface TreeCategoryButtonProps {
  label: string;
  nodeKey: string;
  selectedNode: string;
  onSelect: (key: string) => void;
  changedCount: number;
  badgeSuffix?: string;
  isDark: boolean;
}

const TreeCategoryButton: React.FC<TreeCategoryButtonProps> = ({
  label,
  nodeKey,
  selectedNode,
  onSelect,
  changedCount,
  badgeSuffix,
  isDark,
}) => {
  const isActive = selectedNode === nodeKey;
  return (
    <button
      type="button"
      onClick={() => onSelect(isActive ? 'ALL' : nodeKey)}
      className={`w-full flex items-center justify-between px-2 py-1 text-xs transition-colors ${
        isActive
          ? isDark
            ? 'bg-[#2b2d34] text-white font-semibold'
            : 'bg-zinc-300 text-zinc-950 font-semibold'
          : isDark
          ? 'text-zinc-300 hover:bg-[#22242a]'
          : 'text-zinc-700 hover:bg-zinc-200/70'
      }`}
    >
      <span className="truncate">{label}</span>
      {changedCount > 0 ? (
        <span className="font-mono text-[11px] text-amber-400 tabular-nums">
          {badgeSuffix ? `${changedCount} ${badgeSuffix}` : `● ${changedCount}`}
        </span>
      ) : (
        <span className="font-mono text-[11px] text-zinc-600">✓</span>
      )}
    </button>
  );
};
