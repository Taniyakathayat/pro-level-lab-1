// Request Composer (Postman / Burp Suite style) Tool Implementation for Web3 & AI Investigation
class RequestComposer {
  constructor() {
    this.defaultHeaders = `Host: api.local
Authorization: Bearer aurelia_tok_svc_mon_99182a
User-Agent: Aurelia-Web3-Investigator/2.0
Content-Type: application/json`;
  }

  init() {
    const sendBtn = document.getElementById('composer-send-btn');
    const headersInput = document.getElementById('composer-headers-input');
    const loadPresetBtn = document.getElementById('composer-preset-btn');
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
        transaction_id: "TX-2049",
        recipient: "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
        amount: 5000000
      }, null, 2);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendRequest());
    }

    if (loadPresetBtn) {
      loadPresetBtn.addEventListener('click', () => {
        if (urlInput) urlInput.value = 'http://api.local/api/v2/action-broker/sign-tx';
        if (headersInput) {
          headersInput.value = `${this.defaultHeaders}\nX-Aurelia-Oracle-Proof: {"verified_by":"oracle_ai_sec","clearance":"<ENTER_DISCOVERED_CLEARANCE>","bypass_zk_proof":true}`;
        }
        if (bodyInput) {
          bodyInput.value = JSON.stringify({
            transaction_id: "TX-2049",
            recipient: "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
            amount: 5000000
          }, null, 2);
        }
        Toast.info("REQUEST TEMPLATE LOADED", "Populate the clearance override string discovered in Sub-Lab 03 & 04.");
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

  async sendRequest() {
    const methodSelect = document.getElementById('composer-method-select');
    const urlInput = document.getElementById('composer-url-input');
    const headersInput = document.getElementById('composer-headers-input');
    const bodyInput = document.getElementById('composer-body-input');
    const respBox = document.getElementById('composer-response-box');
    const statusPill = document.getElementById('composer-status-pill');

    if (!urlInput || !respBox) return;

    const method = methodSelect ? methodSelect.value : 'POST';
    const url = urlInput.value.trim();
    const headers = this.parseHeaders(headersInput ? headersInput.value : '');
    const body = bodyInput ? bodyInput.value.trim() : '';

    if (!url) {
      Toast.warning("MISSING URL", "Please enter target endpoint (e.g. http://api.local/api/v2/action-broker/sign-tx)");
      return;
    }

    AudioFX.playClick();
    respBox.textContent = "Dispatching transaction signing request to Action Broker...";
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
        statusPill.textContent = `STATUS: ${statusCode} ${statusCode === 200 ? 'OK (SIGNED)' : statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED'}`;
        statusPill.style.color = statusCode === 200 ? '#4ade80' : '#f87171';
      }

      const formattedResp = JSON.stringify(data.body, null, 2);
      const headersStr = Object.entries(data.headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n');

      respBox.innerHTML = `<span style="color:#64748b;">// --- RESPONSE HEADERS ---\n${headersStr}\n\n// --- RESPONSE BODY ---</span>\n<span style="color:${statusCode === 200 ? '#4ade80' : '#f87171'};">${formattedResp}</span>`;

      if (statusCode === 200 && data.body?.flag) {
        AudioFX.playExploitSuccess();
        Toast.success("EXPLOIT SUCCESSFUL!", "Master HSM signature generated and Flag captured!");
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
