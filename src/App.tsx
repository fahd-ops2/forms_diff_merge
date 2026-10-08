import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  FolderOpen,
  Globe,
  Moon,
  Play,
  Sun,
  Upload,
} from 'lucide-react';
import { CompareWorkspace } from './components/CompareWorkspace';
import { MergeWorkspace } from './components/MergeWorkspace';
import {
  ErrorModal,
  HtmlReportPreviewModal,
  TestSuiteModal,
  ToolingConfigModal,
} from './components/Modals';
import { DiffEngine } from './diff/diff-engine';
import { FmbComparisonResult } from './diff/diff-models';
import { FmbExtractor, FmbFileInput } from './fmb/extractor/fmb-extractor';
import {
  getCustomerV1Fixture,
  getCustomerV2Fixture,
} from './fmb/fixtures/sample-forms';
import { FmbExtractionError } from './fmb/models/fmb-models';
import { FmbNormalizer } from './fmb/normalizer/fmb-normalizer';
import { FmbParser } from './fmb/parser/fmb-parser';
import {
  I18nProvider,
  LocaleCode,
  SUPPORTED_LOCALES,
  useI18n,
} from './i18n/translations';
import { ConflictResolver } from './merge/conflict-resolver';
import { MergeEngine } from './merge/merge-engine';
import {
  MergeValidationReport,
  ThreeWayMergeResult,
} from './merge/merge-models';
import { HtmlReportGenerator } from './report/html-report';

type ActiveMode = 'compare' | 'merge';

interface AnalysisProgress {
  title: string;
  percent: number;
  steps: Array<{
    label: string;
    state: 'done' | 'active' | 'pending';
  }>;
}

