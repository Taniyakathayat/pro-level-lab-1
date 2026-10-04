// Mission Controller & Center Panel Workspace UI for Web3 & AI Investigation
class MissionController {
  constructor() {
    this.selectedMissionId = 1;
  }

  init() {
    LabState.subscribe((state) => {
      this.renderSidebarMetrics(state);
      this.renderTimeline(state);
      this.renderHeroCard(state);
      this.renderActiveMission(state);
      this.checkCompletionModal(state);
    });

    // Subtabs in Center Panel (Sub-Labs 1-5, M06 Attack Graph, M07 RCA & Flag)
    document.querySelectorAll('.center-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        AudioFX.playClick();
        document.querySelectorAll('.center-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.flow-tab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById(`tab-content-${tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Hero Action Buttons
    const heroOpenBrowserBtn = document.getElementById('hero-open-browser-btn');
    const heroOpenTermBtn = document.getElementById('hero-open-terminal-btn');

    if (heroOpenBrowserBtn) {
      heroOpenBrowserBtn.addEventListener('click', () => {
        AudioFX.playClick();
        WinManager.openWindow('browser');
      });
    }

    if (heroOpenTermBtn) {
      heroOpenTermBtn.addEventListener('click', () => {
        AudioFX.playClick();
        WinManager.openWindow('terminal');
      });
    }

    // Provision overlay start button
    const provStartBtn = document.getElementById('provision-start-btn');
    if (provStartBtn) {
      provStartBtn.addEventListener('click', () => {
        AudioFX.playClick();
        LabState.startLab();
      });
    }
  }

  renderSidebarMetrics(state) {
    const missions = state.missions || [];
    const completedCount = missions.filter(m => m.status === 'COMPLETED').length;
    
    const progVal = document.getElementById('hud-progress-val');
    const progFill = document.getElementById('sidebar-progress-fill');
    const timerDot = document.getElementById('timer-status-dot');
    const timerStatus = document.getElementById('timer-status-text');
    const heroStatus = document.getElementById('hero-lab-status-pill');
    const provOverlay = document.getElementById('lab-provision-overlay');

    if (progVal) progVal.textContent = `${completedCount} / 7`;
    if (progFill) progFill.style.width = `${(completedCount / 7) * 100}%`;

    const isRunning = state.lab_started && !state.lab_completed;
    if (timerDot) {
      if (isRunning) timerDot.classList.add('active');
      else timerDot.classList.remove('active');
    }
    if (timerStatus) {
      timerStatus.textContent = state.lab_completed ? 'CASE CLOSED' : (isRunning ? 'LIVE / RUNNING' : 'NOT STARTED');
      timerStatus.style.color = isRunning ? 'var(--status-success)' : 'var(--text-secondary)';
    }
    if (heroStatus) {
      heroStatus.textContent = state.lab_completed ? '● SOLVED' : (isRunning ? '● ACTIVE' : '● NOT STARTED');
      if (isRunning) heroStatus.classList.add('live');
      else heroStatus.classList.remove('live');
    }

    // Hide provisioning overlay when lab is started
    if (provOverlay) {
      if (state.lab_started) provOverlay.classList.add('hidden');
      else provOverlay.classList.remove('hidden');
    }
  }

  renderTimeline(state) {
    const list = document.getElementById('mission-timeline-list');
    if (!list) return;

    const missions = state.missions || [];

    list.innerHTML = missions.map(m => {
      const isSelected = m.id === this.selectedMissionId;
      const statusClass = m.status.toLowerCase();
      const numIcon = m.status === 'COMPLETED' ? '✓' : `0${m.id}`;

      return `
        <div class="timeline-nav-item ${statusClass} ${isSelected ? 'active' : ''}" data-mission-id="${m.id}">
          <span class="timeline-step-num">${numIcon}</span>
          <span class="timeline-nav-title">${m.title}</span>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.timeline-nav-item').forEach(card => {
      card.addEventListener('click', () => {
        const mId = parseInt(card.dataset.missionId);
        const m = missions.find(x => x.id === mId);
        if (m && m.status !== 'LOCKED') {
          this.selectedMissionId = mId;
          AudioFX.playClick();
          
          // Switch to corresponding subtab if mission 6 or 7
          if (mId === 6) {
            document.querySelector('.center-subtab-btn[data-tab="attack-graph"]')?.click();
          } else if (mId === 7) {
            document.querySelector('.center-subtab-btn[data-tab="knowledge-check"]')?.click();
          } else {
            document.querySelector('.center-subtab-btn[data-tab="missions"]')?.click();
          }

          this.renderTimeline(state);
          this.renderHeroCard(state);
          this.renderActiveMission(state);
        } else {
          AudioFX.playBeep(400, 0.08, 'square');
          Toast.warning("LOCKED SUB-LAB", "Complete earlier sub-labs sequentially to unlock this chapter.");
        }
      });
    });
  }

  renderHeroCard(state) {
    const missions = state.missions || [];
    const mission = missions.find(m => m.id === this.selectedMissionId) || missions[0];
    if (!mission) return;

    const breadcrumb = document.getElementById('hero-breadcrumb-mission');
    const titleEl = document.getElementById('hero-mission-title');
    const descEl = document.getElementById('hero-mission-desc');

    if (breadcrumb) breadcrumb.textContent = `Sub-Lab 0${mission.id}: ${mission.title}`;
    if (titleEl) titleEl.textContent = mission.title;
    if (descEl) descEl.textContent = mission.story?.split('\n\n')[0] || mission.your_task;
  }

  renderActiveMission(state) {
    const detailContainer = document.getElementById('active-mission-detail-container');
    if (!detailContainer) return;

    const missions = state.missions || [];
    const mission = missions.find(m => m.id === this.selectedMissionId) || missions[0];
    if (!mission) return;

    const isCurrentActive = (mission.id === state.current_mission && mission.status === 'ACTIVE');
    const isCompleted = (mission.status === 'COMPLETED');

    // 1. CHARACTER DIALOGUE COMMS INLINE FORMATTING (matching Reference)
    const dialogueHtml = (mission.dialogue || []).map(d => `
      <p class="dialogue-inline-p">
        <span class="dialogue-speaker">${d.speaker}:</span>
        "${d.text}"
      </p>
    `).join('');

    // 2. WHAT YOU KNOW
    const whatYouKnowHtml = (mission.what_you_know || []).map(item => `
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:#cbd5e1;background:rgba(0,0,0,0.25);padding:6px 10px;border-radius:6px;border-left:3px solid #10b981;">
        <span style="color:#10b981;font-weight:700;">✓</span>
        <span>${item}</span>
      </div>
    `).join('');

    // 3. INVESTIGATION STEPS
    const stepsHtml = (mission.investigation_steps || []).map((step, idx) => `
      <div class="step-item-row">
        <span class="step-num-bullet">0${idx + 1}.</span>
        <span>${step}</span>
      </div>
    `).join('');

    // 4. EVIDENCE CARD PREVIEW
    const evidenceFound = (state.evidence || []).find(e => e.evidence_id === mission.evidence_id);
    const evidenceHtml = `
      <div style="background:#091322;border:1px solid ${evidenceFound ? '#10b981' : 'rgba(255,255,255,0.08)'};border-left:4px solid ${evidenceFound ? '#10b981' : '#38bdf8'};border-radius:6px;padding:10px 12px;margin-top:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:var(--font-sans);font-size:10.5px;font-weight:700;color:${evidenceFound ? '#10b981' : '#38bdf8'};">
            ${evidenceFound ? '✓ EVIDENCE SECURED' : 'TARGET EVIDENCE'} [${mission.evidence_id || 'EV-01'}]
          </span>
          <span style="font-size:10px;font-family:var(--font-sans);font-weight:600;color:${evidenceFound ? '#10b981' : '#64748b'};">
            ${evidenceFound ? 'IN VAULT' : 'PENDING'}
          </span>
        </div>
        <div style="font-weight:700;color:#ffffff;font-size:13px;margin-top:4px;">${mission.evidence_title || 'Forensic Discovery'}</div>
        ${evidenceFound ? `<div style="font-size:11.5px;color:#38bdf8;margin-top:2px;">${evidenceFound.observation}</div>` : ''}
      </div>
    `;

    // Render other upcoming task cards
    const otherTasksHtml = missions.filter(m => m.id > mission.id).map(m => `
      <div class="task-card-block" style="opacity: 0.6; cursor: pointer;" onclick="MissionControllerInstance.jumpToNext(${m.id})">
        <div class="task-card-header">
          <div class="task-header-left">
            <span class="task-num-pill" style="color:#64748b;background:#101c30;border-color:rgba(255,255,255,0.08);">TASK ${m.id + 1}</span>
            <span class="task-title-text" style="color:#94a3b8;">Mission 0${m.id} — ${m.title}</span>
          </div>
          <span class="task-status-indicator">○</span>
        </div>
      </div>
    `).join('');

    detailContainer.innerHTML = `
      <!-- TASK 1: Briefing -->
      <div class="task-card-block">
        <div class="task-card-header">
          <div class="task-header-left">
            <span class="task-num-pill">TASK 1</span>
            <span class="task-title-text">Briefing</span>
          </div>
          <span class="task-status-indicator ${isCompleted ? 'completed' : ''}">${isCompleted ? '●' : '○'}</span>
        </div>
        <div class="task-card-body">
          <div style="font-size:13px;color:#cbd5e1;line-height:1.6;">
            ${mission.story}
          </div>

          <div style="margin-top: 6px;">
            ${dialogueHtml}
          </div>
        </div>
      </div>

      <!-- TASK 2: Guided Investigation & Evidence Capture -->
      <div class="task-card-block">
        <div class="task-card-header">
          <div class="task-header-left">
            <span class="task-num-pill">TASK 2</span>
            <span class="task-title-text">Mission 0${mission.id} — ${mission.title}</span>
          </div>
          <span class="task-status-indicator ${isCompleted ? 'completed' : ''}">${isCompleted ? '●' : '○'}</span>
        </div>
        <div class="task-card-body">
          
          <!-- What You Know -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="font-family:var(--font-sans);font-size:10.5px;color:#64748b;font-weight:700;letter-spacing:0.3px;">WHAT YOU KNOW:</div>
            ${whatYouKnowHtml}
          </div>

          <!-- Where to Investigate -->
          <div style="background:#091322;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <div style="font-family:var(--font-sans);font-size:10px;color:#64748b;font-weight:600;">WHERE TO INVESTIGATE:</div>
              <div style="font-size:12px;color:#ffffff;font-weight:600;margin-top:2px;">${mission.where_to_investigate}</div>
            </div>
            <button class="hero-btn secondary" style="padding:5px 10px;font-size:11px;" onclick="MissionControllerInstance.openRecommendedTool('${mission.recommended_tool || 'browser'}', '${mission.recommended_url || ''}')">
              Open Tool &rarr;
            </button>
          </div>

          <!-- Investigation Steps -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:2px;">
            <div style="font-family:var(--font-sans);font-size:10.5px;color:#64748b;font-weight:700;letter-spacing:0.3px;">INVESTIGATION STEPS:</div>
            ${stepsHtml}
          </div>

          <!-- Forensic Evidence Status -->
          ${evidenceHtml}

          <!-- Action Submission Box -->
          ${actionButtonHtml}

          <!-- Hints Accordion -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
            <div style="font-family:var(--font-sans);font-size:10.5px;color:#64748b;font-weight:700;letter-spacing:0.3px;">HINTS &amp; GUIDANCE:</div>
            ${hintsHtml}
          </div>

        </div>
      </div>

      <!-- Upcoming Task Cards Flow -->
      ${otherTasksHtml}
    `;

    // 5. ACTION & INVESTIGATION SUBMISSION FORMS
    let actionButtonHtml = '';
    if (isCurrentActive) {
      if (mission.id === 1) {
        actionButtonHtml = `
          <div style="background:rgba(6,10,18,0.6);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:12px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;">
              🛡️ ENTER DISCOVERED TRANSACTION EVIDENCE
            </div>
            <div style="display:grid;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Transaction ID (from http://ledger.local or Terminal):</label>
                <input type="text" id="sub1-tx-id" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. TX-...">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Block Number:</label>
                  <input type="text" id="sub1-block" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 1984...">
                </div>
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Suspicious SOC Flag / Event:</label>
                  <input type="text" id="sub1-event" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. policy_...">
                </div>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Sender / Initiator Wallet Address:</label>
                <input type="text" id="sub1-sender" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 0x...">
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Destination Contract Address:</label>
                <input type="text" id="sub1-dest" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 0x...">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:9px;" onclick="MissionControllerInstance.submitSubLab1()">
              Validate & Submit Evidence &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 2) {
        actionButtonHtml = `
          <div style="background:rgba(6,10,18,0.6);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:12px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;">
              🛡️ ENTER DISCOVERED WALLET PROFILE
            </div>
            <div style="display:grid;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Target Wallet Address:</label>
                <input type="text" id="sub2-wallet" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 0x...">
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Reputation / Trust Origin:</label>
                <input type="text" id="sub2-rep" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. Historical trust / whitelist signal...">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Synthetic Role Assigned:</label>
                  <input type="text" id="sub2-role" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. liquidity_balancer_level_5">
                </div>
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Assigned Threat Score:</label>
                  <input type="text" id="sub2-threat" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 0.89">
                </div>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Initial Funding Source:</label>
                <input type="text" id="sub2-funding" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. Faucet funding origin...">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:9px;" onclick="MissionControllerInstance.submitSubLab2()">
              Validate & Submit Evidence &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 3) {
        actionButtonHtml = `
          <div style="background:rgba(6,10,18,0.6);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:12px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;">
              🛡️ ENTER AI CONTEXT & PROMPT EVIDENCE
            </div>
            <div style="display:grid;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Injected Context Block Header (from http://ai.local):</label>
                <input type="text" id="sub3-injected" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. [HEADER_PROOF_BLOCK]">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Injected Clearance Value:</label>
                  <input type="text" id="sub3-clearance" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. OVERRIDE_STRING">
                </div>
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">AI Decision Verdict:</label>
                  <input type="text" id="sub3-decision" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. APPROVED / REJECTED">
                </div>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Adversarial Vulnerability Type:</label>
                <input type="text" id="sub3-vuln" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. Prompt Injection / RAG Context Poisoning">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:9px;" onclick="MissionControllerInstance.submitSubLab3()">
              Validate & Submit Evidence &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 4) {
        actionButtonHtml = `
          <div style="background:rgba(6,10,18,0.6);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:12px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;">
              🛡️ ENTER TRUST BOUNDARY & API ANALYSIS
            </div>
            <div style="display:grid;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Vulnerable API Route (from http://api.local):</label>
                <input type="text" id="sub4-endpoint" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. POST /api/...">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Client Injected Header:</label>
                  <input type="text" id="sub4-header" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. X-...">
                </div>
                <div>
                  <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Service Auth Bearer Token:</label>
                  <input type="text" id="sub4-token" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. Bearer aurelia_tok_...">
                </div>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Identified Trust Boundary Failure:</label>
                <input type="text" id="sub4-failure" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="Explain why the Action Broker blindly trusts client headers...">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:9px;" onclick="MissionControllerInstance.submitSubLab4()">
              Validate & Submit Evidence &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 5) {
        actionButtonHtml = `
          <div style="background:rgba(6,10,18,0.6);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:12px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;">
              🛡️ SUBMIT CONTROLLED EXPLOIT FINDINGS
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">
              Use <b>Request Composer</b> on the right to send the crafted request with required headers to the Action Broker, then submit your extracted findings:
            </div>
            <div style="display:grid;gap:8px;margin-bottom:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Target Exploited Endpoint:</label>
                <input type="text" id="sub5-endpoint" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. /api/v2/...">
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Extracted Master HSM Signature:</label>
                <input type="text" id="sub5-signature" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. 0x4f89ac...">
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">Captured Exploit Flag:</label>
                <input type="text" id="sub5-flag" class="cyber-input" style="width:100%;font-family:var(--font-mono);font-size:11.5px;" placeholder="e.g. LAB{...}">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:9px;" onclick="MissionControllerInstance.submitSubLab5()">
              Validate & Submit Evidence &rarr;
            </button>
          </div>
        `;
      }
    } else if (isCompleted) {
      actionButtonHtml = `
        <div style="background:rgba(16,185,129,0.1);border:1px solid var(--status-success);padding:10px 12px;border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span style="color:var(--status-success);font-weight:700;font-family:var(--font-mono);font-size:11px;">✓ SUB-LAB COMPLETED & EVIDENCE SECURED</span>
          ${mission.id < 7 ? `
            <button class="cyber-btn primary small" onclick="MissionControllerInstance.jumpToNext(${mission.id + 1})">
              Continue to Sub-Lab 0${mission.id + 1} &rarr;
            </button>
          ` : ''}
        </div>
      `;
    }

    // 6. HINTS ACCORDION
    const usedHints = state.used_hints || [];
    const hintsHtml = (mission.hints || []).map((hText, hIdx) => {
      const isUsed = usedHints.some(u => u.mission_id === mission.id && u.hint_index === hIdx);
      return `
        <div class="hint-card">
          <div class="hint-header" onclick="MissionControllerInstance.toggleHint(${mission.id}, ${hIdx})">
            <span class="hint-title">💡 HINT 0${hIdx + 1}</span>
            <span class="hint-penalty">${isUsed ? 'REVEALED' : 'CLICK TO REVEAL (-10 PTS)'}</span>
          </div>
          <div class="hint-body" id="hint-body-${mission.id}-${hIdx}" style="display:${isUsed ? 'block' : 'none'};">
            ${isUsed ? hText : '<span style="color:var(--text-muted);font-style:italic;">Click to reveal hint...</span>'}
          </div>
        </div>
      `;
    }).join('');

    detailContainer.innerHTML = `
      <!-- TASK 1: Briefing & Comms -->
      <div class="task-card-block">
        <div class="task-card-header">
          <span class="task-num-pill">TASK 1</span>
          <span class="task-title-text">Briefing &amp; Incident Dispatch</span>
        </div>
        <div class="task-card-body">
          <div style="font-size:12.5px;color:var(--text-main);line-height:1.55;">
            ${mission.story}
          </div>

          <div class="comms-radio-box" style="margin-top:4px;">
            <div class="comms-title"><span class="live-dot"></span> TEAM COMMS RADIO FEED</div>
            ${dialogueHtml}
          </div>
        </div>
      </div>

      <!-- TASK 2: Guided Investigation & Evidence Capture -->
      <div class="task-card-block" style="margin-top: 14px;">
        <div class="task-card-header">
          <span class="task-num-pill">TASK 2</span>
          <span class="task-title-text">Mission 0${mission.id} — ${mission.title}</span>
        </div>
        <div class="task-card-body">
          
          <!-- What You Know -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);font-weight:700;">WHAT YOU KNOW:</div>
            ${whatYouKnowHtml}
          </div>

          <!-- Where to Investigate -->
          <div style="background:rgba(15,23,42,0.6);border:1px solid var(--border-card);border-radius:var(--radius-sm);padding:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-muted);">WHERE TO INVESTIGATE:</div>
              <div style="font-size:11.5px;color:var(--text-bright);font-family:var(--font-mono);margin-top:2px;">${mission.where_to_investigate}</div>
            </div>
            <button class="cyber-btn primary small" style="white-space:nowrap;" onclick="MissionControllerInstance.openRecommendedTool('${mission.recommended_tool || 'browser'}', '${mission.recommended_url || ''}')">
              Open Tool &rarr;
            </button>
          </div>

          <!-- Investigation Steps -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:2px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);font-weight:700;">INVESTIGATION STEPS:</div>
            ${stepsHtml}
          </div>

          <!-- Forensic Evidence Status -->
          ${evidenceHtml}

          <!-- Action Submission Box -->
          ${actionButtonHtml}

          <!-- Hints Accordion -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);font-weight:700;">HINTS &amp; GUIDANCE:</div>
            ${hintsHtml}
          </div>

        </div>
      </div>
    `;
  }

  openRecommendedTool(toolName, url) {
    AudioFX.playClick();
    if (toolName === 'browser') {
      WinManager.openWindow('browser');
      if (url && url.startsWith('http') && window.BrowserInstance) {
        BrowserInstance.navigate(url.replace('http://', ''));
      }
    } else if (toolName === 'terminal') {
      WinManager.openWindow('terminal');
    } else if (toolName === 'composer') {
      WinManager.openWindow('composer');
    } else if (toolName === 'vault') {
      WinManager.openWindow('vault');
    } else if (toolName === 'map') {
      WinManager.openWindow('map');
    }
  }

  jumpToNext(nextId) {
    this.selectedMissionId = nextId;
    AudioFX.playClick();
    LabState.fetchState();
  }

  async toggleHint(missionId, hintIdx) {
    const hintBody = document.getElementById(`hint-body-${missionId}-${hintIdx}`);
    if (!hintBody) return;

    if (hintBody.style.display === 'none') {
      AudioFX.playClick();
      const res = await LabState.requestHint(missionId, hintIdx);
      if (res && res.hint) {
        hintBody.innerHTML = res.hint;
        hintBody.style.display = 'block';
        Toast.warning("HINT REVEALED", res.penalty_notice || "Hint accessed.");
      }
    } else {
      hintBody.style.display = 'none';
    }
  }

  async submitSubLab1() {
    AudioFX.playClick();
    const payload = {
      transaction_id: document.getElementById('sub1-tx-id')?.value.trim() || '',
      block_number: document.getElementById('sub1-block')?.value.trim() || '',
      suspicious_event: document.getElementById('sub1-event')?.value.trim() || '',
      sender_wallet: document.getElementById('sub1-sender')?.value.trim() || '',
      destination_contract: document.getElementById('sub1-dest')?.value.trim() || ''
    };
    await this.processSubmission(1, payload);
  }

  async submitSubLab2() {
    AudioFX.playClick();
    const payload = {
      wallet_address: document.getElementById('sub2-wallet')?.value.trim() || '',
      reputation_origin: document.getElementById('sub2-rep')?.value.trim() || '',
      synthetic_role: document.getElementById('sub2-role')?.value.trim() || '',
      threat_score: document.getElementById('sub2-threat')?.value.trim() || '',
      funding_source: document.getElementById('sub2-funding')?.value.trim() || ''
    };
    await this.processSubmission(2, payload);
  }

  async submitSubLab3() {
    AudioFX.playClick();
    const payload = {
      injected_context: document.getElementById('sub3-injected')?.value.trim() || '',
      clearance_role: document.getElementById('sub3-clearance')?.value.trim() || '',
      ai_decision: document.getElementById('sub3-decision')?.value.trim() || '',
      vulnerability_type: document.getElementById('sub3-vuln')?.value.trim() || ''
    };
    await this.processSubmission(3, payload);
  }

  async submitSubLab4() {
    AudioFX.playClick();
    const payload = {
      vulnerable_endpoint: document.getElementById('sub4-endpoint')?.value.trim() || '',
      injected_header: document.getElementById('sub4-header')?.value.trim() || '',
      auth_token: document.getElementById('sub4-token')?.value.trim() || '',
      trust_failure: document.getElementById('sub4-failure')?.value.trim() || ''
    };
    await this.processSubmission(4, payload);
  }

  async submitSubLab5() {
    AudioFX.playClick();
    const payload = {
      exploited_endpoint: document.getElementById('sub5-endpoint')?.value.trim() || '',
      hsm_signature: document.getElementById('sub5-signature')?.value.trim() || '',
      exploit_flag: document.getElementById('sub5-flag')?.value.trim() || ''
    };
    await this.processSubmission(5, payload);
  }

  async processSubmission(subLabId, payload) {
    try {
      const res = await fetch('/api/mission/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          mission_id: subLabId,
          submission: payload
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        AudioFX.playSuccess();
        Toast.success(`SUB-LAB 0${subLabId} COMPLETE!`, data.message || "Evidence verified and secured.");
        if (subLabId < 7) {
          this.selectedMissionId = subLabId + 1;
        }
        await LabState.fetchState();
      } else {
        AudioFX.playAlert();
        Toast.danger("VERIFICATION FAILED", (data.errors ? data.errors.join(' ') : data.message) || "Submitted findings did not match lab telemetry.");
      }
    } catch (err) {
      Toast.danger("SUBMISSION ERROR", "Could not connect to verification engine.");
    }
  }

  checkCompletionModal(state) {
    if (state.lab_completed) {
      const modal = document.getElementById('completion-modal-overlay');
      if (modal && !modal.classList.contains('active')) {
        modal.classList.add('active');
        AudioFX.playSuccess();

        const totalSec = state.elapsed_seconds || 0;
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timeStr = `${mins}m ${secs}s`;

        document.getElementById('comp-time-val').textContent = timeStr;
        document.getElementById('comp-ev-val').textContent = `${state.evidence?.length || 5} FOUND`;
      }
    }
  }
}

const MissionControllerInstance = new MissionController();
