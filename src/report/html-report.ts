import { FmbComparisonResult } from '../diff/diff-models';
import { ThreeWayMergeResult } from '../merge/merge-models';

const APP_VERSION = '1.4.0';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class HtmlReportGenerator {
  /**
   * Generates a standalone, offline HTML Comparison Report.
   */
  public static generateComparisonReport(result: FmbComparisonResult): string {
    const changedObjects = result.objectDiffs.filter(
      (o) => o.status !== 'UNCHANGED'
    );

    const objectRowsHtml = changedObjects
      .map((obj) => {
        const badgeColor =
          obj.status === 'ADDED'
            ? '#16a34a'
            : obj.status === 'REMOVED'
            ? '#dc2626'
            : '#d97706';
        const badgeSymbol =
          obj.status === 'ADDED' ? '+' : obj.status === 'REMOVED' ? '−' : '●';

        const changedProps = obj.propertyDiffs.filter(
          (p) => p.status !== 'UNCHANGED'
        );

        const propsHtml =
          changedProps.length > 0
            ? `<table class="prop-table">
                <thead>
                  <tr><th>Property</th><th>Old Value</th><th>New Value</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${changedProps
                    .map(
                      (p) => `<tr>
                        <td class="prop-name">${escapeHtml(p.label)}</td>
                        <td class="mono">${escapeHtml(p.oldFormatted)}</td>
                        <td class="mono">${escapeHtml(p.newFormatted)}</td>
                        <td>${escapeHtml(p.status)}</td>
                      </tr>`
                    )
                    .join('')}
                </tbody>
              </table>`
            : '';

        const sourceHtml =
          obj.sourceDiff && obj.sourceDiff.status !== 'UNCHANGED'
            ? `<div class="source-block">
                <div class="source-header">${escapeHtml(obj.sourceDiff.sourceType)} Source Diff · ${escapeHtml(obj.sourceDiff.summaryText)}</div>
                <div class="split-grid">
                  <pre class="code-pane old-pane"><strong>OLD</strong>\n${escapeHtml(obj.sourceDiff.oldSource || '(Empty)')}</pre>
                  <pre class="code-pane new-pane"><strong>NEW</strong>\n${escapeHtml(obj.sourceDiff.newSource || '(Empty)')}</pre>
                </div>
              </div>`
            : '';

        return `<div class="obj-card">
          <div class="obj-header">
            <div>
              <span class="obj-type">${escapeHtml(obj.type)}</span>
              <span class="obj-path">${escapeHtml(obj.displayPath)}</span>
            </div>
            <span class="status-label" style="color:${badgeColor}">${badgeSymbol} ${escapeHtml(obj.status)}</span>
          </div>
          <div class="obj-summary">${escapeHtml(obj.headlineSummary)}</div>
          ${propsHtml}
          ${sourceHtml}
        </div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FMB Comparison Report — ${escapeHtml(result.oldModel.metadata.fileName)} → ${escapeHtml(result.newModel.metadata.fileName)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 1120px; margin: 0 auto; }
    .header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 20px; margin: 0 0 6px 0; color: #f8fafc; letter-spacing: -0.01em; }
    .meta { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat-box { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 14px 16px; }
    .stat-num { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .obj-card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 16px; margin-bottom: 14px; }
    .obj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .obj-type { font-size: 11px; color: #94a3b8; margin-right: 8px; font-family: monospace; }
    .obj-path { font-weight: 600; font-size: 14px; color: #f8fafc; }
    .status-label { font-size: 12px; font-weight: 600; font-family: monospace; }
    .obj-summary { font-size: 13px; color: #cbd5e1; margin-bottom: 10px; }
    .prop-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    .prop-table th, .prop-table td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #334155; }
    .prop-table th { color: #94a3b8; font-weight: 500; font-size: 12px; }
    .mono { font-family: "JetBrains Mono", Consolas, monospace; font-size: 12px; }
    .source-block { margin-top: 12px; border-top: 1px solid #334155; padding-top: 10px; }
    .source-header { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
    .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .code-pane { background: #090d16; border: 1px solid #334155; border-radius: 4px; padding: 10px; font-size: 12px; overflow-x: auto; margin: 0; color: #e2e8f0; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>FMB COMPARISON REPORT</h1>
        <div class="meta">${escapeHtml(result.oldModel.metadata.fileName)} &rarr; ${escapeHtml(result.newModel.metadata.fileName)} · Module: ${escapeHtml(result.newModel.metadata.moduleName)}</div>
      </div>
      <div class="meta">
        <div>Generated: ${escapeHtml(new Date(result.comparedAt).toLocaleString())}</div>
        <div>FMB Diff &amp; Merge Checker v${APP_VERSION}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="stat-box"><div class="stat-num" style="color:#4ade80">+${result.summary.added}</div><div class="stat-label">Added</div></div>
      <div class="stat-box"><div class="stat-num" style="color:#f87171">&minus;${result.summary.removed}</div><div class="stat-label">Removed</div></div>
      <div class="stat-box"><div class="stat-num" style="color:#fbbf24">&#9679; ${result.summary.modified}</div><div class="stat-label">Modified</div></div>
      <div class="stat-box"><div class="stat-num" style="color:#94a3b8">&#10003; ${result.summary.unchanged}</div><div class="stat-label">Same / Unchanged</div></div>
    </div>

    ${objectRowsHtml || '<div class="obj-card">No structural or source differences found between the two FMB modules.</div>'}

    <div class="footer">
      <span>FMB Diff &amp; Merge Checker v${APP_VERSION} · Offline Report</span>
      <span>Checksum: ${escapeHtml(result.oldModel.metadata.checksum)} &rarr; ${escapeHtml(result.newModel.metadata.checksum)}</span>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates a standalone, offline HTML 3-Way Merge Report.
   */
  public static generateMergeReport(result: ThreeWayMergeResult): string {
    const conflictRows = result.conflicts
      .map(
        (c, idx) => `<div class="obj-card">
          <div class="obj-header">
            <div>
              <span class="obj-type">CONFLICT ${idx + 1} OF ${result.conflicts.length}</span>
              <span class="obj-path">${escapeHtml(c.displayPath)} &rarr; ${escapeHtml(c.propertyLabel)}</span>
            </div>
            <span class="status-label" style="color:${c.isResolved ? '#4ade80' : '#fbbf24'}">
              ${c.isResolved ? `✓ Resolved (${escapeHtml(c.resolvedChoice || '')})` : '⚠ Unresolved'}
            </span>
          </div>
          <table class="prop-table">
            <thead>
              <tr><th>BASE</th><th>OURS</th><th>THEIRS</th><th>RESOLVED OUTPUT</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="mono">${escapeHtml(c.baseFormatted)}</td>
                <td class="mono">${escapeHtml(c.oursFormatted)}</td>
                <td class="mono">${escapeHtml(c.theirsFormatted)}</td>
                <td class="mono" style="color:#4ade80;font-weight:600">${escapeHtml(c.resolvedFormatted || '(Pending)')}</td>
              </tr>
            </tbody>
          </table>
        </div>`
      )
      .join('\n');

    const autoRows = result.autoMergedDecisions
      .map(
        (d) => `<tr>
          <td>${escapeHtml(d.displayPath)}</td>
          <td>${escapeHtml(d.propertyLabel)}</td>
          <td>${escapeHtml(d.decisionType)}</td>
          <td class="mono">${escapeHtml(d.baseFormatted)}</td>
          <td class="mono">${escapeHtml(d.resolvedFormatted || '')}</td>
        </tr>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FMB Merge Report — ${escapeHtml(result.outputFileName)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 1120px; margin: 0 auto; }
    .header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 20px; margin: 0 0 6px 0; color: #f8fafc; }
    h2 { font-size: 15px; margin: 24px 0 12px 0; color: #cbd5e1; }
    .meta { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat-box { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 14px 16px; }
    .stat-num { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .obj-card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 16px; margin-bottom: 14px; }
    .obj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .obj-type { font-size: 11px; color: #94a3b8; margin-right: 8px; font-family: monospace; }
    .obj-path { font-weight: 600; font-size: 14px; color: #f8fafc; }
    .status-label { font-size: 12px; font-weight: 600; font-family: monospace; }
    .prop-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .prop-table th, .prop-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #334155; vertical-align: top; }
    .prop-table th { color: #94a3b8; font-weight: 500; font-size: 12px; }
    .mono { font-family: "JetBrains Mono", Consolas, monospace; font-size: 12px; white-space: pre-wrap; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>FMB MERGE REPORT</h1>
        <div class="meta">Base: ${escapeHtml(result.baseModel.metadata.fileName)} · Ours: ${escapeHtml(result.oursModel.metadata.fileName)} · Theirs: ${escapeHtml(result.theirsModel.metadata.fileName)}</div>
        <div class="meta">Output: ${escapeHtml(result.outputFileName)}</div>
      </div>
      <div class="meta">
        <div>Generated: ${escapeHtml(new Date(result.analyzedAt).toLocaleString())}</div>
        <div>FMB Diff &amp; Merge Checker v${APP_VERSION}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="stat-box"><div class="stat-num" style="color:#4ade80">&#10003; ${result.summary.autoMergedTotal}</div><div class="stat-label">Automatically Merged</div></div>
      <div class="stat-box"><div class="stat-num" style="color:#fbbf24">&#9888; ${result.summary.totalConflicts}</div><div class="stat-label">Total Conflicts</div></div>
      <div class="stat-box"><div class="stat-num" style="color:#60a5fa">${result.summary.resolvedConflicts}</div><div class="stat-label">Conflicts Resolved</div></div>
      <div class="stat-box"><div class="stat-num" style="color:${result.summary.remainingConflicts === 0 ? '#4ade80' : '#f87171'}">${result.summary.remainingConflicts}</div><div class="stat-label">Remaining Conflicts</div></div>
    </div>

    <h2>Conflict Resolutions (${result.conflicts.length})</h2>
    ${conflictRows || '<div class="obj-card">No conflicts detected.</div>'}

    <h2>Automatic Merge Decisions (${result.autoMergedDecisions.length})</h2>
    <div class="obj-card">
      <table class="prop-table">
        <thead>
          <tr><th>Object</th><th>Property / Source</th><th>Rule</th><th>Base</th><th>Merged Value</th></tr>
        </thead>
        <tbody>
          ${autoRows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>FMB Diff &amp; Merge Checker v${APP_VERSION} · Offline 3-Way Merge Report</span>
      <span>Target: ${escapeHtml(result.outputFileName)}</span>
    </div>
  </div>
</body>
</html>`;
  }
}
