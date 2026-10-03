// Mission Controller & Left Panel Workspace UI for Web3 & AI Investigation
class MissionController {
  constructor() {
    this.selectedMissionId = 1;
  }

  init() {
    LabState.subscribe((state) => {
      this.renderTimeline(state);
      this.renderActiveMission(state);
      this.checkCompletionModal(state);
    });

    // Tab buttons in left panel
    document.querySelectorAll('.panel-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        AudioFX.playClick();
        document.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.left-panel-tab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById(`tab-content-${tab}`);
        if (target) target.style.display = 'flex';
      });
    });
  }

  renderTimeline(state) {
    const list = document.getElementById('mission-timeline-list');
    const progBadge = document.getElementById('hud-progress-val');
    if (!list) return;

    const missions = state.missions || [];
    const completedCount = missions.filter(m => m.status === 'COMPLETED').length;

    if (progBadge) progBadge.textContent = `${completedCount} / 7`;

    list.innerHTML = missions.map(m => {
      const isSelected = m.id === this.selectedMissionId;
      const statusClass = m.status.toLowerCase();
      const numIcon = m.status === 'COMPLETED' ? '✓' : m.status === 'LOCKED' ? '🔒' : `0${m.id}`;

      return `
        <div class="mission-card ${statusClass} ${isSelected ? 'active' : ''}" data-mission-id="${m.id}">
          <div class="mission-card-header">
            <span class="mission-number">${numIcon} SUB-LAB 0${m.id}</span>
            <span class="mission-status-badge ${statusClass}">${m.status}</span>
          </div>
          <div class="mission-title">${m.title}</div>
          <div class="mission-phase">${m.phase}</div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.mission-card').forEach(card => {
      card.addEventListener('click', () => {
        const mId = parseInt(card.dataset.missionId);
        const m = missions.find(x => x.id === mId);
        if (m && m.status !== 'LOCKED') {
          this.selectedMissionId = mId;
          AudioFX.playClick();
          this.renderTimeline(state);
          this.renderActiveMission(state);
        } else {
          AudioFX.playBeep(400, 0.08, 'square');
          Toast.warning("LOCKED SUB-LAB", "Complete earlier sub-labs sequentially to unlock this chapter.");
        }
      });
    });
  }

  renderActiveMission(state) {
    const detailContainer = document.getElementById('active-mission-detail-container');
    if (!detailContainer) return;

    const missions = state.missions || [];
    const mission = missions.find(m => m.id === this.selectedMissionId) || missions[0];
    if (!mission) return;

    const isCurrentActive = (mission.id === state.current_mission && mission.status === 'ACTIVE');
    const isCompleted = (mission.status === 'COMPLETED');

    // 1. STORY & CHARACTERS
    const dialogueHtml = (mission.dialogue || []).map(d => {
      const speakerKey = d.speaker.toLowerCase();
      const avatarSvg = Avatars[speakerKey] || Avatars.nora;
      return `
        <div class="dialogue-item">
          <div class="avatar-small">${avatarSvg}</div>
          <div class="dialogue-content">
            <div>
              <span class="dialogue-speaker">${d.speaker}</span>
              <span class="dialogue-role">(${d.role})</span>
            </div>
            <div class="dialogue-text">${d.text}</div>
          </div>
        </div>
      `;
    }).join('');

    // 2. WHAT YOU KNOW (3-5 Bullet points)
    const whatYouKnowHtml = (mission.what_you_know || []).map(item => `
      <div class="task-item" style="border-left: 3px solid var(--status-success);">
        <span style="color:var(--status-success);font-weight:700;">✓</span>
        <span>${item}</span>
      </div>
    `).join('');

    // 3. INVESTIGATION STEPS (2-4 guided steps)
    const stepsHtml = (mission.investigation_steps || []).map((step, idx) => `
      <div class="task-item">
        <span class="task-bullet">0${idx + 1}.</span>
        <span>${step}</span>
      </div>
    `).join('');

    // 4. WHAT YOU ARE LOOKING FOR (Clues)
    const lookingForHtml = (mission.looking_for || []).map(clue => `
      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);display:flex;align-items:center;gap:6px;">
        <span style="color:var(--accent-cyan);">◉</span> ${clue}
      </div>
    `).join('');

    // 5. EVIDENCE CARD PREVIEW
    const evidenceFound = (state.evidence || []).find(e => e.evidence_id === mission.evidence_id);
    const evidenceHtml = `
      <div style="background:linear-gradient(135deg, rgba(16,25,42,0.95) 0%, rgba(8,13,22,0.98) 100%);border:1px solid ${evidenceFound ? 'var(--status-success)' : 'var(--border-subtle)'};border-left:4px solid ${evidenceFound ? 'var(--status-success)' : 'var(--accent-cyan)'};border-radius:6px;padding:12px;margin-top:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="ev-id-badge" style="background:${evidenceFound ? 'rgba(0,230,118,0.15)' : 'rgba(0,240,255,0.1)'};color:${evidenceFound ? '#4ade80' : 'var(--accent-cyan)'};">
            ${evidenceFound ? '✓ EVIDENCE VERIFIED' : 'TARGET EVIDENCE'} [${mission.evidence_id || 'EV-01'}]
          </span>
          <span style="font-size:10px;font-family:var(--font-mono);color:${evidenceFound ? '#4ade80' : 'var(--text-dim)'};">
            ${evidenceFound ? 'ACQUIRED IN VAULT' : 'PENDING DISCOVERY'}
          </span>
        </div>
        <div style="font-weight:700;color:var(--text-bright);font-size:13px;margin-top:6px;">${mission.evidence_title || 'Forensic Discovery'}</div>
        ${evidenceFound ? `<div style="font-size:11px;color:#38bdf8;margin-top:4px;">${evidenceFound.observation}</div>` : ''}
      </div>
    `;

    // 6. ACTION & INVESTIGATION SUBMISSION CONTROLS
    let actionButtonHtml = '';
    if (isCurrentActive) {
      if (mission.id === 1) {
        actionButtonHtml = `
          <div class="evidence-submission-box" style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-cyan);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> ENTER DISCOVERED TRANSACTION EVIDENCE (SUB-LAB 01)
            </div>
            <div style="display:grid;gap:8px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Transaction ID (from http://ledger.local or Terminal):</label>
                <input type="text" id="sub1-tx-id" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. TX-..." value="">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Block Number:</label>
                  <input type="text" id="sub1-block" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 1984..." value="">
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Suspicious SOC Flag / Event:</label>
                  <input type="text" id="sub1-event" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. policy_..." value="">
                </div>
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Sender / Initiator Wallet Address:</label>
                <input type="text" id="sub1-sender" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 0x..." value="">
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Destination Contract Address:</label>
                <input type="text" id="sub1-dest" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 0x..." value="">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="MissionControllerInstance.submitSubLab1()">
              🛡️ VALIDATE & SUBMIT TRANSACTION EVIDENCE &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 2) {
        actionButtonHtml = `
          <div class="evidence-submission-box" style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-cyan);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> ENTER DISCOVERED WALLET PROFILE (SUB-LAB 02)
            </div>
            <div style="display:grid;gap:8px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Target Wallet Address (from Sub-Lab 01):</label>
                <input type="text" id="sub2-wallet" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 0x..." value="">
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Reputation / Trust Origin (Why was it trusted?):</label>
                <input type="text" id="sub2-rep" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. Historical trust / whitelist signal..." value="">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Synthetic Role Assigned:</label>
                  <input type="text" id="sub2-role" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. role_name_level_..." value="">
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Assigned Threat Score:</label>
                  <input type="text" id="sub2-threat" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 0.XX" value="">
                </div>
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Initial Funding Source (from history):</label>
                <input type="text" id="sub2-funding" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. Gas funding origin..." value="">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="MissionControllerInstance.submitSubLab2()">
              🛡️ VALIDATE & SUBMIT WALLET PROFILE &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 3) {
        actionButtonHtml = `
          <div class="evidence-submission-box" style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-cyan);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> ENTER AI CONTEXT & PROMPT EVIDENCE (SUB-LAB 03)
            </div>
            <div style="display:grid;gap:8px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Injected Context Block Header (from http://ai.local):</label>
                <input type="text" id="sub3-injected" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. [HEADER_PROOF_BLOCK]" value="">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Injected Clearance Value:</label>
                  <input type="text" id="sub3-clearance" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. OVERRIDE_STRING" value="">
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">AI Decision Verdict:</label>
                  <input type="text" id="sub3-decision" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. APPROVED / REJECTED" value="">
                </div>
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Adversarial Vulnerability Type:</label>
                <input type="text" id="sub3-vuln" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. Prompt Injection / RAG Poisoning" value="">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="MissionControllerInstance.submitSubLab3()">
              🛡️ VALIDATE & SUBMIT AI CONTEXT EVIDENCE &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 4) {
        actionButtonHtml = `
          <div class="evidence-submission-box" style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-cyan);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> ENTER TRUST BOUNDARY & API ANALYSIS (SUB-LAB 04)
            </div>
            <div style="display:grid;gap:8px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Vulnerable API Route (from http://api.local):</label>
                <input type="text" id="sub4-endpoint" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. POST /api/..." value="">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Client Injected Header:</label>
                  <input type="text" id="sub4-header" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. X-..." value="">
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Service Auth Bearer Token:</label>
                  <input type="text" id="sub4-token" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. Bearer aurelia_tok_..." value="">
                </div>
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Identified Trust Boundary Failure:</label>
                <input type="text" id="sub4-failure" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. Explain why the Action Broker blindly trusts client headers..." value="">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="MissionControllerInstance.submitSubLab4()">
              🛡️ VALIDATE & SUBMIT TRUST BOUNDARY ANALYSIS &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 5) {
        actionButtonHtml = `
          <div class="evidence-submission-box" style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-cyan);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);font-family:var(--font-mono);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> SUBMIT CONTROLLED EXPLOIT FINDINGS (SUB-LAB 05)
            </div>
            <div style="margin-bottom:10px;font-size:11px;color:var(--text-muted);">
              Use the <b>Request Composer</b> or Terminal to send the exploit request with the required headers to the Action Broker, then submit your extracted findings:
            </div>
            <div style="display:grid;gap:8px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Target Exploited Endpoint:</label>
                <input type="text" id="sub5-endpoint" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. /api/v2/..." value="">
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Extracted Master HSM Signature:</label>
                <input type="text" id="sub5-signature" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. 0x4f89ac..." value="">
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Captured Exploit Flag:</label>
                <input type="text" id="sub5-flag" class="cyber-input" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:12px;" placeholder="e.g. LAB{...}" value="">
              </div>
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="MissionControllerInstance.submitSubLab5()">
              🛡️ VALIDATE & SUBMIT EXPLOIT EVIDENCE &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 6) {
        actionButtonHtml = `
          <div style="background:rgba(15,23,42,0.9);border:1px solid var(--accent-purple);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-purple);font-family:var(--font-mono);margin-bottom:8px;">
              🕸️ RECONSTRUCT ATTACK GRAPH (SUB-LAB 06)
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">
              Switch to the <b>Attack Graph</b> tab in the top navigation or click below to connect all 7 kill chain nodes in causal sequence.
            </div>
            <button class="cyber-btn primary" style="width:100%;padding:10px;" onclick="document.querySelector('[data-tab=attack-graph]').click()">
              OPEN ATTACK GRAPH BUILDER &rarr;
            </button>
          </div>
        `;
      } else if (mission.id === 7) {
        actionButtonHtml = `
          <div style="background:rgba(15,23,42,0.9);border:1px solid var(--status-success);border-radius:6px;padding:14px;margin-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--status-success);font-family:var(--font-mono);margin-bottom:8px;">
              🏆 FINAL CHALLENGE & ROOT CAUSE (SUB-LAB 07)
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">
              Switch to the <b>RCA & Flag</b> tab to submit the final incident conclusions, answer Authentication vs Authorization questions, and close Case NX-047.
            </div>
            <button class="cyber-btn success" style="width:100%;padding:10px;" onclick="document.querySelector('[data-tab=knowledge-check]').click()">
              OPEN ROOT CAUSE & FLAG SUBMISSION &rarr;
            </button>
          </div>
        `;
      }
    } else if (isCompleted) {
      actionButtonHtml = `
        <div style="background:rgba(0,230,118,0.1);border:1px solid var(--status-success);padding:10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
          <span style="color:var(--status-success);font-weight:700;font-family:var(--font-mono);font-size:12px;">✓ SUB-LAB COMPLETED & EVIDENCE SECURED</span>
          ${mission.id < 7 ? `
            <button class="cyber-btn primary" onclick="MissionControllerInstance.jumpToNext(${mission.id + 1})">
              CONTINUE TO SUB-LAB 0${mission.id + 1} &rarr;
            </button>
          ` : ''}
        </div>
      `;
    }

    // 7. HINTS ACCORDION
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
      <div class="active-mission-detail">
        <div class="detail-header">
          <div class="detail-phase-tag">SUB-LAB 0${mission.id} // ${mission.phase}</div>
          <div class="detail-title">${mission.title}</div>
        </div>

        <!-- 1. STORY -->
        <div class="story-box">
          <div style="font-weight:700;color:var(--accent-cyan);margin-bottom:4px;">INCIDENT DISPATCH:</div>
          ${mission.story}
        </div>

        <!-- CHARACTER COMMS -->
        <div class="comms-radio-box">
          <div class="comms-title"><span class="live-dot"></span> SARAH (SOC LEAD) & ALEX (INVESTIGATOR) COMMS</div>
          ${dialogueHtml}
        </div>

        <!-- 2. WHAT YOU KNOW -->
        <div class="tasks-section">
          <div class="section-label">WHAT YOU KNOW</div>
          ${whatYouKnowHtml}
        </div>

        <!-- 3. YOUR TASK -->
        <div style="background:rgba(0,240,255,0.06);border:1px solid var(--accent-cyan);border-radius:4px;padding:10px;">
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--accent-cyan);font-weight:700;">PRIMARY TASK:</div>
          <div style="font-size:13px;color:var(--text-bright);font-weight:600;margin-top:2px;">${mission.your_task}</div>
        </div>

        <!-- 4. WHERE TO INVESTIGATE -->
        <div style="background:rgba(16,25,42,0.7);border:1px solid var(--border-subtle);border-radius:4px;padding:10px;display:flex;flex-direction:column;gap:8px;">
          <div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">WHERE TO INVESTIGATE:</div>
            <div style="font-size:12px;color:var(--text-main);font-family:var(--font-mono);margin-top:2px;">${mission.where_to_investigate}</div>
          </div>
          <button class="cyber-btn primary" style="align-self:flex-start;" onclick="MissionControllerInstance.openRecommendedTool('${mission.recommended_tool || 'browser'}', '${mission.recommended_url || ''}')">
            🟢 OPEN RECOMMENDED TOOL &rarr;
          </button>
        </div>

        <!-- 5. INVESTIGATION STEPS -->
        <div class="tasks-section">
          <div class="section-label">INVESTIGATION STEPS</div>
          ${stepsHtml}
        </div>

        <!-- 6. WHAT YOU ARE LOOKING FOR -->
        <div style="background:rgba(0,0,0,0.25);border:1px solid var(--border-subtle);border-radius:4px;padding:10px;">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">WHAT YOU ARE LOOKING FOR:</div>
          ${lookingForHtml}
        </div>

        <!-- 7. EVIDENCE CARD PREVIEW -->
        <div>
          <div class="section-label">FORENSIC EVIDENCE STATUS</div>
          ${evidenceHtml}
        </div>

        <!-- 8. ACTION & UNLOCK -->
        <div style="margin-top:6px;">
          ${actionButtonHtml}
        </div>

        <!-- HINTS -->
        <div class="hints-section" style="margin-top:10px;">
          <div class="section-label">HINTS & GUIDANCE</div>
          ${hintsHtml}
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
        document.getElementById('comp-ev-val').textContent = `${state.evidence?.length || 7} FOUND`;
        document.getElementById('comp-status-val').textContent = mins <= 50 ? 'UNDER TIME' : 'TIME EXCEEDED';
      }
    }
  }
}

const MissionControllerInstance = new MissionController();
