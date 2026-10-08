import React, { useState } from 'react';
import { SourceCodeDiff } from '../diff/diff-models';
import { useI18n } from '../i18n/translations';

interface SplitSourceDiffProps {
  diff: SourceCodeDiff;
  isDark: boolean;
}

export const SplitSourceDiff: React.FC<SplitSourceDiffProps> = ({ diff, isDark }) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  return (
    <div
      dir="ltr"
      className={`mt-2 border ${
        isDark ? 'border-[#2e3036] bg-[#141517]' : 'border-zinc-300 bg-white'
      }`}
    >
      {/* Utilitarian Diff Gutter Toolbar */}
      <div
        className={`flex items-center justify-between px-2.5 py-1 border-b text-[11px] font-mono ${
          isDark
            ? 'border-[#2e3036] bg-[#1e1f23] text-zinc-300'
            : 'border-zinc-300 bg-zinc-100 text-zinc-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {diff.sourceType} {t.diffView.sourceLabel}
          </span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          {diff.addedLines > 0 && (
            <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
              +{diff.addedLines} {t.diffView.linesAdded}
            </span>
          )}
          {diff.removedLines > 0 && (
            <span className={isDark ? 'text-rose-400' : 'text-rose-700'}>
              −{diff.removedLines} {t.diffView.linesRemoved}
            </span>
          )}
          {diff.modifiedLines > 0 && (
            <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>
              ~{diff.modifiedLines} {t.diffView.linesModified}
            </span>
          )}
        </div>

        <div className="flex items-center border border-zinc-600/40">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 text-[11px] font-mono transition-colors whitespace-nowrap ${
              viewMode === 'split'
                ? isDark
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'bg-zinc-800 text-white font-semibold'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.diffView.splitViewBtn}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('unified')}
            className={`px-2 py-0.5 text-[11px] font-mono transition-colors whitespace-nowrap ${
              viewMode === 'unified'
                ? isDark
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'bg-zinc-800 text-white font-semibold'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.diffView.unifiedViewBtn}
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div
          className={`grid grid-cols-2 divide-x font-mono text-xs overflow-x-auto ${
            isDark ? 'divide-[#2e3036]' : 'divide-zinc-300'
          }`}
        >
          {/* OLD PANE */}
          <div className="min-w-[260px]">
            <div
              className={`px-2.5 py-1 border-b font-semibold text-[11px] ${
                isDark
                  ? 'border-[#2e3036] bg-[#1a1b1e] text-zinc-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}
            >
              {t.diffView.colOld}
            </div>
            <div>
              {diff.lines.map((line, idx) => {
                const isRemoved = line.type === 'removed';
                const isModified = line.type === 'modified';
                const isEmpty = line.type === 'added';

                let rowBg = '';
                if (isRemoved) {
                  rowBg = isDark
                    ? 'bg-[#3c191d] text-rose-200'
                    : 'bg-rose-100/80 text-rose-950';
                } else if (isModified) {
                  rowBg = isDark
                    ? 'bg-[#382b14] text-amber-200'
                    : 'bg-amber-100/70 text-amber-950';
                } else if (isEmpty) {
                  rowBg = isDark
                    ? 'bg-[#18191c] opacity-35'
                    : 'bg-zinc-100 opacity-40';
                }

                const marker = isRemoved ? '−' : isModified ? '~' : ' ';

                return (
                  <div
                    key={`old-${idx}`}
                    className={`flex items-baseline leading-5 ${rowBg}`}
                  >
                    <span
                      className={`w-8 shrink-0 select-none text-right pr-2 border-r text-[11px] tabular-nums ${
                        isDark
                          ? 'border-[#26282d] text-zinc-500 bg-[#18191c]'
                          : 'border-zinc-200 text-zinc-400 bg-zinc-50'
                      }`}
                    >
                      {line.oldLineNumber ?? ''}
                    </span>
                    <span className="w-5 shrink-0 select-none font-bold text-center">
                      {marker}
                    </span>
                    <span className="whitespace-pre pr-3">
                      {line.oldContent ?? ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEW PANE */}
          <div className="min-w-[260px]">
            <div
              className={`px-2.5 py-1 border-b font-semibold text-[11px] ${
                isDark
                  ? 'border-[#2e3036] bg-[#1a1b1e] text-zinc-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}
            >
              {t.diffView.colNew}
            </div>
            <div>
              {diff.lines.map((line, idx) => {
                const isAdded = line.type === 'added';
                const isModified = line.type === 'modified';
                const isEmpty = line.type === 'removed';

                let rowBg = '';
                if (isAdded) {
                  rowBg = isDark
                    ? 'bg-[#153224] text-emerald-200'
                    : 'bg-emerald-100/80 text-emerald-950';
                } else if (isModified) {
                  rowBg = isDark
                    ? 'bg-[#382b14] text-amber-200'
                    : 'bg-amber-100/70 text-amber-950';
                } else if (isEmpty) {
                  rowBg = isDark
                    ? 'bg-[#18191c] opacity-35'
                    : 'bg-zinc-100 opacity-40';
                }

                const marker = isAdded ? '+' : isModified ? '~' : ' ';

                return (
                  <div
                    key={`new-${idx}`}
                    className={`flex items-baseline leading-5 ${rowBg}`}
                  >
                    <span
                      className={`w-8 shrink-0 select-none text-right pr-2 border-r text-[11px] tabular-nums ${
                        isDark
                          ? 'border-[#26282d] text-zinc-500 bg-[#18191c]'
                          : 'border-zinc-200 text-zinc-400 bg-zinc-50'
                      }`}
                    >
                      {line.newLineNumber ?? ''}
                    </span>
                    <span className="w-5 shrink-0 select-none font-bold text-center">
                      {marker}
                    </span>
                    <span className="whitespace-pre pr-3">
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
        <div className="font-mono text-xs overflow-x-auto">
          {diff.lines.map((line, idx) => {
            if (line.type === 'unchanged') {
              return (
                <div key={idx} className="flex items-baseline leading-5">
                  <span
                    className={`w-9 shrink-0 select-none text-right pr-2 border-r text-[11px] tabular-nums ${
                      isDark
                        ? 'border-[#26282d] text-zinc-500 bg-[#18191c]'
                        : 'border-zinc-200 text-zinc-400 bg-zinc-50'
                    }`}
                  >
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none"> </span>
                  <span className="whitespace-pre pr-3">{line.newContent}</span>
                </div>
              );
            }
            if (line.type === 'removed') {
              return (
                <div
                  key={idx}
                  className={`flex items-baseline leading-5 ${
                    isDark ? 'bg-[#3c191d] text-rose-200' : 'bg-rose-100/80 text-rose-950'
                  }`}
                >
                  <span className="w-9 shrink-0 select-none text-right pr-2 border-r border-[#26282d] text-[11px] text-zinc-400 tabular-nums">
                    {line.oldLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold text-center">−</span>
                  <span className="whitespace-pre pr-3">{line.oldContent}</span>
                </div>
              );
            }
            if (line.type === 'added') {
              return (
                <div
                  key={idx}
                  className={`flex items-baseline leading-5 ${
                    isDark ? 'bg-[#153224] text-emerald-200' : 'bg-emerald-100/80 text-emerald-950'
                  }`}
                >
                  <span className="w-9 shrink-0 select-none text-right pr-2 border-r border-[#26282d] text-[11px] text-zinc-400 tabular-nums">
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold text-center">+</span>
                  <span className="whitespace-pre pr-3">{line.newContent}</span>
                </div>
              );
            }
            return (
              <React.Fragment key={idx}>
                <div
                  className={`flex items-baseline leading-5 ${
                    isDark ? 'bg-[#3c191d] text-rose-200' : 'bg-rose-100/80 text-rose-950'
                  }`}
                >
                  <span className="w-9 shrink-0 select-none text-right pr-2 border-r border-[#26282d] text-[11px] text-zinc-400 tabular-nums">
                    {line.oldLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold text-center">−</span>
                  <span className="whitespace-pre pr-3">{line.oldContent}</span>
                </div>
                <div
                  className={`flex items-baseline leading-5 ${
                    isDark ? 'bg-[#153224] text-emerald-200' : 'bg-emerald-100/80 text-emerald-950'
                  }`}
                >
                  <span className="w-9 shrink-0 select-none text-right pr-2 border-r border-[#26282d] text-[11px] text-zinc-400 tabular-nums">
                    {line.newLineNumber}
                  </span>
                  <span className="w-5 shrink-0 select-none font-bold text-center">+</span>
                  <span className="whitespace-pre pr-3">{line.newContent}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
