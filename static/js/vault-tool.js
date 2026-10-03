// Evidence Vault Tool Implementation
class EvidenceVault {
  init() {
    LabState.subscribe((state) => this.renderEvidence(state.evidence || []));
  }

  renderEvidence(evidenceList) {
    const grid = document.getElementById('vault-evidence-grid');
    const countBadge = document.getElementById('vault-total-count');
    if (!grid) return;

    if (countBadge) countBadge.textContent = `${evidenceList.length} ARTIFACTS`;

    if (evidenceList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-family:var(--font-mono);">
          <div style="font-size:24px;margin-bottom:8px;">🔒</div>
          No forensic evidence registered yet. Inspect SOC logs, architecture nodes, and execute requests to uncover artifacts.
        </div>
      `;
      return;
    }

    grid.innerHTML = evidenceList.map(ev => `
      <div class="evidence-card">
        <div class="evidence-card-header">
          <span class="ev-id-badge">${ev.evidence_id}</span>
          <span class="ev-category-pill">${ev.category}</span>
        </div>
        <div class="ev-title">${ev.title}</div>
        <div class="ev-field"><strong>SOURCE:</strong> ${ev.source}</div>
        <div class="ev-field"><strong>OBSERVATION:</strong> ${ev.observation}</div>
        <div class="ev-field" style="color:#38bdf8;"><strong>SIGNIFICANCE:</strong> ${ev.significance}</div>
      </div>
    `).join('');
  }
}

const EvidenceVaultInstance = new EvidenceVault();
