// Request Composer Tool Implementation for Web3 & AI Investigation
class RequestComposer {
  constructor() {
    this.defaultHeaders = `Host: api.local
Authorization: Bearer aurelia_tok_svc_mon_99182a
User-Agent: Aurelia-Web3-Investigator/2.0
Content-Type: application/json`;
  }

  init() {
    const sendBtn = document.getElementById('composer-send-btn');
    const saveBtn = document.getElementById('composer-save-btn');
    const clearBtn = document.getElementById('composer-clear-btn');
    const headersInput = document.getElementById('composer-headers-input');
    const paramsInput = document.getElementById('composer-params-input');
    const bodyInput = document.getElementById('composer-body-input');
    const urlInput = document.getElementById('composer-url-input');

    if (headersInput && !headersInput.value) {
      headersInput.value = this.defaultHeaders;
    }

    if (urlInput && !urlInput.value) {
      urlInput.value = 'http://api.local/api/v2/action-broker/sign-tx';
    }

    if (bodyInput && !bodyInput.value) {
      bodyInput.value = JSON.stringify({
        transaction_id: "TX-NX047-0213",
        recipient: "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
        amount: 5000000
      }, null, 2);
    }

    // Subtabs: headers / params / body
    document.querySelectorAll('.composer-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioFX.playClick();
        const tab = btn.dataset.subtab;
        document.querySelectorAll('.composer-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const headersView = document.getElementById('composer-subtab-headers-view');
        const paramsView = document.getElementById('composer-subtab-params-view');
        const bodyView = document.getElementById('composer-subtab-body-view');

        if (headersView) headersView.style.display = tab === 'headers' ? 'block' : 'none';
        if (paramsView) paramsView.style.display = tab === 'params' ? 'block' : 'none';
        if (bodyView) bodyView.style.display = tab === 'body' ? 'block' : 'none';
      });
    });

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendRequest());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        AudioFX.playClick();
        Toast.success("REQUEST SAVED", "Current request configuration saved to investigation profile.");
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        AudioFX.playClick();
        if (urlInput) urlInput.value = '';
        if (headersInput) headersInput.value = '';
        if (paramsInput) paramsInput.value = '';
        if (bodyInput) bodyInput.value = '';
        const respBox = document.getElementById('composer-response-box');
        const statusPill = document.getElementById('composer-status-pill');
        if (respBox) respBox.textContent = '// Ready to compose request...';
        if (statusPill) {
          statusPill.textContent = 'CLEARED';
          statusPill.style.color = 'var(--text-muted)';
        }
        Toast.info("COMPOSER CLEARED", "All fields reset.");
      });
    }
  }

  parseHeaders(text) {
    const headers = {};
    if (!text) return headers;
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim();
        headers[key] = val;
      }
    });
    return headers;
  }

  parseParams(text) {
    const params = {};
    if (!text) return params;
    text.split('\n').forEach(line => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim();
        params[key] = val;
      }
    });
    return params;
  }

  async sendRequest() {
    const methodSelect = document.getElementById('composer-method-select');
    const urlInput = document.getElementById('composer-url-input');
    const headersInput = document.getElementById('composer-headers-input');
    const paramsInput = document.getElementById('composer-params-input');
    const bodyInput = document.getElementById('composer-body-input');
    const respBox = document.getElementById('composer-response-box');
    const statusPill = document.getElementById('composer-status-pill');

    if (!urlInput || !respBox) return;

    const method = methodSelect ? methodSelect.value : 'POST';
    let url = urlInput.value.trim();
    const headers = this.parseHeaders(headersInput ? headersInput.value : '');
    const params = this.parseParams(paramsInput ? paramsInput.value : '');
    const body = bodyInput ? bodyInput.value.trim() : '';

    if (!url) {
      Toast.warning("MISSING URL", "Please enter target endpoint (e.g. http://api.local/api/v2/action-broker/sign-tx)");
      return;
    }

    // Append query params if any
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    AudioFX.playClick();
    respBox.textContent = `Dispatching ${method} request to ${url}...`;
    if (statusPill) {
      statusPill.textContent = "SENDING...";
      statusPill.style.color = "var(--text-muted)";
    }

    try {
      const res = await fetch('/sandbox/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          method: method,
          url: url,
          headers: headers,
          body: body
        })
      });

      const data = await res.json();
      const statusCode = data.status_code || res.status;

      if (statusPill) {
        let statusText = 'ERROR';
        if (statusCode === 200) statusText = '200 OK (SIGNED)';
        else if (statusCode === 401) statusText = '401 UNAUTHORIZED';
        else if (statusCode === 403) statusText = '403 FORBIDDEN';
        else if (statusCode === 404) statusText = '404 NOT FOUND';
        else statusText = `${statusCode} RESPONSE`;

        statusPill.textContent = `STATUS: ${statusText}`;
        statusPill.style.color = statusCode === 200 ? '#4ade80' : '#f87171';
      }

      const formattedResp = typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : (data.body || '');
      const headersStr = Object.entries(data.headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n');

      respBox.innerHTML = `
        <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #334155;color:#94a3b8;font-size:10px;">
          <strong>// RESPONSE HEADERS</strong><br>
          <pre style="margin:4px 0 0 0;font-family:var(--font-mono);">${headersStr}</pre>
        </div>
        <div style="color:${statusCode === 200 ? '#4ade80' : '#f87171'};">
          <pre style="margin:0;font-family:var(--font-mono);">${formattedResp}</pre>
        </div>
      `;

      if (statusCode === 200 && data.body?.flag) {
        AudioFX.playSuccess();
        Toast.success("EXPLOIT REPRODUCED!", "Action Broker signed the transaction. Exploit trace & signature captured!");
        
        // Auto-register EV-05 if not already collected
        try {
          await fetch('/api/evidence/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: 'default_investigator',
              evidence_id: 'EV-05'
            })
          });
        } catch (e) {}
      }

      await LabState.fetchState();

    } catch (err) {
      respBox.textContent = "Failed to dispatch request to proxy.";
      if (statusPill) {
        statusPill.textContent = "PROXY ERROR";
        statusPill.style.color = "#f87171";
      }
    }
  }
}

const RequestComposerInstance = new RequestComposer();
