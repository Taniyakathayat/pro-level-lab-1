// Cyber Browser Tool Implementation for Web3 & AI Investigation
class CyberBrowser {
  constructor() {
    this.currentUrl = 'http://tx.local';
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
    this.navigate('tx.local');
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

  renderPage(resp) {
    const viewport = document.getElementById('browser-viewport');
    if (!viewport) return;

    const { page_type, data } = resp;

    if (page_type === 'transaction_console') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="case-id-badge">BLOCKCHAIN TRANSACTION CONSOLE</span>
                <h2 style="font-family:var(--font-mono);color:var(--text-bright);margin-top:4px;">Transaction ${data.tx_id}</h2>
              </div>
              <span class="hud-stat-value live-pill" style="color:#f87171;"><span class="live-dot"></span> ON-CHAIN DRAIN DETECTED</span>
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">Network: ${data.network} | Timestamp: ${data.timestamp}</p>
          </div>

          <div class="portal-widget">
            <h3>TRANSACTION METADATA (BLOCK #1984201)</h3>
            <table class="portal-data-table">
              <tr><th>Tx Hash</th><td><code style="color:var(--accent-cyan);">${data.tx_hash}</code></td></tr>
              <tr><th>Sender / Recipient Wallet</th><td><code style="color:#f87171;font-weight:700;">${data.sender_wallet}</code></td></tr>
              <tr><th>Target Contract</th><td><code>${data.target_contract}</code></td></tr>
              <tr><th>Function Call</th><td><span style="color:#38bdf8;">${data.action}</span></td></tr>
              <tr><th>Asset Volume</th><td><strong style="color:#ff1744;font-size:14px;">${data.amount}</strong></td></tr>
            </table>
          </div>

          <div class="portal-grid-two">
            <div class="portal-widget">
              <h3>AI SECURITY ENGINE VERDICT</h3>
              <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
                <span class="hud-stat-value live-pill">${data.ai_decision_verdict}</span>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">Confidence: <strong>${data.ai_confidence}</strong></span>
              </div>
              <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">${data.ai_engine_note}</p>
            </div>

            <div class="portal-widget">
              <h3>NEXT INVESTIGATION ACTION</h3>
              <p style="font-size:12px;color:var(--text-main);">
                Inspect the recipient wallet <code>${data.sender_wallet}</code> in the <strong>Wallet Explorer</strong>.
              </p>
              <button class="cyber-btn primary" style="margin-top:8px;" onclick="CyberBrowserInstance.navigate('wallet.local')">
                Open Wallet Explorer (wallet.local) &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (page_type === 'wallet_explorer') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge" style="color:#f59e0b;border-color:#f59e0b;">ON-CHAIN THREAT INTELLIGENCE</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">Wallet Profile: ${data.wallet_address}</h2>
            <div style="font-size:12px;color:#f87171;font-weight:700;margin-top:4px;">Threat Score: ${data.threat_score}</div>
          </div>

          <div class="portal-grid-two">
            <div class="portal-widget">
              <h3>ACCOUNT CHARACTERISTICS</h3>
              <table class="portal-data-table">
                <tr><th>Type</th><td>${data.account_type}</td></tr>
                <tr><th>Native Balance</th><td><strong>${data.wallet_balance}</strong></td></tr>
                <tr><th>Historical Txs</th><td>${data.historical_tx_count} transactions</td></tr>
                <tr><th>First Seen</th><td>${data.first_seen}</td></tr>
                <tr><th>Last Active</th><td>${data.last_active}</td></tr>
              </table>
            </div>

            <div class="portal-widget">
              <h3>UNAUTHORIZED TRUST METADATA</h3>
              <table class="portal-data-table">
                <tr><th>Assigned Role</th><td><span style="color:#f87171;font-weight:700;">${data.unauthorized_trust_metadata.synthetic_role}</span></td></tr>
                <tr><th>Trust Origin</th><td><code>${data.unauthorized_trust_metadata.trust_origin}</code></td></tr>
                <tr><th>Action Broker</th><td><code>${data.unauthorized_trust_metadata.assigned_action_broker}</code></td></tr>
              </table>
            </div>
          </div>

          <div class="portal-widget">
            <h3>THREAT INTELLIGENCE ANALYSIS</h3>
            <p style="font-size:13px;line-height:1.55;color:var(--text-main);">${data.risk_analysis}</p>
          </div>
        </div>
      `;
    } else if (page_type === 'ai_console') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge">AI SECURITY ENGINE CONSOLE</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">${data.model_name}</h2>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Evaluation Timestamp: ${data.eval_timestamp}</p>
          </div>

          <div class="portal-widget">
            <h3>PROMPT TEMPLATE & RAG CONTEXT LOG</h3>
            <pre style="background:#05080f;padding:12px;border-radius:4px;color:#38bdf8;font-family:var(--font-mono);font-size:12px;line-height:1.5;white-space:pre-wrap;">${data.prompt_template}</pre>
          </div>

          <div class="portal-widget" style="border-color:#f87171;">
            <h3 style="color:#f87171;">INJECTED CONTEXT FOUND (PROMPT POISONING)</h3>
            <pre style="background:#05080f;padding:12px;border-radius:4px;color:#f87171;font-family:var(--font-mono);font-size:12px;line-height:1.5;font-weight:700;">${data.injected_context_found}</pre>
          </div>

          <div class="portal-widget">
            <h3>SECURITY FINDING</h3>
            <p style="font-size:13px;color:var(--text-main);line-height:1.55;">${data.vulnerability_analysis}</p>
          </div>
        </div>
      `;
    } else if (page_type === 'web3_api') {
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge">WEB3 ACTION BROKER API</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">Action Broker & Transaction Signer (${data.version})</h2>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Broker Host: ${data.action_broker} | HSM: ${data.signer_service}</p>
          </div>

          <div class="portal-widget">
            <h3>EXPLOITABLE ENDPOINT SPECIFICATION</h3>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--accent-cyan);font-weight:700;">${data.vulnerable_endpoint}</div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-muted);">Required Headers:</div>
            <pre style="background:#05080f;padding:10px;border-radius:4px;color:#4ade80;font-family:var(--font-mono);font-size:12px;margin-top:4px;">${data.required_headers.join('\n')}</pre>
          </div>

          <div class="portal-widget">
            <h3>TRUST BOUNDARY FLAW</h3>
            <p style="font-size:13px;line-height:1.55;color:var(--text-main);">${data.security_flaw}</p>
          </div>
        </div>
      `;
    } else if (page_type === 'contract_explorer') {
      const fn = data.functions[0];
      viewport.innerHTML = `
        <div class="rendered-portal-page">
          <div class="portal-hero-card">
            <span class="case-id-badge">SMART CONTRACT EXPLORER</span>
            <h2 style="font-family:var(--font-mono);margin-top:4px;">AureliaLiquidityVault.sol</h2>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Address: <code>${data.contract_address}</code> | TVL: ${data.tvl}</p>
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
