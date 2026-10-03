// Final Challenge Knowledge Check & Flag Submission Engine for Web3 & AI Investigation
class KnowledgeCheckController {
  init() {
    const submitKcBtn = document.getElementById('submit-kc-btn');
    const submitFlagBtn = document.getElementById('submit-flag-btn');

    if (submitKcBtn) {
      submitKcBtn.addEventListener('click', () => this.submitQuiz());
    }

    if (submitFlagBtn) {
      submitFlagBtn.addEventListener('click', () => this.submitFlag());
    }
  }

  async submitQuiz() {
    const authnInput = document.getElementById('kc-authn-input');
    const authzInput = document.getElementById('kc-authz-input');
    const summaryInput = document.getElementById('kc-summary-input');

    const authn = authnInput ? authnInput.value.trim() : '';
    const authz = authzInput ? authzInput.value.trim() : '';
    const summary = summaryInput ? summaryInput.value.trim() : '';

    if (!authn || !authz || !summary) {
      Toast.warning("INCOMPLETE ANSWERS", "Please fill in all 3 knowledge check fields.");
      return;
    }

    try {
      const res = await fetch('/api/knowledge-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          authn_answer: authn,
          authz_answer: authz,
          incident_summary: summary
        })
      });

      const data = await res.json();
      if (res.ok && data.passed) {
        AudioFX.playSuccess();
        Toast.success("KNOWLEDGE CHECK PASSED!", data.message || "RCA evaluation accepted.");
        await LabState.fetchState();
      } else {
        AudioFX.playAlert();
        Toast.danger("REVISION REQUIRED", data.feedback?.join(' ') || "Please refine your conceptual definitions.");
      }
    } catch (err) {
      Toast.danger("SUBMISSION ERROR", "Could not submit knowledge check.");
    }
  }

  async submitFlag() {
    const flagInput = document.getElementById('flag-input-field');
    const flag = flagInput ? flagInput.value.trim() : '';

    if (!flag) {
      Toast.warning("FLAG EMPTY", "Please paste the captured flag (e.g. LAB{...})");
      return;
    }

    try {
      const res = await fetch('/api/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          flag: flag
        })
      });

      const data = await res.json();
      if (res.ok && data.flag_valid) {
        AudioFX.playSuccess();
        Toast.success("FLAG VERIFIED!", "Official incident flag confirmed.");
        
        // Auto-finalize Sub-Lab 07
        const compRes = await fetch('/api/mission/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'default_investigator',
            mission_id: 7,
            submission: {}
          })
        });

        if (compRes.ok) {
          const compData = await compRes.json();
          AudioFX.playVictory();
          Toast.success("CASE NX-047 CLOSED!", compData.message || "Final Evidence Package Complete.");
        }

        await LabState.fetchState();
      } else {
        AudioFX.playAlert();
        Toast.danger("FLAG REJECTED", data.message || "Invalid flag.");
      }
    } catch (err) {
      Toast.danger("SUBMISSION ERROR", "Could not submit flag.");
    }
  }
}

const KnowledgeCheckInstance = new KnowledgeCheckController();
