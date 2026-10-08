/**
 * Secure Electron File & Oracle Forms Tooling Service
 * Never executes FMB content, extracted PL/SQL, or Forms trigger code.
 * Invokes official Oracle Forms CLI utilities using strict argument arrays (never shell eval).
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
    return { ...this.config };
  }
}
