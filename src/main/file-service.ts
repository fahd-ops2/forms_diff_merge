/**
 * Localhost HTTP File & Oracle Forms Tooling Service (Node.js + WebView2 Host)
 * Communicates with the local Node.js backend over 127.0.0.1 HTTP endpoints.
 * Never executes FMB content, extracted PL/SQL, or Forms trigger code.
 */

export interface OracleToolingConfig {
  oracleHome: string;
  frmf2xmlPath: string;
  frmxml2fPath: string;
  frmcmpBatchPath: string;
  detected: boolean;
  version: string;
}

export class FileService {
  private static config: OracleToolingConfig = {
    oracleHome: 'C:\\Oracle\\Middleware\\Oracle_Home',
    frmf2xmlPath: 'C:\\Oracle\\Middleware\\Oracle_Home\\user_projects\\domains\\base_domain\\config\\fmwconfig\\components\\FORMS\\instances\\forms1\\bin\\frmf2xml.bat',
    frmxml2fPath: 'C:\\Oracle\\Middleware\\Oracle_Home\\user_projects\\domains\\base_domain\\config\\fmwconfig\\components\\FORMS\\instances\\forms1\\bin\\frmxml2f.bat',
    frmcmpBatchPath: 'C:\\Oracle\\Middleware\\Oracle_Home\\bin\\frmcmp_batch.exe',
    detected: true,
    version: '12.2.1.4.0',
  };

  public static getToolingConfig(): OracleToolingConfig {
    return { ...this.config };
  }

  public static updateToolingConfig(partial: Partial<OracleToolingConfig>): OracleToolingConfig {
    this.config = { ...this.config, ...partial };
    // Synchronize asynchronously with local Node.js HTTP server
    void fetch('/api/tooling-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.config),
    }).catch(() => {
      // Offline / browser-only fallback keeps in-memory state
    });
    return { ...this.config };
  }

  public static async fetchToolingConfigFromServer(): Promise<OracleToolingConfig> {
    try {
      const res = await fetch('/api/tooling-config');
      if (res.ok) {
        const remote = (await res.json()) as OracleToolingConfig;
        this.config = { ...this.config, ...remote };
      }
    } catch {
      // Keep local config if server endpoint is unreachable
    }
    return { ...this.config };
  }
}
