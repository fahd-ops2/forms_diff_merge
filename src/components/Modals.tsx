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
import { useI18n } from '../i18n/translations';
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
  const { t } = useI18n();
  const [showTechDetails, setShowTechDetails] = useState(false);

  const headline =
    error.code === 'MISSING_ORACLE_TOOLING'
      ? t.modals.errorMissingToolingTitle
      : error.code === 'UNSUPPORTED_EXTENSION'
      ? t.modals.errorFileUnsupported
      : t.modals.errorDefaultTitle;

  const btnClass = isDark
    ? 'border-[#34363d] bg-[#25272c] text-zinc-200 hover:bg-[#2f3138]'
    : 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-lg border p-5 shadow-2xl ${
          isDark
            ? 'border-[#34363d] bg-[#18191c] text-zinc-100'
            : 'border-zinc-300 bg-white text-zinc-900'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <h2 className="text-sm font-semibold">{headline}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-400 space-y-2 mb-4">
          {error.code === 'MISSING_ORACLE_TOOLING' ? (
            <>
              <p>
                <span className="font-mono text-zinc-200">frmf2xml</span>{' '}
                (Oracle Forms2XML)
              </p>
              <p dir="ltr" className="font-mono text-[11px]">
                C:\Oracle\Middleware\Oracle_Home\...\frmf2xml.bat
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="font-mono font-semibold text-zinc-300">
                  {error.fileName}
                </span>
              </p>
              <p>{t.modals.fileMayBe}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t.modals.reasonUnavailable}</li>
                <li>{t.modals.reasonLocked}</li>
                <li>{t.modals.reasonCorrupted}</li>
                <li>{t.modals.reasonIncompatible}</li>
              </ul>
            </>
          )}
        </div>

        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowTechDetails((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200"
          >
            {showTechDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            {t.modals.technicalDetails}
          </button>

          {showTechDetails && (
            <div
              dir="ltr"
              className={`mt-2 p-2.5 border font-mono text-[11px] space-y-1 ${
                isDark
                  ? 'bg-[#121316] border-[#2e3036] text-zinc-300'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-700'
              }`}
            >
              <div>Code: {error.code}</div>
              <div>Detail: {error.technicalDetails}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenToolingConfig}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${btnClass}`}
          >
            {t.modals.configureToolingBtn}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${btnClass}`}
          >
            {t.modals.tryAgainBtn}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
              isDark
                ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {t.modals.chooseAnotherFileBtn}
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
  const { t } = useI18n();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-xl border p-5 shadow-2xl ${
          isDark
            ? 'border-[#34363d] bg-[#18191c] text-zinc-100'
            : 'border-zinc-300 bg-white text-zinc-900'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 mb-4 border-b ${
            isDark ? 'border-[#2e3036]' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold">{t.modals.toolingTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-400 mb-1">
              {t.modals.oracleHomeLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={config.oracleHome}
              onChange={(e) =>
                setConfig({ ...config, oracleHome: e.target.value })
              }
              className={`w-full px-2.5 py-1.5 font-mono border outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#34363d] text-zinc-200'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-400 mb-1">
              {t.modals.frmf2xmlLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={config.frmf2xmlPath}
              onChange={(e) =>
                setConfig({ ...config, frmf2xmlPath: e.target.value })
              }
              className={`w-full px-2.5 py-1.5 font-mono border outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#34363d] text-zinc-200'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-400 mb-1">
              {t.modals.frmxml2fLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={config.frmxml2fPath}
              onChange={(e) =>
                setConfig({ ...config, frmxml2fPath: e.target.value })
              }
              className={`w-full px-2.5 py-1.5 font-mono border outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#34363d] text-zinc-200'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-400 mb-1">
              {t.modals.frmcmpLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={config.frmcmpBatchPath}
              onChange={(e) =>
                setConfig({ ...config, frmcmpBatchPath: e.target.value })
              }
              className={`w-full px-2.5 py-1.5 font-mono border outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#34363d] text-zinc-200'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            />
          </div>
        </div>

        <div
          className={`mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
            isDark ? 'border-[#2e3036]' : 'border-zinc-200'
          }`}
        >
          <button
            type="button"
            onClick={onSimulateMissingToolingError}
            className="text-xs text-amber-400 underline"
          >
            {t.modals.testMissingToolingLink}
          </button>

          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-mono">
                ✓ {t.modals.savedNotice}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              {t.modals.closeBtn}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-3.5 py-1.5 text-xs font-semibold border ${
                isDark
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {t.modals.saveConfigBtn}
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
  const { t } = useI18n();
  const testResults = runAllEngineTests();
  const passedCount = testResults.filter((tr) => tr.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-3xl max-h-[85vh] flex flex-col border shadow-2xl ${
          isDark
            ? 'border-[#34363d] bg-[#18191c] text-zinc-100'
            : 'border-zinc-300 bg-white text-zinc-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-5 py-3 border-b ${
            isDark ? 'border-[#2e3036]' : 'border-zinc-200'
          }`}
        >
          <div>
            <h2 className="text-sm font-semibold">{t.modals.testSuiteTitle}</h2>
            <p className="text-xs text-zinc-400 font-mono tabular-nums">
              {passedCount}/{testResults.length} {t.modals.testSuiteSub}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2.5" dir="ltr">
          {testResults.map((tr) => (
            <div
              key={tr.id}
              className={`p-3 border text-xs ${
                isDark
                  ? 'border-[#2e3036] bg-[#121316]'
                  : 'border-zinc-300 bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tr.id}</span>
                  <span className="font-sans font-normal text-zinc-400">
                    — {tr.name}
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">
                  PASS
                </span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400 mb-0.5">
                Input: {tr.scenario}
              </div>
              <div className="font-mono text-[11px] text-zinc-300">
                Expected: {tr.expected} · Actual: {tr.actual}
              </div>
            </div>
          ))}
        </div>

        <div
          className={`px-5 py-2.5 border-t flex justify-end ${
            isDark ? 'border-[#2e3036]' : 'border-zinc-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1 text-xs font-semibold border ${
              isDark
                ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {t.modals.closeBtn}
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
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        className={`w-full max-w-5xl h-[85vh] flex flex-col border shadow-2xl overflow-hidden ${
          isDark
            ? 'border-[#34363d] bg-[#18191c] text-zinc-100'
            : 'border-zinc-300 bg-white text-zinc-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b ${
            isDark ? 'border-[#2e3036]' : 'border-zinc-200'
          }`}
        >
          <div>
            <h2 className="text-xs font-semibold">{title}</h2>
            <p className="text-[11px] text-zinc-400 font-mono">
              {defaultFileName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border ${
                isDark
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {t.modals.saveHtmlReportBtn}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <iframe
          title="FMB Offline HTML Report Preview"
          srcDoc={htmlContent}
          className="flex-1 w-full bg-[#0f172a] border-0"
        />
      </div>
    </div>
  );
};
