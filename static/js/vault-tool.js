// Evidence Vault Tool Implementation
class EvidenceVault {
  init() {
    LabState.subscribe((state) => this.renderEvidence(state.evidence || []));
  }

  renderEvidence(evidenceList) {
    const grid = document.getElementById('vault-evidence-grid');
    const countBadge = document.getElementById('vault-total-count');
    if (!grid) return;

    if (countBadge) countBadge.textContent = `${evidenceList.length} / 5 ARTIFACTS`;

    if (evidenceList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-family:var(--font-mono);">
          <div style="font-size:24px;margin-bottom:8px;">🔒</div>
          No forensic evidence registered yet. Investigate services via Cyber Browser, Terminal, or Composer to collect artifacts.
        </div>
      `;
      return;
    }

    grid.innerHTML = evidenceList.map(ev => `
      <div class="evidence-card" style="background:rgba(15,23,42,0.85);border:1px solid rgba(0,240,255,0.3);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:6px;">
        <div class="evidence-card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <span class="ev-id-badge" style="background:rgba(0,240,255,0.15);color:var(--accent-cyan);padding:2px 8px;border-radius:4px;font-family:var(--font-mono);font-size:11px;font-weight:700;">${ev.evidence_id}</span>
          <span class="ev-category-pill" style="background:rgba(168,85,247,0.15);color:#c084fc;padding:2px 8px;border-radius:4px;font-family:var(--font-mono);font-size:10px;">${ev.category || 'Forensics'}</span>
        </div>
        <div class="ev-title" style="font-weight:700;color:var(--text-bright);font-size:13px;">${ev.title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;font-family:var(--font-mono);color:var(--text-muted);">
          <div><strong style="color:var(--text-secondary);">SOURCE:</strong> ${ev.source || 'ledger.local'}</div>
          <div><strong style="color:var(--text-secondary);">TIMESTAMP:</strong> ${ev.timestamp || '2026-10-03 02:13:07 UTC'}</div>
          <div><strong style="color:var(--text-secondary);">CONFIDENCE:</strong> <span style="color:#4ade80;">${ev.confidence || '99.4%'}</span></div>
          <div><strong style="color:var(--text-secondary);">CORRELATION:</strong> <span style="color:#38bdf8;">Chain Trace</span></div>
        </div>
        <div class="ev-field" style="font-size:11px;color:var(--text-main);background:rgba(0,0,0,0.3);padding:6px;border-radius:4px;margin-top:4px;">
          <strong style="color:var(--accent-cyan);font-family:var(--font-mono);font-size:10px;">DESCRIPTION:</strong><br>
          ${ev.observation}
        </div>
        <div class="ev-field" style="font-size:11px;color:#38bdf8;background:rgba(56,189,248,0.06);border-left:2px solid #38bdf8;padding:6px;border-radius:0 4px 4px 0;">
          <strong style="font-family:var(--font-mono);font-size:10px;">CORRELATION / SIGNIFICANCE:</strong><br>
          ${ev.significance}
        </div>
      </div>
    `).join('');
  }
}

const EvidenceVaultInstance = new EvidenceVault();
