export const IPC_CHANNELS = {
  SELECT_FMB_FILES: 'fmb:select-files',
  ANALYZE_COMPARE: 'fmb:analyze-compare',
  ANALYZE_MERGE: 'fmb:analyze-merge',
  EXPORT_MERGED_FMB: 'fmb:export-merged-fmb',
  EXPORT_HTML_REPORT: 'fmb:export-html-report',
  GET_TOOLING_CONFIG: 'fmb:get-tooling-config',
  SET_TOOLING_CONFIG: 'fmb:set-tooling-config',
} as const;
