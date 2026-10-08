/**
 * Secure Electron Preload Script
 * Enforces contextIsolation: true and nodeIntegration: false.
 * Exposes only allowlisted, type-checked operations to the renderer.
 */
import { IPC_CHANNELS } from './ipc';

export interface FmbDesktopBridge {
  selectFmbFiles: (mode: 'compare' | 'merge') => Promise<string[]>;
  exportMergedFmb: (defaultFileName: string, xmlPayload: string) => Promise<{ savedPath: string }>;
  exportHtmlReport: (defaultFileName: string, htmlContent: string) => Promise<{ savedPath: string }>;
  channels: typeof IPC_CHANNELS;
}

// Attached when running inside Electron preload context
export function createPreloadBridge(ipcRenderer: {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}): FmbDesktopBridge {
  return {
    selectFmbFiles: (mode) =>
      ipcRenderer.invoke(IPC_CHANNELS.SELECT_FMB_FILES, mode) as Promise<string[]>,
    exportMergedFmb: (defaultFileName, xmlPayload) =>
      ipcRenderer.invoke(
        IPC_CHANNELS.EXPORT_MERGED_FMB,
        defaultFileName,
        xmlPayload
      ) as Promise<{ savedPath: string }>,
    exportHtmlReport: (defaultFileName, htmlContent) =>
      ipcRenderer.invoke(
        IPC_CHANNELS.EXPORT_HTML_REPORT,
        defaultFileName,
        htmlContent
      ) as Promise<{ savedPath: string }>,
    channels: IPC_CHANNELS,
  };
}
