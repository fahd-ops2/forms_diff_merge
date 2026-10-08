import React, { useState } from 'react';
import { SourceCodeDiff } from '../diff/diff-models';

interface SplitSourceDiffProps {
  diff: SourceCodeDiff;
  isDark: boolean;
}

export const SplitSourceDiff: React.FC<SplitSourceDiffProps> = ({ diff, isDark }) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  return (
    <div
      className={`mt-3 rounded-md border overflow-hidden ${
        isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b text-xs ${
          isDark
            ? 'border-slate-800 bg-slate-900/80 text-slate-300'
            : 'border-slate-200 bg-slate-100 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 font-mono">
          <span className="font-semibold">{diff.sourceType} Source</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          {diff.addedLines > 0 && (
            <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
              +{diff.addedLines} added
            </span>
          )}
          {diff.removedLines > 0 && (
            <span className={isDark ? 'text-rose-400' : 'text-rose-700'}>
              −{diff.removedLines} removed
            </span>
          )}
          {diff.modifiedLines > 0 && (
            <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>
              ~{diff.modifiedLines} modified
            </span>
          )}
          {diff.addedLines === 0 && diff.removedLines === 0 && diff.modifiedLines === 0 && (
            <span className="text-slate-500">Unchanged</span>
          )}
        </div>

        <div
          className={`flex items-center gap-1 p-0.5 rounded ${
            isDark ? 'bg-slate-800' : 'bg-slate-200/80'
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              viewMode === 'split'
                ? isDark
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('unified')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              viewMode === 'unified'
                ? isDark
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unified
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="grid grid-cols-2 divide-x divide-slate-800/60 font-mono text-xs overflow-x-auto">
          {/* OLD PANE */}
          <div className="min-w-[280px]">
            <div
              className={`px-3 py-1.5 border-b font-semibold tracking-wide text-[11px] ${
                isDark
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                  : 'border-slate-200 bg-slate-100/70 text-slate-600'
              }`}
            >
              OLD
            </div>
            <div className="divide-y divide-transparent">
              {diff.lines.map((line, idx) => {
                const isRemoved = line.type === 'removed';
                const isModified = line.type === 'modified';
                const isEmpty = line.type === 'added';

                let rowBg = '';
                if (isRemoved) {
                  rowBg = isDark ? 'bg-rose-950/45 text-rose-200' : 'bg-rose-50 text-rose-900';
                } else if (isModified) {
                  rowBg = isDark ? 'bg-amber-950/35 text-amber-200' : 'bg-amber-50 text-amber-900';
                } else if (isEmpty) {
                  rowBg = isDark ? 'bg-slate-900/30 opacity-40' : 'bg-slate-100/60 opacity-40';
                }

                const marker = isRemoved ? '−' : isModified ? '~' : ' ';

                return (
                  <div
                    key={`old-${idx}`}
                    className={`flex items-baseline px-2 py-0.5 leading-5 ${rowBg}`}
                  >
                    <span className="w-7 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                      {line.oldLineNumber ?? ''}
                    </span>
                    <span className="w-4 shrink-0 select-none font-bold text-center">
                      {marker}
                    </span>
                    <span className="whitespace-pre overflow-x-auto">
                      {line.oldContent ?? ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEW PANE */}
          <div className="min-w-[280px]">
            <div
              className={`px-3 py-1.5 border-b font-semibold tracking-wide text-[11px] ${
                isDark
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                  : 'border-slate-200 bg-slate-100/70 text-slate-600'
              }`}
            >
              NEW
            </div>
            <div className="divide-y divide-transparent">
              {diff.lines.map((line, idx) => {
                const isAdded = line.type === 'added';
                const isModified = line.type === 'modified';
                const isEmpty = line.type === 'removed';

                let rowBg = '';
                if (isAdded) {
                  rowBg = isDark
                    ? 'bg-emerald-950/45 text-emerald-200'
                    : 'bg-emerald-50 text-emerald-900';
                } else if (isModified) {
                  rowBg = isDark
                    ? 'bg-amber-950/35 text-amber-200'
                    : 'bg-amber-50 text-amber-900';
                } else if (isEmpty) {
                  rowBg = isDark ? 'bg-slate-900/30 opacity-40' : 'bg-slate-100/60 opacity-40';
                }

                const marker = isAdded ? '+' : isModified ? '~' : ' ';

                return (
                  <div
                    key={`new-${idx}`}
                    className={`flex items-baseline px-2 py-0.5 leading-5 ${rowBg}`}
                  >
                    <span className="w-7 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                      {line.newLineNumber ?? ''}
                    </span>
                    <span className="w-4 shrink-0 select-none font-bold text-center">
                      {marker}
                    </span>
                    <span className="whitespace-pre overflow-x-auto">
                      {line.newContent ?? ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Unified diff view */
        <div className="font-mono text-xs overflow-x-auto py-1">
          {diff.lines.map((line, idx) => {
            if (line.type === 'unchanged') {
              return (
                <div key={idx} className="flex items-baseline px-3 py-0.5 leading-5">
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none text-slate-500"> </span>
                  <span className="whitespace-pre">{line.newContent}</span>
                </div>
              );
            }
            if (line.type === 'removed') {
              return (
                <div
                  key={idx}
                  className={`flex items-baseline px-3 py-0.5 leading-5 ${
                    isDark ? 'bg-rose-950/45 text-rose-200' : 'bg-rose-50 text-rose-900'
                  }`}
                >
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                    {line.oldLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold">−</span>
                  <span className="whitespace-pre">{line.oldContent}</span>
                </div>
              );
            }
            if (line.type === 'added') {
              return (
                <div
                  key={idx}
                  className={`flex items-baseline px-3 py-0.5 leading-5 ${
                    isDark ? 'bg-emerald-950/45 text-emerald-200' : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold">+</span>
                  <span className="whitespace-pre">{line.newContent}</span>
                </div>
              );
            }
            return (
              <React.Fragment key={idx}>
                <div
                  className={`flex items-baseline px-3 py-0.5 leading-5 ${
                    isDark ? 'bg-rose-950/35 text-rose-200' : 'bg-rose-50 text-rose-900'
                  }`}
                >
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                    {line.oldLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold">−</span>
                  <span className="whitespace-pre">{line.oldContent}</span>
                </div>
                <div
                  className={`flex items-baseline px-3 py-0.5 leading-5 ${
                    isDark ? 'bg-emerald-950/35 text-emerald-200' : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <span className="w-8 shrink-0 select-none text-right pr-2 text-slate-500 tabular-nums">
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold">+</span>
                  <span className="whitespace-pre">{line.newContent}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
