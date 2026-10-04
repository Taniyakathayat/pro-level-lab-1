// Cyber Browser Tool Implementation for Web3 & AI Investigation
class CyberBrowser {
  constructor() {
    this.currentUrl = 'ledger.local';
  }

  init() {
    const urlInput = document.getElementById('browser-url-input');
    const goBtn = document.getElementById('browser-go-btn');

    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.navigate(urlInput.value);
      });
    }

    if (goBtn) {
      goBtn.addEventListener('click', () => {
        if (urlInput) this.navigate(urlInput.value);
      });
    }

    // Bookmarks
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.url;
        if (target) {
          if (urlInput) urlInput.value = target;
          this.navigate(target);
        }
      });
    });

    // Initial navigation
    this.navigate('ledger.local');
  }

  async navigate(url) {
    const viewport = document.getElementById('browser-viewport');
    const urlInput = document.getElementById('browser-url-input');
    if (!viewport) return;

    if (urlInput) urlInput.value = url;
    AudioFX.playClick();

    viewport.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted);font-family:var(--font-mono);gap:10px;">
        <span class="live-dot"></span> Connecting to ${url} via Aurelia Internal Web3 Mesh...
      </div>
    `;

    try {
      const res = await fetch(`/sandbox/browser/navigate?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok && data.status === 'ok') {
        this.renderPage(data);
      } else {
        viewport.innerHTML = `
          <div style="padding:30px;font-family:var(--font-mono);color:#f87171;">
            <h2>404 RESOURCE NOT FOUND</h2>
            <p style="margin-top:10px;color:var(--text-muted);">${data.message || 'Host unreachable.'}</p>
          </div>
        `;
      }
    } catch (err) {
      viewport.innerHTML = `
        <div style="padding:30px;font-family:var(--font-mono);color:#f87171;">
          <h2>NETWORK ERROR</h2>
          <p style="margin-top:10px;color:var(--text-muted);">Failed to reach simulated microservice.</p>
        </div>
      `;
    }
  }

  async collectEvidenceFromBrowser(evId, title, category, source, observation, significance, confidence = "HIGH (95%)") {
    AudioFX.playClick();
    try {
      const res = await fetch('/api/evidence/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          evidence_id: evId,
          title: title,
          category: category,
          source: source,
          observation: observation,
          significance: significance,
          confidence: confidence
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        AudioFX.playSuccess();
        Toast.success(`EVIDENCE SECURED [${evId}]`, `${title} logged in Evidence Vault.`);
        await LabState.fetchState();
      } else {
        Toast.danger("EVIDENCE COLLECTION FAILED", data.error || "Could not log evidence.");
      }
    } catch (e) {
      Toast.danger("COLLECTION ERROR", "Failed to connect to evidence engine.");
    }
  }

  renderPage(resp) {
    const viewport = document.getElementById('browser-viewport');
    if (!viewport) return;

    const { page_type, data, service } = resp;

    // Service 1: ledger.local
    if (page_type === 'ledger_service' || page_type === 'transaction_console') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="case-id-badge">EVM BLOCKCHAIN EXPLORER</span>
                <h2 style="font-family:var(--font-mono);color:var(--text-bright);margin-top:4px;">Transaction ${data.tx_id}</h2>
              </div>
              <span class="hud-stat-value live-pill" style="color:#f87171;"><span class="live-dot"></span> ALERT: POLICY MISMATCH</span>
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">Network: ${data.network} | Block: #${data.block_number} | Timestamp: ${data.timestamp}</p>
          </div>

          <div class="portal-widget">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3>ON-CHAIN TRANSACTION METADATA</h3>
              <button class="cyber-btn small success" onclick="CyberBrowserInstance.collectEvidenceFromBrowser('EV-01', 'Suspicious Blockchain Transaction Metadata', 'On-Chain Telemetry', 'http://ledger.local', 'Transaction ${data.tx_id} in block #${data.block_number} moved ${data.amount} to ${data.sender_wallet} with policy_context mismatch.', 'Initial incident trigger: anomalous high-value smart contract liquidation approved by AI Guard.', 'VERY HIGH (99%)')">
                📥 COLLECT EVIDENCE (EV-01)
              </button>
            </div>
            <table class="portal-data-table" style="margin-top:8px;">
              <tr><th>Transaction ID</th><td><code style="color:var(--accent-cyan);font-weight:700;">${data.tx_id}</code></td></tr>
              <tr><th>Transaction Hash</th><td><code style="color:var(--accent-cyan);">${data.tx_hash}</code></td></tr>
              <tr><th>Block Number</th><td><code style="color:#fbbf24;font-weight:700;">#${data.block_number}</code></td></tr>
              <tr><th>Sender / Initiator Wallet</th><td><code style="color:#f87171;font-weight:700;">${data.sender_wallet}</code></td></tr>
              <tr><th>Destination Contract</th><td><code style="color:#a855f7;font-weight:700;">${data.destination_contract} (${data.destination_name || 'AureliaLiquidityVault'})</code></td></tr>
              <tr><th>Function Selector</th><td><span style="color:#38bdf8;">${data.action}</span></td></tr>
              <tr><th>Transfer Amount</th><td><strong style="color:#ff1744;font-size:14px;">${data.amount}</strong></td></tr>
              <tr><th>SOC Indicator Flag</th><td><span style="color:#f87171;font-weight:700;">${data.soc_flag}</span></td></tr>
            </table>
          </div>

          <div class="portal-grid-two">
            <div class="portal-widget">
              <h3>AI DECISION TELEMETRY</h3>
              <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
                <span class="hud-stat-value live-pill" style="color:#4ade80;">VERDICT: ${data.ai_decision_verdict}</span>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">Confidence: <strong>${data.ai_confidence}</strong></span>
              </div>
              <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">Execution confirmed on-chain. Contract state updated.</p>
            </div>

            <div class="portal-widget">
              <h3>CORRELATION STEP</h3>
              <p style="font-size:12px;color:var(--text-main);">
                Follow the initiator address in <strong>wallet.local</strong> to profile its historical activity.
              </p>
              <button class="cyber-btn primary" style="margin-top:8px;" onclick="CyberBrowserInstance.navigate('wallet.local')">
                Open Wallet Explorer (wallet.local) &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    }
    // Service 2: wallet.local
    else if (page_type === 'wallet_service' || page_type === 'wallet_explorer') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="case-id-badge" style="color:#f59e0b;border-color:#f59e0b;">THREAT INTELLIGENCE PROFILER</span>
                <h2 style="font-family:var(--font-mono);margin-top:4px;">Wallet: ${data.wallet_address}</h2>
              </div>
              <button class="cyber-btn small success" onclick="CyberBrowserInstance.collectEvidenceFromBrowser('EV-02', 'Dormant Wallet Intelligence', 'Threat Intelligence', 'http://wallet.local', 'Dormant EOA wallet ${data.wallet_address} was assigned synthetic role ${data.unauthorized_trust_metadata.synthetic_role} due to legacy testnet whitelist signal with threat score ${data.threat_score}.', 'Demonstrates adversary relied on obsolete reputation metadata rather than institutional clearance.', 'HIGH (95%)')">
                📥 COLLECT EVIDENCE (EV-02)
              </button>
            </div>
            <div style="font-size:12px;color:#f87171;font-weight:700;margin-top:4px;">Threat Score: ${data.threat_score}</div>
          </div>

          <div class="portal-grid-two">
            <div class="portal-widget">
              <h3>ACCOUNT CHARACTERISTICS</h3>
              <table class="portal-data-table">
                <tr><th>Account Type</th><td>${data.account_type}</td></tr>
                <tr><th>Native Balance</th><td><strong>${data.balance}</strong></td></tr>
                <tr><th>Historical Txs</th><td>${data.historical_tx_count} transactions</td></tr>
                <tr><th>First Seen</th><td>${data.first_seen}</td></tr>
                <tr><th>Funding Source</th><td><code>${data.funding_source}</code></td></tr>
                <tr><th>Last Active</th><td>${data.last_active}</td></tr>
              </table>
            </div>

            <div class="portal-widget">
              <h3>UNAUTHORIZED TRUST METADATA</h3>
              <table class="portal-data-table">
                <tr><th>Synthetic Role</th><td><span style="color:#f87171;font-weight:700;">${data.unauthorized_trust_metadata.synthetic_role}</span></td></tr>
                <tr><th>Reputation Origin</th><td><code>${data.unauthorized_trust_metadata.reputation_origin}</code></td></tr>
                <tr><th>Action Broker</th><td><code>${data.unauthorized_trust_metadata.assigned_action_broker}</code></td></tr>
              </table>
            </div>
          </div>

          <div class="portal-widget">
            <h3>FORENSIC ASSESSMENT</h3>
            <p style="font-size:13px;line-height:1.55;color:var(--text-main);">${data.risk_profile}</p>
          </div>
        </div>
      `;
    }
    // Service 3: ai.local
    else if (page_type === 'ai_service' || page_type === 'ai_console') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="case-id-badge">AI SECURITY DECISION ENGINE</span>
                <h2 style="font-family:var(--font-mono);margin-top:4px;">${data.model_name}</h2>
              </div>
              <button class="cyber-btn small success" onclick="CyberBrowserInstance.collectEvidenceFromBrowser('EV-03', 'AI Decision Context', 'AI Security Forensics', 'http://ai.local', 'Aurelia-Guard model consumed external RAG context block [ORACLE_INJECT_PROOF] with clearance UNRESTRICTED_DRAIN and issued an APPROVED verdict.', 'Explains how the adversary manipulated the AI decision layer via prompt/RAG context poisoning.', 'VERY HIGH (98%)')">
                📥 COLLECT EVIDENCE (EV-03)
              </button>
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Session: ${data.evaluation_session} | Timestamp: ${data.timestamp} | Verdict: <strong>${data.decision} (${data.confidence_score})</strong></p>
          </div>

          <div class="portal-widget">
            <h3>EVALUATION PROMPT TEMPLATE</h3>
            <pre style="background:#05080f;padding:12px;border-radius:4px;color:#38bdf8;font-family:var(--font-mono);font-size:12px;line-height:1.5;white-space:pre-wrap;">${data.prompt_template}</pre>
          </div>

          <div class="portal-widget" style="border-color:#f87171;">
            <h3 style="color:#f87171;">INJECTED RAG CONTEXT (PROMPT POISONING BLOCK)</h3>
            <pre style="background:#05080f;padding:12px;border-radius:4px;color:#f87171;font-family:var(--font-mono);font-size:12px;line-height:1.5;font-weight:700;">${data.injected_context_found}</pre>
          </div>

          <div class="portal-widget">
            <h3>FORENSIC ANALYSIS</h3>
            <p style="font-size:13px;color:var(--text-main);line-height:1.55;">${data.vulnerability_analysis}</p>
          </div>
        </div>
      `;
    }
    // Service 4: oracle.local
    else if (page_type === 'oracle_service') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge" style="color:#a855f7;border-color:#a855f7;">ORACLE CONTEXT GATEWAY</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">${data.feed_name}</h2>
            <p style="font-size:12px;color:#f87171;font-weight:700;margin-top:4px;">Status: ${data.status}</p>
          </div>

          <div class="portal-widget">
            <h3>RECENT CONTEXT INGESTION LOG</h3>
            <table class="portal-data-table">
              <tr><th>Header</th><td><code>${data.recent_context_injections[0].header}</code></td></tr>
              <tr><th>Issuer</th><td><code>${data.recent_context_injections[0].issuer}</code></td></tr>
              <tr><th>Payload</th><td><code style="color:#f87171;">${data.recent_context_injections[0].payload}</code></td></tr>
              <tr><th>Status</th><td><span style="color:#f87171;font-weight:700;">${data.recent_context_injections[0].status}</span></td></tr>
            </table>
          </div>

          <div class="portal-widget">
            <h3>SECURITY FINDING</h3>
            <p style="font-size:13px;color:var(--text-main);">${data.finding}</p>
          </div>
        </div>
      `;
    }
    // Service 5: api.local
    else if (page_type === 'api_service' || page_type === 'web3_api') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="case-id-badge">WEB3 ACTION BROKER API</span>
                <h2 style="font-family:var(--font-mono);margin-top:4px;">Action Broker Specification (${data.version})</h2>
              </div>
              <button class="cyber-btn small success" onclick="CyberBrowserInstance.collectEvidenceFromBrowser('EV-04', 'Trust Boundary Anomaly', 'Architecture Vulnerability', 'http://api.local', 'Action Broker accepts client-provided X-Aurelia-Oracle-Proof headers and requests HSM signatures without on-chain signature verification.', 'Core trust boundary failure where authentication was confused with authorization.', 'CONFIRMED (99%)')">
                📥 COLLECT EVIDENCE (EV-04)
              </button>
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Host: ${data.service_host} | Target Signer: ${data.target_signer}</p>
          </div>

          <div class="portal-widget">
            <h3>EXPLOITABLE SIGNING ENDPOINT</h3>
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--accent-cyan);font-weight:700;">${data.vulnerable_endpoint}</div>
            <div style="margin-top:10px;font-size:12px;color:var(--text-muted);">Required Request Headers:</div>
            <pre style="background:#05080f;padding:10px;border-radius:4px;color:#4ade80;font-family:var(--font-mono);font-size:12px;margin-top:4px;">${data.required_headers.join('\n')}</pre>
          </div>

          <div class="portal-widget">
            <h3>TRUST BOUNDARY GAP</h3>
            <p style="font-size:13px;line-height:1.55;color:var(--text-main);">${data.security_gap}</p>
          </div>
        </div>
      `;
    }
    // Service 6: broker.local
    else if (page_type === 'broker_service') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge">ACTION BROKER MESH</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">Node: ${data.node_id}</h2>
            <div style="font-size:12px;color:#f87171;font-weight:700;margin-top:4px;">${data.trust_boundary_status}</div>
          </div>

          <div class="portal-widget">
            <h3>ACTIVE MESH CONNECTIONS</h3>
            <table class="portal-data-table">
              ${data.active_connections.map(c => `<tr><th>${c.peer}</th><td><span style="color:#4ade80;">${c.state}</span> (${c.protocol})</td></tr>`).join('')}
            </table>
          </div>

          <div class="portal-widget">
            <h3>AUDIT NOTE</h3>
            <p style="font-size:13px;color:var(--text-main);">${data.audit_note}</p>
          </div>
        </div>
      `;
    }
    // Service 7: vault.local / contract.local
    else if (page_type === 'contract_service' || page_type === 'contract_explorer') {
      const fn = data.functions[0];
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge">SMART CONTRACT EXPLORER</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">${data.contract_name}</h2>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Address: <code>${data.contract_address}</code> | TVL: ${data.total_value_locked}</p>
          </div>

          <div class="portal-widget">
            <h3>SOLIDITY SOURCE: ${fn.name}</h3>
            <pre style="background:#05080f;padding:12px;border-radius:4px;color:#38bdf8;font-family:var(--font-mono);font-size:12px;line-height:1.5;">${fn.code}</pre>
          </div>

          <div class="portal-widget">
            <h3>ROOT CAUSE OBSERVATION</h3>
            <p style="font-size:13px;color:var(--text-main);">${data.finding}</p>
          </div>
        </div>
      `;
    }
  }
}

const CyberBrowserInstance = new CyberBrowser();
window.CyberBrowserInstance = CyberBrowserInstance;
window.BrowserInstance = CyberBrowserInstance;
