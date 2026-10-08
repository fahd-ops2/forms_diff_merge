import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  FolderOpen,
  GitCompare,
  GitMerge,
  Loader2,
  Moon,
  Play,
  Settings,
  Sun,
  Terminal,
  Upload,
  AlertTriangle,
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
import { ConflictResolver } from './merge/conflict-resolver';
import { MergeEngine } from './merge/merge-engine';
import {
  ConflictResolutionChoice,
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

export default function App() {
  const [mode, setMode] = useState<ActiveMode>('compare');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Compare file inputs (pre-populated with customer_v1.fmb and customer_v2.fmb ready for 1-click Compare, or user can clear/drop their own)
  const [oldFileInput, setOldFileInput] = useState<FmbFileInput | null>({
    name: 'customer_v1.fmb',
    size: 2516582, // 2.4 MB
    presetRole: 'v1',
  });
  const [newFileInput, setNewFileInput] = useState<FmbFileInput | null>({
    name: 'customer_v2.fmb',
    size: 2726297, // 2.6 MB
    presetRole: 'v2',
  });

  // Merge file inputs (BASE, OURS, THEIRS)
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

  // Active results
  const [compareResult, setCompareResult] =
    useState<FmbComparisonResult | null>(null);
  const [mergeResult, setMergeResult] = useState<ThreeWayMergeResult | null>(
    null
  );

  // Progress & Drag States
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [dragOverlayState, setDragOverlayState] = useState<
    'none' | 'valid' | 'invalid'
  >('none');
  const [inlineToast, setInlineToast] = useState<string | null>(null);

  // Modals
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

  /**
   * Executes the non-blocking Compare pipeline with meaningful step-by-step progress.
   */
  const runComparison = useCallback(
    async (overrideOld?: FmbFileInput, overrideNew?: FmbFileInput) => {
      const targetOld = overrideOld ?? oldFileInput;
      const targetNew = overrideNew ?? newFileInput;

      if (!targetOld || !targetNew) {
        return;
      }

      try {
        setProgress({
          title: 'Analyzing FMB files...',
          percent: 18,
          steps: [
            { label: 'Reading old form', state: 'active' },
            { label: 'Reading new form', state: 'pending' },
            { label: 'Extracting objects', state: 'pending' },
            { label: 'Comparing structure', state: 'pending' },
            { label: 'Analyzing source changes...', state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const rawOld = await FmbExtractor.extract(targetOld);

        setProgress({
          title: 'Analyzing FMB files...',
          percent: 42,
          steps: [
            { label: 'Reading old form', state: 'done' },
            { label: 'Reading new form', state: 'active' },
            { label: 'Extracting objects', state: 'pending' },
            { label: 'Comparing structure', state: 'pending' },
            { label: 'Analyzing source changes...', state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const rawNew = await FmbExtractor.extract(targetNew);

        setProgress({
          title: 'Analyzing FMB files...',
          percent: 64,
          steps: [
            { label: 'Reading old form', state: 'done' },
            { label: 'Reading new form', state: 'done' },
            { label: 'Extracting objects', state: 'done' },
            { label: 'Comparing structure', state: 'active' },
            { label: 'Analyzing source changes...', state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 90));
        const normalizedOld = FmbNormalizer.normalize(FmbParser.parse(rawOld));
        const normalizedNew = FmbNormalizer.normalize(FmbParser.parse(rawNew));

        setProgress({
          title: 'Analyzing FMB files...',
          percent: 82,
          steps: [
            { label: 'Reading old form', state: 'done' },
            { label: 'Reading new form', state: 'done' },
            { label: 'Extracting objects', state: 'done' },
            { label: 'Comparing structure', state: 'done' },
            { label: 'Analyzing source changes...', state: 'active' },
          ],
        });

        await new Promise((r) => setTimeout(r, 110));
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
              message: 'Unable to read the selected FMB file.',
              technicalDetails: err instanceof Error ? err.message : String(err),
              remediationSteps: ['Choose another FMB file'],
            })
          );
        }
      }
    },
    [oldFileInput, newFileInput]
  );

  /**
   * Executes the non-blocking 3-Way Merge pipeline with meaningful step-by-step progress.
   */
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
          title: 'Analyzing 3-way merge...',
          percent: 25,
          steps: [
            { label: 'Reading Base, Ours, and Theirs forms', state: 'active' },
            { label: 'Normalizing object hierarchies', state: 'pending' },
            { label: 'Evaluating 3-way merge rules', state: 'pending' },
            { label: 'Detecting property & PL/SQL conflicts', state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 100));
        const [rawBase, rawOurs, rawTheirs] = await Promise.all([
          FmbExtractor.extract(tBase),
          FmbExtractor.extract(tOurs),
          FmbExtractor.extract(tTheirs),
        ]);

        setProgress({
          title: 'Analyzing 3-way merge...',
          percent: 60,
          steps: [
            { label: 'Reading Base, Ours, and Theirs forms', state: 'done' },
            { label: 'Normalizing object hierarchies', state: 'active' },
            { label: 'Evaluating 3-way merge rules', state: 'pending' },
            { label: 'Detecting property & PL/SQL conflicts', state: 'pending' },
          ],
        });

        await new Promise((r) => setTimeout(r, 100));
        const normBase = FmbNormalizer.normalize(FmbParser.parse(rawBase));
        const normOurs = FmbNormalizer.normalize(FmbParser.parse(rawOurs));
        const normTheirs = FmbNormalizer.normalize(FmbParser.parse(rawTheirs));

        setProgress({
          title: 'Analyzing 3-way merge...',
          percent: 88,
          steps: [
            { label: 'Reading Base, Ours, and Theirs forms', state: 'done' },
            { label: 'Normalizing object hierarchies', state: 'done' },
            { label: 'Evaluating 3-way merge rules', state: 'done' },
            { label: 'Detecting property & PL/SQL conflicts', state: 'active' },
          ],
        });

        await new Promise((r) => setTimeout(r, 100));
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
    [baseFileInput, oursFileInput, theirsFileInput]
  );

  // Handle dropped or selected files
  const handleFilesSelected = (
    files: FileList | File[],
    slot: 'both' | 'old' | 'new' | 'base' | 'ours' | 'theirs' = 'both'
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate extensions immediately
    const invalidFile = fileArray.find(
      (f) => !FmbExtractor.isValidExtension(f.name)
    );
    if (invalidFile) {
      setActiveError(
        new FmbExtractionError({
          code: 'UNSUPPORTED_EXTENSION',
          fileName: invalidFile.name,
          message: 'This file is not supported. Please select an .fmb file.',
          technicalDetails: `Selected file "${invalidFile.name}" has an unsupported file extension. Only .fmb, .xml (Forms2XML), and .fmt files are accepted.`,
          remediationSteps: ['Please select an .fmb file.'],
        })
      );
      return;
    }

    if (mode === 'compare') {
      if (fileArray.length >= 2 && slot === 'both') {
        // Automatically assign both dropped files to OLD and NEW
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
      // Merge mode
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

  // Global keyboard shortcuts (Ctrl+O, Ctrl+Enter, Ctrl+R, Ctrl+S, Esc)
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
          const html = HtmlReportGenerator.generateComparisonReport(compareResult);
          triggerDownload('fmb_comparison_report.html', html);
          showToast('Saved fmb_comparison_report.html');
        } else if (mode === 'merge' && mergeResult) {
          e.preventDefault();
          const html = HtmlReportGenerator.generateMergeReport(mergeResult);
          triggerDownload('fmb_merge_report.html', html);
          showToast('Saved fmb_merge_report.html');
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

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  // Download sample .fmb files so the user can test real OS drag & drop from their desktop
  const handleDownloadSampleFmbBundle = () => {
    const v1Xml = FmbExtractor.serializeToOracleXml(getCustomerV1Fixture());
    const v2Xml = FmbExtractor.serializeToOracleXml(getCustomerV2Fixture());
    triggerDownload('customer_v1.fmb', v1Xml, 'application/octet-stream');
    setTimeout(() => {
      triggerDownload('customer_v2.fmb', v2Xml, 'application/octet-stream');
    }, 250);
    showToast('Downloaded customer_v1.fmb and customer_v2.fmb — drag & drop them onto the window!');
  };

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
      className={`min-h-screen flex flex-col transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Hidden native file input */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-8 pointer-events-none">
          <div className="w-full max-w-lg rounded-lg border-2 border-dashed border-blue-500 bg-slate-900/90 p-12 text-center">
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <div className="text-lg font-semibold text-white">
              Drop FMB files here
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'compare'
                ? 'Drop one or two .fmb files to assign to OLD and NEW automatically'
                : 'Drop .fmb files for 3-way merge analysis'}
            </p>
          </div>
        </div>
      )}

      {/* Top Bar Contract: 3 Zones (1: Single Brand Wordmark, 2: Nav Links, 3: Primary Actions) */}
      <header
        className={`h-13 px-6 border-b flex items-center justify-between shrink-0 select-none ${
          isDark
            ? 'border-slate-800/90 bg-slate-900/90'
            : 'border-slate-200 bg-white'
        }`}
      >
        {/* Zone 1: Brand Title (single text element) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setCompareResult(null);
            setMergeResult(null);
          }}
          className="text-sm font-bold tracking-tight whitespace-nowrap"
        >
          FMB Diff &amp; Merge
        </a>

        {/* Zone 2: 4 Clean Navigation Links */}
        <nav className="flex items-center gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('compare')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'compare'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => setMode('merge')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'merge'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Merge
          </button>
          <button
            type="button"
            onClick={() => setShowTestSuiteModal(true)}
            className={`py-1 border-b-2 border-transparent transition-colors whitespace-nowrap ${
              isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Engine Tests
          </button>
          <button
            type="button"
            onClick={() => setShowToolingModal(true)}
            className={`py-1 border-b-2 border-transparent transition-colors whitespace-nowrap ${
              isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oracle Tooling
          </button>
        </nav>

        {/* Zone 3: 2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadSampleFmbBundle}
            title="Download sample customer_v1.fmb and customer_v2.fmb files to test desktop drag & drop"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              isDark
                ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Sample .fmb Files
          </button>

          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label="Toggle color theme"
            className={`p-1.5 rounded border transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-800/60 text-slate-300 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Optional Toast Notification */}
      {inlineToast && (
        <div className="fixed bottom-4 right-4 z-40 px-4 py-2.5 rounded-md border border-blue-500/40 bg-slate-900 text-xs text-blue-200 shadow-lg">
          {inlineToast}
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-h-0">
        {progress ? (
          /* Meaningful Non-Blocking Progress State (Section 5) */
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className={`w-full max-w-md rounded-lg border p-6 ${
                isDark
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">{progress.title}</span>
                <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">
                  {progress.percent}%
                </span>
              </div>

              <div
                className={`w-full h-1.5 rounded-full overflow-hidden mb-5 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-blue-500 transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${progress.percent / 100})` }}
                />
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                {progress.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    {step.state === 'done' && (
                      <span className="text-emerald-400 font-bold">✓</span>
                    )}
                    {step.state === 'active' && (
                      <span className="text-blue-400 font-bold animate-pulse">
                        ●
                      </span>
                    )}
                    {step.state === 'pending' && (
                      <span className="text-slate-600">○</span>
                    )}
                    <span
                      className={
                        step.state === 'done'
                          ? isDark
                            ? 'text-slate-300'
                            : 'text-slate-700'
                          : step.state === 'active'
                          ? 'text-blue-400 font-semibold'
                          : 'text-slate-500'
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
          /* Compare Results Screen */
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
                title: `Comparison Report: ${compareResult.oldModel.metadata.fileName} → ${compareResult.newModel.metadata.fileName}`,
                html,
                fileName: 'fmb_comparison_report.html',
              });
            }}
            onExportHtmlReport={() => {
              const html =
                HtmlReportGenerator.generateComparisonReport(compareResult);
              triggerDownload('fmb_comparison_report.html', html);
              showToast('Exported fmb_comparison_report.html');
            }}
          />
        ) : mode === 'merge' && mergeResult ? (
          /* 3-Way Merge Results & Conflict Resolution Screen */
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
                title: `3-Way Merge Report: ${mergeResult.outputFileName}`,
                html,
                fileName: 'fmb_merge_report.html',
              });
            }}
            onExportMergeReport={() => {
              const html = HtmlReportGenerator.generateMergeReport(mergeResult);
              triggerDownload('fmb_merge_report.html', html);
              showToast('Exported fmb_merge_report.html');
            }}
            onResetFiles={() => setMergeResult(null)}
          />
        ) : (
          /* Main Application Experience (Home Dropzone & File Selection — Section 3 & 4) */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
              {/* Mode Switch Tabs matching Section 3 diagram */}
              <div className="flex items-center gap-8 border-b border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('compare')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    mode === 'compare'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  Compare
                </button>
                <button
                  type="button"
                  onClick={() => setMode('merge')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    mode === 'merge'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitMerge className="w-4 h-4" />
                  Merge
                </button>
              </div>

              {mode === 'compare' ? (
                /* COMPARE HOME */
                <div>
                  <h1 className="text-xl font-semibold tracking-tight mb-1">
                    Compare two FMB files
                  </h1>
                  <p className="text-xs text-slate-400 mb-6">
                    Understand exactly what changed across blocks, items, properties, triggers, and PL/SQL program units.
                  </p>

                  {/* Primary Dropzone */}
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
                    className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-slate-800 bg-slate-900/40 hover:border-blue-500/60 hover:bg-slate-900/70'
                        : 'border-slate-300 bg-white hover:border-blue-500'
                    }`}
                  >
                    <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2.5" />
                    <div className="text-sm font-medium mb-1">
                      Drop FMB files here
                    </div>
                    <div className="text-xs text-slate-500 mb-4">or</div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded border ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-200'
                          : 'border-slate-300 bg-slate-100 text-slate-800'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Select files
                    </span>
                  </div>

                  {/* Selected OLD and NEW File Slots (Section 4) */}
                  {oldFileInput && newFileInput ? (
                    <div
                      className={`mt-5 rounded-lg border p-4 ${
                        isDark
                          ? 'border-slate-800 bg-slate-900/60'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div
                          className={`p-3 rounded border flex items-center justify-between ${
                            isDark
                              ? 'border-slate-800 bg-slate-950/60'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-[11px] font-mono font-semibold text-slate-400">
                              OLD
                            </div>
                            <div className="font-mono text-xs font-semibold mt-0.5">
                              {oldFileInput.name}
                            </div>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              {formatSize(oldFileInput.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSlot('old');
                              fileInputRef.current?.click();
                            }}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Change
                          </button>
                        </div>

                        <div
                          className={`p-3 rounded border flex items-center justify-between ${
                            isDark
                              ? 'border-slate-800 bg-slate-950/60'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-[11px] font-mono font-semibold text-blue-400">
                              NEW
                            </div>
                            <div className="font-mono text-xs font-semibold mt-0.5">
                              {newFileInput.name}
                            </div>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              {formatSize(newFileInput.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSlot('new');
                              fileInputRef.current?.click();
                            }}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          ✓ Both FMB files validated and ready
                        </span>
                        <button
                          type="button"
                          onClick={() => runComparison()}
                          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Compare files
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center text-xs text-slate-500">
                      Select two FMB files to start a comparison.
                    </div>
                  )}

                  {/* Quick Developer Presets for testing all states */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">Quick test scenarios:</span>
                    <div className="flex flex-wrap items-center gap-3">
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
                        className="text-blue-400 hover:underline font-medium"
                      >
                        customer_v1 → customer_v2 (Standard Diff)
                      </button>
                      <span className="text-slate-700">·</span>
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
                        className="text-slate-400 hover:text-slate-200 hover:underline"
                      >
                        Identical FMBs (Empty Diff State)
                      </button>
                      <span className="text-slate-700">·</span>
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
                        className="text-slate-400 hover:text-slate-200 hover:underline"
                      >
                        Locked / Corrupted FMB Error
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* MERGE HOME (Section 11) */
                <div>
                  <h1 className="text-xl font-semibold tracking-tight mb-1">
                    3-Way Merge FMB versions
                  </h1>
                  <p className="text-xs text-slate-400 mb-6">
                    Safely combine changes from Ours and Theirs relative to a common Base ancestor with automatic conflict detection.
                  </p>

                  <div
                    className={`rounded-lg border p-5 ${
                      isDark
                        ? 'border-slate-800 bg-slate-900/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                      {/* BASE */}
                      <div
                        className={`p-3.5 rounded border ${
                          isDark
                            ? 'border-slate-800 bg-slate-950/60'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            BASE (Common Ancestor)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSlot('base');
                              fileInputRef.current?.click();
                            }}
                            className="text-[11px] text-blue-400 hover:underline"
                          >
                            Select
                          </button>
                        </div>
                        <div className="font-mono text-xs font-semibold truncate">
                          {baseFileInput?.name || 'Not selected'}
                        </div>
                        {baseFileInput && (
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {formatSize(baseFileInput.size)}
                          </div>
                        )}
                      </div>

                      {/* OURS */}
                      <div
                        className={`p-3.5 rounded border ${
                          isDark
                            ? 'border-blue-900/40 bg-blue-950/15'
                            : 'border-blue-200 bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[11px] font-bold text-blue-400">
                            OURS (Current Branch)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSlot('ours');
                              fileInputRef.current?.click();
                            }}
                            className="text-[11px] text-blue-400 hover:underline"
                          >
                            Select
                          </button>
                        </div>
                        <div className="font-mono text-xs font-semibold truncate">
                          {oursFileInput?.name || 'Not selected'}
                        </div>
                        {oursFileInput && (
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {formatSize(oursFileInput.size)}
                          </div>
                        )}
                      </div>

                      {/* THEIRS */}
                      <div
                        className={`p-3.5 rounded border ${
                          isDark
                            ? 'border-purple-900/40 bg-purple-950/15'
                            : 'border-purple-200 bg-purple-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[11px] font-bold text-purple-400">
                            THEIRS (Incoming Branch)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSlot('theirs');
                              fileInputRef.current?.click();
                            }}
                            className="text-[11px] text-blue-400 hover:underline"
                          >
                            Select
                          </button>
                        </div>
                        <div className="font-mono text-xs font-semibold truncate">
                          {theirsFileInput?.name || 'Not selected'}
                        </div>
                        {theirsFileInput && (
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {formatSize(theirsFileInput.size)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        ✓ Base, Ours, and Theirs modules ready for 3-way analysis
                      </span>
                      <button
                        type="button"
                        onClick={() => runMergeAnalysis()}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Analyze merge
                      </button>
                    </div>
                  </div>

                  {/* Quick Merge Test Scenarios */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">Quick merge scenarios:</span>
                    <div className="flex flex-wrap items-center gap-3">
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
                          const t: FmbFileInput = {
                            name: 'customer_theirs.fmb',
                            size: 2610400,
                            presetRole: 'theirs',
                          };
                          setBaseFileInput(b);
                          setOursFileInput(o);
                          setTheirsFileInput(t);
                          runMergeAnalysis(b, o, t);
                        }}
                        className="text-blue-400 hover:underline font-medium"
                      >
                        3-Way Merge with 4 Conflicts
                      </button>
                      <span className="text-slate-700">·</span>
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
                        className="text-slate-400 hover:text-slate-200 hover:underline"
                      >
                        Conflict-Free Auto Merge (0 Conflicts)
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                message: 'Oracle Forms tooling was not found.',
                technicalDetails:
                  'Spawn ENOENT: C:\\Oracle\\Middleware\\Oracle_Home\\...\\frmf2xml.bat not found on PATH or ORACLE_HOME.',
                remediationSteps: [
                  'Configure ORACLE_HOME path',
                  'Or supply pre-extracted *_fmb.xml files',
                ],
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
            showToast(`Saved ${reportPreview.fileName}`);
          }}
        />
      )}
    </div>
  );
}
