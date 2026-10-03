// Central Lab State & Synchronization Engine
class LabStateManager {
  constructor() {
    this.state = {
      case_id: "NX-047",
      title: "The Ghost in the Ledger",
      lab_started: true,
      lab_completed: false,
      current_mission: 1,
      elapsed_seconds: 1,
      hints_used: 0,
      missions: [],
      evidence: [],
      used_hints: []
    };
    this.timerInterval = null;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  async fetchState() {
    try {
      const res = await fetch('/api/state?session_id=default_investigator');
      if (res.ok) {
        const data = await res.json();
        // Preserve local ticking if higher
        if (data.elapsed_seconds) {
          this.state.elapsed_seconds = Math.max(this.state.elapsed_seconds, data.elapsed_seconds);
        }
        this.state = { ...this.state, ...data };
        this.notify();
        this.startTimerLoop();
      }
    } catch (err) {
      console.error("Failed to sync lab state:", err);
    }
  }

  startTimerLoop() {
    if (this.timerInterval) return;

    // Tick every second continuously
    this.timerInterval = setInterval(() => {
      if (!this.state.lab_completed) {
        this.state.elapsed_seconds = (this.state.elapsed_seconds || 0) + 1;
        this.updateTimerDisplay();
      }
    }, 1000);
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const timerElem = document.getElementById('hud-timer-val');
    if (!timerElem) return;

    const totalSec = this.state.elapsed_seconds || 1;
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');

    timerElem.textContent = `${hrs}:${mins}:${secs}`;
  }

  async startLab() {
    try {
      const res = await fetch('/api/start-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'default_investigator' })
      });
      if (res.ok) {
        await this.fetchState();
        Toast.success("INVESTIGATION LIVE", "Timer running. Team is standing by.");
      }
    } catch (err) {}
  }

  async resetLab() {
    try {
      const res = await fetch('/api/reset-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'default_investigator' })
      });
      if (res.ok) {
        this.state.elapsed_seconds = 1;
        await this.fetchState();
        Toast.warning("LAB RESET", "All progress, evidence, and timer reset to Sub-Lab 01.");
      }
    } catch (err) {
      Toast.danger("RESET FAILED", "Could not reset lab state.");
    }
  }

  async completeMission(missionId, submissionData = {}) {
    try {
      const res = await fetch('/api/mission/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          mission_id: missionId,
          submission: submissionData
        })
      });
      const data = await res.json();
      if (res.ok) {
        AudioFX.playUnlock();
        Toast.success(`SUB-LAB ${missionId} COMPLETE`, data.message || "Next sub-lab unlocked.");
        await this.fetchState();
        return { success: true, data };
      } else {
        Toast.danger("ACTION REQUIRED", data.message || "Requirements not met.");
        return { success: false, error: data.message };
      }
    } catch (err) {
      Toast.danger("COMMUNICATION ERROR", "Could not reach server validator.");
      return { success: false, error: "Network error" };
    }
  }

  async requestHint(missionId, hintIndex) {
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          mission_id: missionId,
          hint_index: hintIndex
        })
      });
      const data = await res.json();
      if (res.ok) {
        await this.fetchState();
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }
}

const LabState = new LabStateManager();
