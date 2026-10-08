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

const OBJECT_TYPE_LABELS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'All Object Types' },
  { value: 'BLOCK', label: 'Blocks' },
  { value: 'ITEM', label: 'Items' },
  { value: 'TRIGGER', label: 'Triggers' },
  { value: 'PROGRAM_UNIT', label: 'Program Units' },
  { value: 'CANVAS', label: 'Canvases' },
  { value: 'WINDOW', label: 'Windows' },
  { value: 'LOV', label: 'LOVs' },
  { value: 'RECORD_GROUP', label: 'Record Groups' },
];

export const CompareWorkspace: React.FC<CompareWorkspaceProps> = ({
  result,
  isDark,
  onResetFiles,
  onRerun,
  onSwapFiles,
  onExportHtmlReport,
  onPreviewHtmlReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('CHANGES_ONLY');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedObjects, setExpandedObjects] = useState<Record<string, boolean>>(() => {
    // Expand the first trigger/program unit with source diff by default so split view is immediately discoverable
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

  const totalChanges =
    result.summary.added + result.summary.removed + result.summary.modified;

  // Filtered objects
  const filteredObjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return result.objectDiffs.filter((obj) => {
      // Status filter
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

      // Object type filter
      if (typeFilter !== 'ALL' && obj.type !== typeFilter) {
        return false;
      }

      // Tree navigation node filter
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

      // Search query
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

  // Group filtered objects by groupKey (e.g. CUSTOMER, ADDRESS, TRIGGERS, PROGRAM UNITS)
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

  // Build hierarchical Object Tree for left sidebar
  const treeSummary = useMemo(() => {
    const countChanges = (predicate: (o: ObjectDiffEntry) => boolean) => {
      const matching = result.objectDiffs.filter(predicate);
      const changed = matching.filter((o) => o.status !== 'UNCHANGED');
      const hasAdded = changed.some((o) => o.status === 'ADDED');
      const hasRemoved = changed.some((o) => o.status === 'REMOVED');
      const hasModified = changed.some((o) => o.status === 'MODIFIED');
      return {
        total: matching.length,
        changedCount: changed.length,
        allAdded: changed.length > 0 && changed.every((o) => o.status === 'ADDED'),
        hasAdded,
        hasRemoved,
        hasModified,
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

  // Keyboard shortcuts (Ctrl+F, ↑/↓, Enter)
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
            + Added
          </span>
        );
      case 'REMOVED':
        return (
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              isDark ? 'text-rose-400' : 'text-rose-700'
            }`}
          >
            − Removed
          </span>
        );
      case 'MODIFIED':
        return (
          <span
            className={`font-mono text-xs font-semibold whitespace-nowrap ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            ● Modified
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
            ✓ Unchanged
          </span>
        );
    }
  };

  const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex flex-col h-full">
      {/* Top Comparison Context & Summary Bar */}
      <div
        className={`px-6 py-3.5 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">
              Comparison · Module {result.newModel.metadata.moduleName} (Forms{' '}
              {result.newModel.metadata.formsVersion})
            </div>
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <span className="font-mono">{result.oldModel.metadata.fileName}</span>
              <span className="text-xs font-normal text-slate-500 tabular-nums">
                ({formatBytes(result.oldModel.metadata.fileSize)})
              </span>
              <span className="text-slate-500">→</span>
              <span className="font-mono">{result.newModel.metadata.fileName}</span>
              <span className="text-xs font-normal text-slate-500 tabular-nums">
                ({formatBytes(result.newModel.metadata.fileSize)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwapFiles}
              title="Swap Old and New FMB files"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Swap Old / New
            </button>
            <button
              type="button"
              onClick={onRerun}
              title="Re-run comparison (Ctrl+R)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-run
            </button>
            <button
              type="button"
              onClick={onResetFiles}
              title="Select different FMB files (Ctrl+O)"
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
              onClick={onPreviewHtmlReport}
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
              onClick={onExportHtmlReport}
              title="Export self-contained HTML comparison report (Ctrl+S)"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Metric Bar — visible immediately without scrolling */}
        <div
          className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-6 text-sm tabular-nums">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'ADDED' ? 'CHANGES_ONLY' : 'ADDED')
              }
              className={`flex items-center gap-2 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'ADDED'
                  ? 'opacity-45 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-base ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                +{result.summary.added}
              </span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Added
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'REMOVED' ? 'CHANGES_ONLY' : 'REMOVED')
              }
              className={`flex items-center gap-2 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'REMOVED'
                  ? 'opacity-45 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-base ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}
              >
                −{result.summary.removed}
              </span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Removed
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'MODIFIED' ? 'CHANGES_ONLY' : 'MODIFIED'
                )
              }
              className={`flex items-center gap-2 transition-opacity ${
                statusFilter !== 'ALL' &&
                statusFilter !== 'CHANGES_ONLY' &&
                statusFilter !== 'MODIFIED'
                  ? 'opacity-45 hover:opacity-100'
                  : ''
              }`}
            >
              <span
                className={`font-mono font-bold text-base ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}
              >
                ● {result.summary.modified}
              </span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Modified
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'ALL' ? 'CHANGES_ONLY' : 'ALL')
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="font-mono font-semibold text-base tabular-nums">
                ✓ {result.summary.unchanged}
              </span>
              <span>Same</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 tabular-nums">
            {result.summary.changedPropertyTotal} property changes ·{' '}
            {result.summary.changedTriggersCount} triggers ·{' '}
            {result.summary.changedProgramUnitsCount} program units modified
          </div>
        </div>
      </div>

      {/* Search & Instant Filter Bar */}
      <div
        className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search differences by object, property, or PL/SQL... (Ctrl+F)"
            className={`w-full pl-9 pr-8 py-1.5 text-xs rounded border outline-none transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented status filter */}
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded border ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-200/70 border-slate-300/80'
            }`}
          >
            {(
              [
                ['CHANGES_ONLY', 'Only changes'],
                ['ADDED', 'Added'],
                ['REMOVED', 'Removed'],
                ['MODIFIED', 'Modified'],
                ['ALL', 'Show unchanged'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  statusFilter === val
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-white text-slate-900 shadow-2xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Object Type Dropdown Filter */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              aria-label="Filter by Oracle Forms object type"
              className={`pl-8 pr-7 py-1 text-xs font-medium rounded border outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-blue-600'
              }`}
            >
              {OBJECT_TYPE_LABELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Left Object Navigation Tree + Right Progressive Disclosure Diff List */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Hierarchical Object Tree */}
        <aside
          className={`w-64 shrink-0 border-r overflow-y-auto p-3 select-none ${
            isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold tracking-tight text-slate-400">
              Object Hierarchy
            </span>
            {selectedTreeNode !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedTreeNode('ALL')}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Show all
              </button>
            )}
          </div>

          {/* Root Form Node */}
          <button
            type="button"
            onClick={() => setSelectedTreeNode('ALL')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold mb-1 transition-colors ${
              selectedTreeNode === 'ALL'
                ? isDark
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'bg-blue-50 text-blue-700'
                : isDark
                ? 'text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <span className="font-mono truncate">{result.newModel.metadata.moduleName}</span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {totalChanges}
            </span>
          </button>

          <div className="pl-2 border-l border-slate-800/70 ml-2.5 space-y-0.5 text-xs">
            {/* Windows */}
            <TreeCategoryButton
              label="Windows"
              nodeKey="CATEGORY:WINDOW"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.windows.changedCount}
              isDark={isDark}
            />

            {/* Canvases */}
            <TreeCategoryButton
              label="Canvases"
              nodeKey="CATEGORY:CANVAS"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.canvases.changedCount}
              isDark={isDark}
            />

            {/* Blocks */}
            <div className="pt-1">
              <div className="px-2 py-1 text-[11px] font-medium text-slate-500">
                Blocks
              </div>
              <div className="pl-2 border-l border-slate-800/60 ml-2 space-y-0.5">
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
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                        isActive
                          ? isDark
                            ? 'bg-blue-500/15 text-blue-300 font-semibold'
                            : 'bg-blue-50 text-blue-700 font-semibold'
                          : isDark
                          ? 'text-slate-300 hover:bg-slate-800/60'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="truncate">{blk.name}</span>
                      <span className="flex items-center gap-1.5">
                        {blk.stats.changedCount > 0 && (
                          <span className="text-[11px] text-slate-500 tabular-nums">
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

            {/* Triggers */}
            <TreeCategoryButton
              label="Triggers"
              nodeKey="CATEGORY:TRIGGER"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.triggers.changedCount}
              badgeSuffix="changes"
              isDark={isDark}
            />

            {/* Program Units */}
            <TreeCategoryButton
              label="Program Units"
              nodeKey="CATEGORY:PROGRAM_UNIT"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.programUnits.changedCount}
              badgeSuffix="changes"
              isDark={isDark}
            />

            {/* LOVs */}
            <TreeCategoryButton
              label="LOVs"
              nodeKey="CATEGORY:LOV"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.lovs.changedCount}
              isDark={isDark}
            />

            {/* Record Groups */}
            <TreeCategoryButton
              label="Record Groups"
              nodeKey="CATEGORY:RECORD_GROUP"
              selectedNode={selectedTreeNode}
              onSelect={setSelectedTreeNode}
              changedCount={treeSummary.recordGroups.changedCount}
              isDark={isDark}
            />
          </div>
        </aside>

        {/* Right Main Diff Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          {totalChanges === 0 && statusFilter === 'CHANGES_ONLY' ? (
            /* Empty State: Identical FMB files */
            <div
              className={`max-w-lg mx-auto my-16 p-8 rounded-lg border text-center ${
                isDark
                  ? 'border-slate-800 bg-slate-900/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-emerald-400 font-mono text-2xl mb-2">✓</div>
              <h2 className="text-base font-semibold mb-1">No differences</h2>
              <p className="text-xs text-slate-400 mb-5">
                The two FMB files contain the same normalized structure ({result.summary.unchanged}{' '}
                objects verified).
              </p>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Inspect {result.summary.unchanged} unchanged objects
              </button>
            </div>
          ) : groupedSections.length === 0 ? (
            /* Empty State: No matches for active search/filter */
            <div
              className={`max-w-lg mx-auto my-16 p-8 rounded-lg border text-center ${
                isDark
                  ? 'border-slate-800 bg-slate-900/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <h2 className="text-sm font-semibold mb-1">
                No differences match your current filter
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Try clearing the search query or switching to all object types.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('CHANGES_ONLY');
                  setTypeFilter('ALL');
                  setSelectedTreeNode('ALL');
                }}
                className="px-3.5 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl">
              {groupedSections.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.key]);

                return (
                  <section
                    key={group.key}
                    className={`rounded-lg border overflow-hidden ${
                      isDark
                        ? 'border-slate-800 bg-slate-900/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Section Group Header (e.g. ▼ CUSTOMER, ▼ TRIGGERS) */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b transition-colors ${
                        isDark
                          ? 'border-slate-800/80 bg-slate-900/90 hover:bg-slate-800/70'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-mono text-xs font-bold tracking-wide">
                          {group.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'object' : 'objects'}
                      </span>
                    </button>

                    {/* Progressive Disclosure Object Rows */}
                    {!isCollapsed && (
                      <div
                        className={`divide-y ${
                          isDark ? 'divide-slate-800/70' : 'divide-slate-200'
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
                                isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* Summary Row */}
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
                                className="px-4 py-3 cursor-pointer select-none"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`font-mono text-sm font-bold ${
                                        obj.status === 'ADDED'
                                          ? 'text-emerald-400'
                                          : obj.status === 'REMOVED'
                                          ? 'text-rose-400'
                                          : obj.status === 'MODIFIED'
                                          ? 'text-amber-400'
                                          : 'text-slate-500'
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
                                    <span className="font-mono text-sm font-semibold truncate">
                                      {obj.displayPath}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      · {obj.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {renderStatusIndicator(obj.status)}
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                  </div>
                                </div>

                                {/* Immediate Inline Property Diffs (Progressive Disclosure Level 2) */}
                                {obj.status === 'MODIFIED' && changedProps.length > 0 && (
                                  <div className="mt-2 pl-5 space-y-1">
                                    {changedProps.map((prop) => (
                                      <div
                                        key={prop.key}
                                        className="grid grid-cols-[160px_1fr] items-baseline gap-2 text-xs"
                                      >
                                        <span className="text-slate-400 font-medium">
                                          {prop.label}
                                        </span>
                                        <div className="font-mono flex flex-wrap items-center gap-2">
                                          <span
                                            className={
                                              isDark ? 'text-slate-400' : 'text-slate-600'
                                            }
                                          >
                                            {prop.oldFormatted}
                                          </span>
                                          <span className="text-slate-500">→</span>
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

                                {/* Immediate Inline Source Diff Summary for Triggers / Program Units */}
                                {hasSourceChanges && obj.sourceDiff && (
                                  <div className="mt-2 pl-5 flex items-center gap-3 text-xs font-mono">
                                    <span className="text-slate-400">
                                      {obj.sourceDiff.sourceType} Source:
                                    </span>
                                    {obj.sourceDiff.addedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                                        }
                                      >
                                        {obj.sourceDiff.addedLines}{' '}
                                        {obj.sourceDiff.addedLines === 1
                                          ? 'line'
                                          : 'lines'}{' '}
                                        added
                                      </span>
                                    )}
                                    {obj.sourceDiff.removedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-rose-400' : 'text-rose-700'
                                        }
                                      >
                                        {obj.sourceDiff.removedLines}{' '}
                                        {obj.sourceDiff.removedLines === 1
                                          ? 'line'
                                          : 'lines'}{' '}
                                        removed
                                      </span>
                                    )}
                                    {obj.sourceDiff.modifiedLines > 0 && (
                                      <span
                                        className={
                                          isDark ? 'text-amber-400' : 'text-amber-700'
                                        }
                                      >
                                        {obj.sourceDiff.modifiedLines}{' '}
                                        {obj.sourceDiff.modifiedLines === 1
                                          ? 'line'
                                          : 'lines'}{' '}
                                        modified
                                      </span>
                                    )}
                                    <span className="text-blue-400 text-[11px] font-sans">
                                      {isExpanded
                                        ? 'Hide split diff'
                                        : 'Click to inspect split diff'}
                                    </span>
                                  </div>
                                )}

                                {/* Brief summary for Added / Removed objects */}
                                {(obj.status === 'ADDED' || obj.status === 'REMOVED') && (
                                  <div className="mt-1.5 pl-5 text-xs text-slate-400 font-mono">
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

                              {/* Expanded Detail Drawer (Progressive Disclosure Level 3) */}
                              {isExpanded && (
                                <div
                                  className={`px-4 pb-4 pt-2 pl-9 border-t text-xs ${
                                    isDark
                                      ? 'border-slate-800/60 bg-slate-950/50'
                                      : 'border-slate-100 bg-slate-50/60'
                                  }`}
                                >
                                  {/* Split View for Trigger / Program Unit / Record Group SQL */}
                                  {obj.sourceDiff && (
                                    <SplitSourceDiff
                                      diff={obj.sourceDiff}
                                      isDark={isDark}
                                    />
                                  )}

                                  {/* Full Property Table */}
                                  {obj.propertyDiffs.length > 0 && (
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-semibold text-slate-400">
                                          Object Properties ({obj.propertyDiffs.length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowDevJsonFor((prev) => ({
                                              ...prev,
                                              [obj.id]: !prev[obj.id],
                                            }))
                                          }
                                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
                                        >
                                          <Code2 className="w-3 h-3" />
                                          {showDevJson
                                            ? 'Hide normalized JSON'
                                            : 'Developer normalized view'}
                                        </button>
                                      </div>

                                      <div
                                        className={`rounded border overflow-hidden ${
                                          isDark ? 'border-slate-800' : 'border-slate-200'
                                        }`}
                                      >
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr
                                              className={
                                                isDark
                                                  ? 'bg-slate-900/90 text-slate-400 border-b border-slate-800'
                                                  : 'bg-slate-100 text-slate-600 border-b border-slate-200'
                                              }
                                            >
                                              <th className="py-1.5 px-3 font-medium">
                                                Property
                                              </th>
                                              <th className="py-1.5 px-3 font-medium">
                                                OLD ({result.oldModel.metadata.fileName})
                                              </th>
                                              <th className="py-1.5 px-3 font-medium">
                                                NEW ({result.newModel.metadata.fileName})
                                              </th>
                                              <th className="py-1.5 px-3 font-medium text-right">
                                                State
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody
                                            className={`divide-y font-mono ${
                                              isDark
                                                ? 'divide-slate-800/60'
                                                : 'divide-slate-200'
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
                                                        ? 'bg-amber-950/15'
                                                        : 'bg-amber-50/60'
                                                      : 'opacity-70'
                                                  }
                                                >
                                                  <td className="py-1.5 px-3 font-sans font-medium">
                                                    {p.label}
                                                  </td>
                                                  <td className="py-1.5 px-3">
                                                    {p.oldFormatted}
                                                  </td>
                                                  <td
                                                    className={`py-1.5 px-3 ${
                                                      isChanged ? 'font-semibold' : ''
                                                    }`}
                                                  >
                                                    {p.newFormatted}
                                                  </td>
                                                  <td className="py-1.5 px-3 text-right">
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

                                  {/* Optional Developer / Debug Normalized JSON View */}
                                  {showDevJson && (
                                    <pre
                                      className={`mt-2 p-3 rounded border font-mono text-[11px] overflow-x-auto ${
                                        isDark
                                          ? 'bg-slate-950 border-slate-800 text-slate-300'
                                          : 'bg-slate-900 border-slate-300 text-slate-100'
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
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
        isActive
          ? isDark
            ? 'bg-blue-500/15 text-blue-300 font-semibold'
            : 'bg-blue-50 text-blue-700 font-semibold'
          : isDark
          ? 'text-slate-300 hover:bg-slate-800/60'
          : 'text-slate-700 hover:bg-slate-200/60'
      }`}
    >
      <span className="truncate">{label}</span>
      {changedCount > 0 ? (
        <span className="font-mono text-[11px] text-amber-400 tabular-nums">
          {badgeSuffix ? `${changedCount} ${badgeSuffix}` : `● ${changedCount}`}
        </span>
      ) : (
        <span className="font-mono text-[11px] text-slate-600">✓</span>
      )}
    </button>
  );
};