function FmbDesktopWorkbench() {
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<ActiveMode>('compare');
  const [isDark, setIsDark] = useState<boolean>(true);

  const [oldFileInput, setOldFileInput] = useState<FmbFileInput | null>({
    name: 'customer_v1.fmb',
    size: 2516582,
    presetRole: 'v1',
  });
  const [newFileInput, setNewFileInput] = useState<FmbFileInput | null>({
    name: 'customer_v2.fmb',
    size: 2726297,
    presetRole: 'v2',
  });

  const [baseFileInput, setBaseFileInput] = useState<FmbFileInput | null>({
    name: 'customer_base.fmb',
    size: 2485120,
    presetRole: 'base',
  });
  const [oursFileInput, setOursFileInput] = useState<FmbFileInput | null>({
    name: 'customer_ours.fmb',
    size: 2641920,
    presetRole: 'ours',
  });
  const [theirsFileInput, setTheirsFileInput] = useState<FmbFileInput | null>({
    name: 'customer_theirs.fmb',
    size: 2610400,
    presetRole: 'theirs',
  });

  const [compareResult, setCompareResult] =
    useState<FmbComparisonResult | null>(null);
  const [mergeResult, setMergeResult] = useState<ThreeWayMergeResult | null>(
    null
  );

  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [dragOverlayState, setDragOverlayState] = useState<
    'none' | 'valid' | 'invalid'
  >('none');
  const [inlineToast, setInlineToast] = useState<string | null>(null);

  const [activeError, setActiveError] = useState<FmbExtractionError | null>(
    null
  );
  const [showToolingModal, setShowToolingModal] = useState(false);
  const [showTestSuiteModal, setShowTestSuiteModal] = useState(false);
  const [reportPreview, setReportPreview] = useState<{
    title: string;
    html: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<
    'both' | 'old' | 'new' | 'base' | 'ours' | 'theirs'
  >('both');

  const showToast = (msg: string) => {
    setInlineToast(msg);
    setTimeout(() => setInlineToast(null), 3500);
  };

  const triggerDownload = (
    filename: string,
    content: string,
    mimeType = 'text/html;charset=utf-8'
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runComparison = useCallback(
    async (overrideOld?: FmbFileInput, overrideNew?: FmbFileInput) => {
      const targetOld = overrideOld ?? oldFileInput;
      const targetNew = overrideNew ?? newFileInput;

      if (!targetOld || !targetNew) {
        return;
      }

      try {
        setProgress({
          title: t.progress.analyzingCompare,
          percent: 18,
          steps: [
            { label: t.progress.stepReadOld, state: 'active' },
            { label: t.progress.stepReadNew, state: 'pending' },
            { label: t.progress.stepExtractObjects, state: 'pending' },
            { label: t.progress.stepCompareStructure, state: 'pending' },
            { label: t.progress.stepAnalyzeSource, state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 85));
        const rawOld = await FmbExtractor.extract(targetOld);

        setProgress({
          title: t.progress.analyzingCompare,
          percent: 42,
          steps: [
            { label: t.progress.stepReadOld, state: 'done' },
            { label: t.progress.stepReadNew, state: 'active' },
            { label: t.progress.stepExtractObjects, state: 'pending' },
            { label: t.progress.stepCompareStructure, state: 'pending' },
            { label: t.progress.stepAnalyzeSource, state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 85));
        const rawNew = await FmbExtractor.extract(targetNew);

        setProgress({
          title: t.progress.analyzingCompare,
          percent: 64,
          steps: [
            { label: t.progress.stepReadOld, state: 'done' },
            { label: t.progress.stepReadNew, state: 'done' },
            { label: t.progress.stepExtractObjects, state: 'done' },
            { label: t.progress.stepCompareStructure, state: 'active' },
            { label: t.progress.stepAnalyzeSource, state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 85));
        const normalizedOld = FmbNormalizer.normalize(FmbParser.parse(rawOld));
        const normalizedNew = FmbNormalizer.normalize(FmbParser.parse(rawNew));

        setProgress({
          title: t.progress.analyzingCompare,
          percent: 82,
          steps: [
            { label: t.progress.stepReadOld, state: 'done' },
            { label: t.progress.stepReadNew, state: 'done' },
            { label: t.progress.stepExtractObjects, state: 'done' },
            { label: t.progress.stepCompareStructure, state: 'done' },
            { label: t.progress.stepAnalyzeSource, state: 'active' },
          ],
        });

        await new Promise((r) => setTimeout(r, 100));
        const diffResult = DiffEngine.compare(normalizedOld, normalizedNew);

        setProgress(null);
        setCompareResult(diffResult);
      } catch (err) {
        setProgress(null);
        if (err instanceof FmbExtractionError) {
          setActiveError(err);
        } else {
          setActiveError(
            new FmbExtractionError({
              code: 'PARSE_FAILURE',
              fileName: targetOld.name,
              message: t.modals.errorDefaultTitle,
              technicalDetails: err instanceof Error ? err.message : String(err),
              remediationSteps: [t.modals.chooseAnotherFileBtn],
            })
          );
        }
      }
    },
    [oldFileInput, newFileInput, t]
  );

  const runMergeAnalysis = useCallback(
    async (
      overrideBase?: FmbFileInput,
      overrideOurs?: FmbFileInput,
      overrideTheirs?: FmbFileInput
    ) => {
      const tBase = overrideBase ?? baseFileInput;
      const tOurs = overrideOurs ?? oursFileInput;
      const tTheirs = overrideTheirs ?? theirsFileInput;

      if (!tBase || !tOurs || !tTheirs) return;

      try {
        setProgress({
          title: t.progress.analyzingMerge,
          percent: 25,
          steps: [
            { label: t.progress.stepReadThreeWay, state: 'active' },
            { label: t.progress.stepNormalizeHierarchy, state: 'pending' },
            { label: t.progress.stepEvaluateRules, state: 'pending' },
            { label: t.progress.stepDetectConflicts, state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const [rawBase, rawOurs, rawTheirs] = await Promise.all([
          FmbExtractor.extract(tBase),
          FmbExtractor.extract(tOurs),
          FmbExtractor.extract(tTheirs),
        ]);

        setProgress({
          title: t.progress.analyzingMerge,
          percent: 60,
          steps: [
            { label: t.progress.stepReadThreeWay, state: 'done' },
            { label: t.progress.stepNormalizeHierarchy, state: 'active' },
            { label: t.progress.stepEvaluateRules, state: 'pending' },
            { label: t.progress.stepDetectConflicts, state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const normBase = FmbNormalizer.normalize(FmbParser.parse(rawBase));
        const normOurs = FmbNormalizer.normalize(FmbParser.parse(rawOurs));
        const normTheirs = FmbNormalizer.normalize(FmbParser.parse(rawTheirs));

        setProgress({
          title: t.progress.analyzingMerge,
          percent: 88,
          steps: [
            { label: t.progress.stepReadThreeWay, state: 'done' },
            { label: t.progress.stepNormalizeHierarchy, state: 'done' },
            { label: t.progress.stepEvaluateRules, state: 'done' },
            { label: t.progress.stepDetectConflicts, state: 'active' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const analysis = MergeEngine.analyzeThreeWayMerge(
          normBase,
          normOurs,
          normTheirs
        );

        setProgress(null);
        setMergeResult(analysis);
      } catch (err) {
        setProgress(null);
        if (err instanceof FmbExtractionError) {
          setActiveError(err);
        }
      }
    },
    [baseFileInput, oursFileInput, theirsFileInput, t]
  );

  const handleFilesSelected = (
    files: FileList | File[],
    slot: 'both' | 'old' | 'new' | 'base' | 'ours' | 'theirs' = 'both'
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const invalidFile = fileArray.find(
      (f) => !FmbExtractor.isValidExtension(f.name)
    );
    if (invalidFile) {
      setActiveError(
        new FmbExtractionError({
          code: 'UNSUPPORTED_EXTENSION',
          fileName: invalidFile.name,
          message: t.modals.errorFileUnsupported,
          technicalDetails: `Rejected "${invalidFile.name}". Expected .fmb, .xml (Forms2XML), or .fmt.`,
          remediationSteps: [t.modals.errorFileUnsupported],
        })
      );
      return;
    }

    if (mode === 'compare') {
      if (fileArray.length >= 2 && slot === 'both') {
        setOldFileInput({
          name: fileArray[0].name,
          size: fileArray[0].size || 2516582,
          file: fileArray[0],
        });
        setNewFileInput({
          name: fileArray[1].name,
          size: fileArray[1].size || 2726297,
          file: fileArray[1],
        });
        setCompareResult(null);
      } else {
        const f = fileArray[0];
        if (slot === 'old' || (slot === 'both' && !oldFileInput)) {
          setOldFileInput({ name: f.name, size: f.size || 2516582, file: f });
        } else {
          setNewFileInput({ name: f.name, size: f.size || 2726297, file: f });
        }
        setCompareResult(null);
      }
    } else {
      if (fileArray.length >= 3 && slot === 'both') {
        setBaseFileInput({
          name: fileArray[0].name,
          size: fileArray[0].size || 2485120,
          file: fileArray[0],
        });
        setOursFileInput({
          name: fileArray[1].name,
          size: fileArray[1].size || 2641920,
          file: fileArray[1],
        });
        setTheirsFileInput({
          name: fileArray[2].name,
          size: fileArray[2].size || 2610400,
          file: fileArray[2],
        });
        setMergeResult(null);
      } else {
        const f = fileArray[0];
        if (slot === 'base') {
          setBaseFileInput({ name: f.name, size: f.size || 2485120, file: f });
        } else if (slot === 'ours') {
          setOursFileInput({ name: f.name, size: f.size || 2641920, file: f });
        } else {
          setTheirsFileInput({
            name: f.name,
            size: f.size || 2610400,
            file: f,
          });
        }
        setMergeResult(null);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveError(null);
        setShowToolingModal(false);
        setShowTestSuiteModal(false);
        setReportPreview(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setPendingSlot('both');
        fileInputRef.current?.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'compare' && oldFileInput && newFileInput) {
          runComparison();
        } else if (
          mode === 'merge' &&
          baseFileInput &&
          oursFileInput &&
          theirsFileInput
        ) {
          runMergeAnalysis();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        if (mode === 'compare' && compareResult) {
          e.preventDefault();
          runComparison();
        } else if (mode === 'merge' && mergeResult) {
          e.preventDefault();
          runMergeAnalysis();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (mode === 'compare' && compareResult) {
          e.preventDefault();
          const html =
            HtmlReportGenerator.generateComparisonReport(compareResult);
          triggerDownload('fmb_comparison_report.html', html);
          showToast('fmb_comparison_report.html');
        } else if (mode === 'merge' && mergeResult) {
          e.preventDefault();
          const html = HtmlReportGenerator.generateMergeReport(mergeResult);
          triggerDownload('fmb_merge_report.html', html);
          showToast('fmb_merge_report.html');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    mode,
    oldFileInput,
    newFileInput,
    baseFileInput,
    oursFileInput,
    theirsFileInput,
    compareResult,
    mergeResult,
    runComparison,
    runMergeAnalysis,
  ]);

  const formatSize = (bytes: number) =>
    `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleDownloadSampleFmbBundle = () => {
    const v1Xml = FmbExtractor.serializeToOracleXml(getCustomerV1Fixture());
    const v2Xml = FmbExtractor.serializeToOracleXml(getCustomerV2Fixture());
    triggerDownload('customer_v1.fmb', v1Xml, 'application/octet-stream');
    setTimeout(() => {
      triggerDownload('customer_v2.fmb', v2Xml, 'application/octet-stream');
    }, 250);
    showToast('customer_v1.fmb + customer_v2.fmb');
  };

  const btnSecondary = isDark
    ? 'border-[#34363d] bg-[#25272c] text-zinc-200 hover:bg-[#2f3138]'
    : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100';

  const btnPrimary = isDark
    ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
    : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        const items = Array.from(e.dataTransfer.items || []);
        if (items.length > 0) {
          setDragOverlayState('valid');
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverlayState('none');
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverlayState('none');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFilesSelected(e.dataTransfer.files, 'both');
        }
      }}
      className={`h-screen flex flex-col overflow-hidden select-none ${
        isDark ? 'bg-[#141517] text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".fmb,.xml,.fmt"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(e.target.files, pendingSlot);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Global Drag & Drop Overlay */}
      {dragOverlayState !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 pointer-events-none">
          <div className="w-full max-w-md border-2 border-dashed border-zinc-300 bg-[#18191c] p-10 text-center">
            <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <div className="text-sm font-mono font-semibold text-white">
              {t.compareHome.dropPrompt}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Contract: 3 Zones (Zone 1: Single Brand Wordmark, Zone 2: 4 Nav Links, Zone 3: Language + Theme + Sample Action) */}
      <header
        className={`h-10 px-4 border-b flex items-center justify-between shrink-0 ${
          isDark
            ? 'border-[#2b2d32] bg-[#1c1d21]'
            : 'border-zinc-300 bg-zinc-200/80'
        }`}
      >
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setCompareResult(null);
            setMergeResult(null);
          }}
          className="text-xs font-mono font-bold tracking-tight whitespace-nowrap"
        >
          {t.appTitle}
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('compare')}
            className={`py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'compare'
                ? isDark
                  ? 'border-zinc-100 text-white font-semibold'
                  : 'border-zinc-900 text-zinc-950 font-semibold'
                : isDark
                ? 'border-transparent text-zinc-400 hover:text-zinc-200'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.modes.compare}
          </button>
          <button
            type="button"
            onClick={() => setMode('merge')}
            className={`py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'merge'
                ? isDark
                  ? 'border-zinc-100 text-white font-semibold'
                  : 'border-zinc-900 text-zinc-950 font-semibold'
                : isDark
                ? 'border-transparent text-zinc-400 hover:text-zinc-200'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.modes.merge}
          </button>
          <button
            type="button"
            onClick={() => setShowTestSuiteModal(true)}
            className={`py-2.5 border-b-2 border-transparent transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.modes.tests}
          </button>
          <button
            type="button"
            onClick={() => setShowToolingModal(true)}
            className={`py-2.5 border-b-2 border-transparent transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.modes.tooling}
          </button>
        </nav>

        {/* Zone 3: Language Switcher + Sample Files + Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Native Language Switcher */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-2 pointer-events-none" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              aria-label={t.toolbar.language}
              className={`pl-6 pr-5 py-1 text-xs font-mono border outline-none cursor-pointer ${btnSecondary}`}
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.label} · {loc.nativeName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadSampleFmbBundle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap ${btnSecondary}`}
          >
            <Download className="w-3.5 h-3.5" />
            {t.toolbar.sampleFiles}
          </button>

          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label="Toggle color theme"
            className={`p-1 border transition-colors ${btnSecondary}`}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {inlineToast && (
        <div className="fixed bottom-3 right-3 z-40 px-3 py-1.5 border border-zinc-500 bg-[#18191c] text-xs font-mono text-zinc-100 shadow-lg">
          ✓ {inlineToast}
        </div>
      )}

      {/* Main Desktop Workbench Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {progress ? (
          /* Utilitarian Desktop Progress Dialog (Section 5) */
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className={`w-full max-w-md border p-5 ${
                isDark
                  ? 'border-[#2e3036] bg-[#18191c]'
                  : 'border-zinc-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold">
                  {progress.title}
                </span>
                <span className="font-mono text-xs font-bold tabular-nums">
                  {progress.percent}%
                </span>
              </div>

              <div
                className={`w-full h-1.5 overflow-hidden mb-4 ${
                  isDark ? 'bg-[#26282d]' : 'bg-zinc-200'
                }`}
              >
                <div
                  className={`h-full transition-transform duration-150 origin-left ${
                    isDark ? 'bg-zinc-200' : 'bg-zinc-800'
                  }`}
                  style={{ transform: `scaleX(${progress.percent / 100})` }}
                />
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {progress.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {step.state === 'done' && (
                      <span className="text-emerald-400 font-bold">✓</span>
                    )}
                    {step.state === 'active' && (
                      <span className="text-amber-400 font-bold">●</span>
                    )}
                    {step.state === 'pending' && (
                      <span className="text-zinc-600">○</span>
                    )}
                    <span
                      className={
                        step.state === 'done'
                          ? isDark
                            ? 'text-zinc-300'
                            : 'text-zinc-700'
                          : step.state === 'active'
                          ? 'font-semibold'
                          : 'text-zinc-500'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : mode === 'compare' && compareResult ? (
          <CompareWorkspace
            result={compareResult}
            isDark={isDark}
            onResetFiles={() => setCompareResult(null)}
            onRerun={() => runComparison()}
            onSwapFiles={() => {
              const prevOld = oldFileInput;
              const prevNew = newFileInput;
              setOldFileInput(prevNew);
              setNewFileInput(prevOld);
              if (prevNew && prevOld) {
                runComparison(prevNew, prevOld);
              }
            }}
            onPreviewHtmlReport={() => {
              const html =
                HtmlReportGenerator.generateComparisonReport(compareResult);
              setReportPreview({
                title: `${compareResult.oldModel.metadata.fileName} → ${compareResult.newModel.metadata.fileName}`,
                html,
                fileName: 'fmb_comparison_report.html',
              });
            }}
            onExportHtmlReport={() => {
              const html =
                HtmlReportGenerator.generateComparisonReport(compareResult);
              triggerDownload('fmb_comparison_report.html', html);
              showToast('fmb_comparison_report.html');
            }}
          />
        ) : mode === 'merge' && mergeResult ? (
          <MergeWorkspace
            result={mergeResult}
            isDark={isDark}
            onResolveConflict={(decisionId, choice, customVal) => {
              setMergeResult((prev) =>
                prev
                  ? ConflictResolver.resolveConflict(
                      prev,
                      decisionId,
                      choice,
                      customVal
                    )
                  : null
              );
            }}
            onResolveAllRemaining={(choice) => {
              setMergeResult((prev) =>
                prev ? ConflictResolver.resolveAllRemaining(prev, choice) : null
              );
            }}
            onUpdateOutputFileName={(name) => {
              setMergeResult((prev) =>
                prev ? { ...prev, outputFileName: name } : null
              );
            }}
            onValidateMerge={(): MergeValidationReport => {
              const report = MergeEngine.validateMergedModel(mergeResult);
              setMergeResult((prev) =>
                prev ? { ...prev, validation: report } : null
              );
              return report;
            }}
            onExportMergedFmb={() => {
              const mergedRaw =
                MergeEngine.reconstructMergedRawFmb(mergeResult);
              const xmlOutput = FmbExtractor.serializeToOracleXml(mergedRaw);
              triggerDownload(
                mergeResult.outputFileName,
                xmlOutput,
                'application/octet-stream'
              );
            }}
            onPreviewMergeReport={() => {
              const html = HtmlReportGenerator.generateMergeReport(mergeResult);
              setReportPreview({
                title: `${mergeResult.outputFileName}`,
                html,
                fileName: 'fmb_merge_report.html',
              });
            }}
            onExportMergeReport={() => {
              const html = HtmlReportGenerator.generateMergeReport(mergeResult);
              triggerDownload('fmb_merge_report.html', html);
              showToast('fmb_merge_report.html');
            }}
            onResetFiles={() => setMergeResult(null)}
          />
        ) : (
          /* Desktop Session Setup View (Section 3 & 4) — Crisp utilitarian layout */
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className={`w-full max-w-2xl border ${
                isDark
                  ? 'border-[#2e3036] bg-[#18191c]'
                  : 'border-zinc-300 bg-white'
              }`}
            >
              {/* Window Subheader Tabs: Compare | Merge */}
              <div
                className={`flex items-center gap-6 px-5 border-b ${
                  isDark
                    ? 'border-[#2e3036] bg-[#1e1f23]'
                    : 'border-zinc-300 bg-zinc-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMode('compare')}
                  className={`py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors ${
                    mode === 'compare'
                      ? isDark
                        ? 'border-zinc-100 text-white'
                        : 'border-zinc-900 text-zinc-950'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.modes.compare}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('merge')}
                  className={`py-2.5 text-xs font-mono font-semibold border-b-2 transition-colors ${
                    mode === 'merge'
                      ? isDark
                        ? 'border-zinc-100 text-white'
                        : 'border-zinc-900 text-zinc-950'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.modes.merge}
                </button>
              </div>

              <div className="p-6">
                {mode === 'compare' ? (
                  <div>
                    <h1 className="text-base font-semibold tracking-tight mb-1">
                      {t.compareHome.title}
                    </h1>
                    <p className="text-xs text-zinc-400 mb-5">
                      {t.compareHome.subtitle}
                    </p>

                    {/* Utilitarian Drop Target */}
                    <div
                      onClick={() => {
                        setPendingSlot('both');
                        fileInputRef.current?.click();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPendingSlot('both');
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`border border-dashed p-7 text-center cursor-pointer transition-colors ${
                        isDark
                          ? 'border-[#3a3d45] bg-[#141517] hover:border-zinc-400'
                          : 'border-zinc-400 bg-zinc-50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-mono font-semibold mb-1.5">
                        {t.compareHome.dropPrompt}
                      </div>
                      <div className="text-[11px] text-zinc-500 mb-3">
                        {t.compareHome.orText}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium border ${btnSecondary}`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        {t.compareHome.selectFilesBtn}
                      </span>
                    </div>

                    {/* OLD and NEW File Table */}
                    {oldFileInput && newFileInput ? (
                      <div
                        className={`mt-4 border ${
                          isDark
                            ? 'border-[#2e3036] bg-[#141517]'
                            : 'border-zinc-300 bg-zinc-50'
                        }`}
                      >
                        <div
                          className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x ${
                            isDark ? 'divide-[#2e3036]' : 'divide-zinc-300'
                          }`}
                        >
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-mono font-bold text-zinc-400">
                                {t.compareHome.oldLabel}
                              </div>
                              <div className="font-mono text-xs font-semibold mt-0.5">
                                {oldFileInput.name}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                                {formatSize(oldFileInput.size)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingSlot('old');
                                fileInputRef.current?.click();
                              }}
                              className={`px-2 py-1 text-[11px] font-mono border ${btnSecondary}`}
                            >
                              {t.compareHome.changeFileBtn}
                            </button>
                          </div>

                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-mono font-bold text-zinc-300">
                                {t.compareHome.newLabel}
                              </div>
                              <div className="font-mono text-xs font-semibold mt-0.5">
                                {newFileInput.name}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                                {formatSize(newFileInput.size)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingSlot('new');
                                fileInputRef.current?.click();
                              }}
                              className={`px-2 py-1 text-[11px] font-mono border ${btnSecondary}`}
                            >
                              {t.compareHome.changeFileBtn}
                            </button>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-2.5 border-t flex items-center justify-between ${
                            isDark
                              ? 'border-[#2e3036] bg-[#1c1d21]'
                              : 'border-zinc-300 bg-zinc-100'
                          }`}
                        >
                          <span className="text-xs font-mono text-zinc-400">
                            ✓ {t.compareHome.filesReadyStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => runComparison()}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold border transition-colors ${btnPrimary}`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            {t.compareHome.compareBtn}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-xs text-zinc-500">
                        {t.compareHome.emptyPrompt}
                      </div>
                    )}

                    {/* Quick Test Fixtures Strip */}
                    <div
                      className={`mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                        isDark ? 'border-[#2e3036]' : 'border-zinc-200'
                      }`}
                    >
                      <span className="text-zinc-500">
                        {t.compareHome.presetsTitle}
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v1: FmbFileInput = {
                              name: 'customer_v1.fmb',
                              size: 2516582,
                              presetRole: 'v1',
                            };
                            const v2: FmbFileInput = {
                              name: 'customer_v2.fmb',
                              size: 2726297,
                              presetRole: 'v2',
                            };
                            setOldFileInput(v1);
                            setNewFileInput(v2);
                            runComparison(v1, v2);
                          }}
                          className="underline hover:text-zinc-200"
                        >
                          {t.compareHome.presetStandard}
                        </button>
                        <span className="text-zinc-600">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const v1: FmbFileInput = {
                              name: 'customer_v1.fmb',
                              size: 2516582,
                              presetRole: 'v1',
                            };
                            const v1Copy: FmbFileInput = {
                              name: 'customer_v1_copy.fmb',
                              size: 2516582,
                              presetRole: 'identical',
                            };
                            setOldFileInput(v1);
                            setNewFileInput(v1Copy);
                            runComparison(v1, v1Copy);
                          }}
                          className="text-zinc-400 underline hover:text-zinc-200"
                        >
                          {t.compareHome.presetIdentical}
                        </button>
                        <span className="text-zinc-600">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const bad: FmbFileInput = {
                              name: 'corrupted_locked.fmb',
                              size: 0,
                            };
                            const v2: FmbFileInput = {
                              name: 'customer_v2.fmb',
                              size: 2726297,
                              presetRole: 'v2',
                            };
                            runComparison(bad, v2);
                          }}
                          className="text-zinc-400 underline hover:text-zinc-200"
                        >
                          {t.compareHome.presetCorrupted}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MERGE SETUP */
                  <div>
                    <h1 className="text-base font-semibold tracking-tight mb-1">
                      {t.mergeHome.title}
                    </h1>
                    <p className="text-xs text-zinc-400 mb-5">
                      {t.mergeHome.subtitle}
                    </p>

                    <div
                      className={`border ${
                        isDark
                          ? 'border-[#2e3036] bg-[#141517]'
                          : 'border-zinc-300 bg-zinc-50'
                      }`}
                    >
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x ${
                          isDark ? 'divide-[#2e3036]' : 'divide-zinc-300'
                        }`}
                      >
                        <div className="p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-zinc-400">
                              {t.mergeHome.baseLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingSlot('base');
                                fileInputRef.current?.click();
                              }}
                              className="text-[11px] font-mono underline text-zinc-300"
                            >
                              {t.mergeHome.selectBtn}
                            </button>
                          </div>
                          <div className="font-mono text-xs font-semibold truncate">
                            {baseFileInput?.name || '—'}
                          </div>
                          {baseFileInput && (
                            <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-0.5">
                              {formatSize(baseFileInput.size)}
                            </div>
                          )}
                        </div>

                        <div className="p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-sky-400">
                              {t.mergeHome.oursLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingSlot('ours');
                                fileInputRef.current?.click();
                              }}
                              className="text-[11px] font-mono underline text-zinc-300"
                            >
                              {t.mergeHome.selectBtn}
                            </button>
                          </div>
                          <div className="font-mono text-xs font-semibold truncate">
                            {oursFileInput?.name || '—'}
                          </div>
                          {oursFileInput && (
                            <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-0.5">
                              {formatSize(oursFileInput.size)}
                            </div>
                          )}
                        </div>

                        <div className="p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-amber-400">
                              {t.mergeHome.theirsLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingSlot('theirs');
                                fileInputRef.current?.click();
                              }}
                              className="text-[11px] font-mono underline text-zinc-300"
                            >
                              {t.mergeHome.selectBtn}
                            </button>
                          </div>
                          <div className="font-mono text-xs font-semibold truncate">
                            {theirsFileInput?.name || '—'}
                          </div>
                          {theirsFileInput && (
                            <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-0.5">
                              {formatSize(theirsFileInput.size)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`px-3.5 py-2.5 border-t flex items-center justify-between ${
                          isDark
                            ? 'border-[#2e3036] bg-[#1c1d21]'
                            : 'border-zinc-300 bg-zinc-100'
                        }`}
                      >
                        <span className="text-xs font-mono text-zinc-400">
                          ✓ {t.mergeHome.readyStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => runMergeAnalysis()}
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold border transition-colors ${btnPrimary}`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          {t.mergeHome.analyzeMergeBtn}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                        isDark ? 'border-[#2e3036]' : 'border-zinc-200'
                      }`}
                    >
                      <span className="text-zinc-500">
                        {t.mergeHome.presetsTitle}
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const b: FmbFileInput = {
                              name: 'customer_base.fmb',
                              size: 2485120,
                              presetRole: 'base',
                            };
                            const o: FmbFileInput = {
                              name: 'customer_ours.fmb',
                              size: 2641920,
                              presetRole: 'ours',
                            };
                            const th: FmbFileInput = {
                              name: 'customer_theirs.fmb',
                              size: 2610400,
                              presetRole: 'theirs',
                            };
                            setBaseFileInput(b);
                            setOursFileInput(o);
                            setTheirsFileInput(th);
                            runMergeAnalysis(b, o, th);
                          }}
                          className="underline hover:text-zinc-200"
                        >
                          {t.mergeHome.presetConflicts}
                        </button>
                        <span className="text-zinc-600">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const b: FmbFileInput = {
                              name: 'customer_base.fmb',
                              size: 2485120,
                              presetRole: 'base',
                            };
                            const o: FmbFileInput = {
                              name: 'customer_ours.fmb',
                              size: 2641920,
                              presetRole: 'ours',
                            };
                            const tClean: FmbFileInput = {
                              name: 'customer_theirs_clean.fmb',
                              size: 2485120,
                              presetRole: 'base',
                            };
                            setBaseFileInput(b);
                            setOursFileInput(o);
                            setTheirsFileInput(tClean);
                            runMergeAnalysis(b, o, tClean);
                          }}
                          className="text-zinc-400 underline hover:text-zinc-200"
                        >
                          {t.mergeHome.presetClean}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeError && (
        <ErrorModal
          error={activeError}
          isDark={isDark}
          onClose={() => setActiveError(null)}
          onRetry={() => {
            setActiveError(null);
            if (mode === 'compare') runComparison();
            else runMergeAnalysis();
          }}
          onOpenToolingConfig={() => {
            setActiveError(null);
            setShowToolingModal(true);
          }}
        />
      )}

      {showToolingModal && (
        <ToolingConfigModal
          isDark={isDark}
          onClose={() => setShowToolingModal(false)}
          onSimulateMissingToolingError={() => {
            setShowToolingModal(false);
            setActiveError(
              new FmbExtractionError({
                code: 'MISSING_ORACLE_TOOLING',
                fileName: 'customer_v1.fmb',
                message: t.modals.errorMissingToolingTitle,
                technicalDetails:
                  'Spawn ENOENT: C:\\Oracle\\Middleware\\Oracle_Home\\...\\frmf2xml.bat not found on PATH or ORACLE_HOME.',
                remediationSteps: ['Configure ORACLE_HOME path'],
              })
            );
          }}
        />
      )}

      {showTestSuiteModal && (
        <TestSuiteModal
          isDark={isDark}
          onClose={() => setShowTestSuiteModal(false)}
        />
      )}

      {reportPreview && (
        <HtmlReportPreviewModal
          title={reportPreview.title}
          htmlContent={reportPreview.html}
          defaultFileName={reportPreview.fileName}
          isDark={isDark}
          onClose={() => setReportPreview(null)}
          onDownload={() => {
            triggerDownload(reportPreview.fileName, reportPreview.html);
            showToast(reportPreview.fileName);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <FmbDesktopWorkbench />
    </I18nProvider>
  );
}
