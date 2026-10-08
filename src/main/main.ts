/**
 * Electron Main Process Entry Point
 * Security Architecture:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - sandbox: true
 * - Never executes PL/SQL or Forms trigger code
 */
import { FileService } from './file-service';
import { IPC_CHANNELS } from './ipc';

export const ELECTRON_SECURITY_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
} as const;

export function getDesktopMainMetadata() {
  return {
    appName: 'FMB Diff & Merge Checker',
    version: '1.4.0',
    security: ELECTRON_SECURITY_PREFERENCES,
    channels: IPC_CHANNELS,
    tooling: FileService.getToolingConfig(),
  };
}
