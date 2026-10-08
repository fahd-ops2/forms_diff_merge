import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Settings,
  X,
} from 'lucide-react';
import { FmbExtractionError } from '../fmb/models/fmb-models';
import { FileService, OracleToolingConfig } from '../main/file-service';
import { runAllEngineTests } from '../tests/engine-tests';

interface ErrorModalProps {
  error: FmbExtractionError;
  isDark: boolean;
  onClose: () => void;
  onRetry: () => void;
  onOpenToolingConfig: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  error,
  isDark,
  onClose,
  onRetry,
  onOpenToolingConfig,
}) => {
  const [showTechDetails, setShowTechDetails] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div
        className={`w-full max-w-lg rounded-lg border p-6 shadow-xl ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-base font-semibold">{error.message}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-400 space-y-2 mb-4">
          {error.code === 'MISSING_ORACLE_TOOLING' ? (
            <>
              <p>
                The application requires <span className="font-mono text-slate-200">frmf2xml</span>{' '}
                (Oracle Forms2XML) to extract binary FMB structures directly.
              </p>
              <p className="font-mono text-[11px]">
                Expected location: C:\Oracle\Middleware\Oracle_Home\...\frmf2xml.bat
              </p>
            </>
          ) : (
            <>
              <p>
                File: <span className="font-mono font-semibold text-slate-300">{error.fileName}</span>
              </p>
              <p>The file may be:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>unavailable or moved from disk</li>
                <li>locked by another application (such as Oracle Forms Builder)</li>
                <li>corrupted or truncated</li>
                <li>incompatible with the configured Oracle Forms tooling</li>
              </ul>
            </>
          )}
        </div>

        {/* Progressive disclosure Technical Details for developers */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowTechDetails((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            {showTechDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Technical details
          </button>

          {showTechDetails && (
            <div
              className={`mt-2 p-3 rounded border font-mono text-[11px] space-y-1.5 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>Code: {error.code}</div>
              <div>Diagnostic: {error.technicalDetails}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenToolingConfig}
            className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            Configure Tooling
          </button>
          <button
            type="button"
            onClick={onRetry}
            className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Choose another file
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToolingModalProps {
  isDark: boolean;
  onClose: () => void;
  onSimulateMissingToolingError: () => void;
}

export const ToolingConfigModal: React.FC<ToolingModalProps> = ({
  isDark,
  onClose,
  onSimulateMissingToolingError,
}) => {
  const [config, setConfig] = useState<OracleToolingConfig>(() =>
    FileService.getToolingConfig()
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    FileService.updateToolingConfig(config);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div
        className={`w-full max-w-xl rounded-lg border p-6 shadow-xl ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold">
              Oracle Forms Tooling Configuration
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-400 mb-1">
              ORACLE_HOME Directory
            </label>
            <input
              type="text"
              value={config.oracleHome}
              onChange={(e) =>
                setConfig({ ...config, oracleHome: e.target.value })
              }
              className={`w-full px-3 py-1.5 font-mono rounded border outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-400 mb-1">
              Forms2XML Extractor (<span className="font-mono">frmf2xml.bat</span>)
            </label>
            <input
              type="text"
              value={config.frmf2xmlPath}
              onChange={(e) =>
                setConfig({ ...config, frmf2xmlPath: e.target.value })
              }
              className={`w-full px-3 py-1.5 font-mono rounded border outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-400 mb-1">
              XML2Forms Reconstructor (<span className="font-mono">frmxml2f.bat</span>)
            </label>
            <input
              type="text"
              value={config.frmxml2fPath}
              onChange={(e) =>
                setConfig({ ...config, frmxml2fPath: e.target.value })
              }
              className={`w-full px-3 py-1.5 font-mono rounded border outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-400 mb-1">
              Batch Compiler &amp; Validator (<span className="font-mono">frmcmp_batch.exe</span>)
            </label>
            <input
              type="text"
              value={config.frmcmpBatchPath}
              onChange={(e) =>
                setConfig({ ...config, frmcmpBatchPath: e.target.value })
              }
              className={`w-full px-3 py-1.5 font-mono rounded border outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSimulateMissingToolingError}
            className="text-xs text-amber-400 hover:underline"
          >
            Test &ldquo;Missing Oracle Tooling&rdquo; diagnostic dialog
          </button>

          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-medium">
                ✓ Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TestSuiteModalProps {
  isDark: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isDark,
  onClose,
}) => {
  const testResults = runAllEngineTests();
  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div
        className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-lg border shadow-xl ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold">
              Diff &amp; 3-Way Merge Engine Automated Test Suite
            </h2>
            <p className="text-xs text-slate-400 tabular-nums">
              {passedCount} of {testResults.length} specification assertions passed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded border text-xs ${
                isDark
                  ? 'border-slate-800 bg-slate-950/60'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-mono font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t.id}</span>
                  <span className="font-sans font-normal text-slate-400">
                    — {t.name}
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">
                  PASS
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 mb-1">
                Input: {t.scenario}
              </div>
              <div className="font-mono text-[11px] text-slate-300">
                Expected: {t.expected} · Actual: {t.actual}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface HtmlReportPreviewModalProps {
  title: string;
  htmlContent: string;
  defaultFileName: string;
  isDark: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const HtmlReportPreviewModal: React.FC<HtmlReportPreviewModalProps> = ({
  title,
  htmlContent,
  defaultFileName,
  isDark,
  onClose,
  onDownload,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-5xl h-[85vh] flex flex-col rounded-lg border shadow-xl overflow-hidden ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-slate-400 font-mono">{defaultFileName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              <Download className="w-3.5 h-3.5" />
              Save HTML Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <iframe
          title="FMB Offline HTML Report Preview"
          srcDoc={htmlContent}
          className="flex-1 w-full bg-slate-950 border-0"
        />
      </div>
    </div>
  );
};
