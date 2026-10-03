// Instructor & Debug Mode Controller
class InstructorPanel {
  constructor() {
    this.token = null;
  }

  init() {
    const triggerBtn = document.getElementById('instructor-mode-trigger-btn');
    const modal = document.getElementById('instructor-modal-overlay');
    const authBtn = document.getElementById('instructor-auth-btn');
    const closeBtn = document.getElementById('instructor-close-btn');

    if (triggerBtn && modal) {
      triggerBtn.addEventListener('click', () => {
        AudioFX.playClick();
        modal.classList.add('active');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    if (authBtn) {
      authBtn.addEventListener('click', () => this.authenticate());
    }
  }

  async authenticate() {
    const pinInput = document.getElementById('instructor-pin-input');
    const pin = pinInput ? pinInput.value.trim() : '';

    try {
      const res = await fetch('/api/instructor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        this.token = data.token;
        Toast.success("INSTRUCTOR AUTHENTICATED", "Debug console unlocked.");
        this.renderDebugView();
      } else {
        Toast.danger("INVALID PIN", "Instructor PIN rejected.");
      }
    } catch (err) {
      Toast.danger("AUTH ERROR", "Could not verify PIN.");
    }
  }

  async renderDebugView() {
    const body = document.getElementById('instructor-modal-body');
    if (!body) return;

    try {
      const res = await fetch('/api/instructor/debug-state?session_id=default_investigator', {
        headers: { 'X-Instructor-Auth': this.token }
      });
      const data = await res.json();

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="background:rgba(0,240,255,0.08);border:1px solid var(--accent-cyan);padding:12px;border-radius:4px;">
            <h3 style="font-family:var(--font-mono);color:var(--accent-cyan);">INSTRUCTOR DEBUG DASHBOARD</h3>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Case ID: NX-047 | Target: Aurelia Cyber Systems</p>
          </div>

          <div class="portal-widget">
            <h3>QUICK MISSION JUMP / FORCE UNLOCK</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
              ${[1, 2, 3, 4, 5, 6, 7].map(m => `
                <button class="cyber-btn" onclick="InstructorPanelInstance.jumpMission(${m})">Jump to M0${m}</button>
              `).join('')}
            </div>
          </div>

          <div class="portal-widget">
            <h3>OFFICIAL SOLUTION & EXPLOIT</h3>
            <div style="font-size:12px;color:var(--text-bright);line-height:1.6;">
              <div><strong>Vulnerability:</strong> ${data.solution_guide.vulnerability_type}</div>
              <div><strong>Affected Endpoint:</strong> <code>http://gateway.aurelia.local/api/v2/cluster/vault-keys</code></div>
              <div><strong>Exploit Curl Command:</strong></div>
              <pre style="background:#05080f;padding:8px;border-radius:4px;color:#4ade80;margin-top:4px;overflow-x:auto;">${data.solution_guide.exploit_curl}</pre>
              <div style="margin-top:6px;"><strong>Flag:</strong> <code style="color:var(--accent-cyan);">${data.solution_guide.flag}</code></div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div style="color:#f87171;">Failed to load debug telemetry.</div>`;
    }
  }

  async jumpMission(mId) {
    try {
      const res = await fetch('/api/instructor/unlock-mission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Instructor-Auth': this.token
        },
        body: JSON.stringify({
          session_id: 'default_investigator',
          mission_id: mId
        })
      });

      if (res.ok) {
        Toast.success("MISSION FORCED", `Jumped to Mission ${mId}`);
        await LabState.fetchState();
        this.renderDebugView();
      }
    } catch (err) {
      Toast.danger("JUMP FAILED", "Could not unlock mission.");
    }
  }
}

const InstructorPanelInstance = new InstructorPanel();
