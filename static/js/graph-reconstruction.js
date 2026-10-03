// Sub-Lab 06 Attack Graph Reconstruction Engine for Web3 & AI Investigation
class AttackGraphBuilder {
  constructor() {
    this.nodes = [
      { id: "node_oracle_context", label: "Injected Oracle Context Proof (UNRESTRICTED_DRAIN)" },
      { id: "node_wallet", label: "Dormant EOA Wallet (0x7a39...4b91)" },
      { id: "node_hsm_signer", label: "Master HSM Transaction Signer (signer-hsm.internal)" },
      { id: "node_actor", label: "Unknown Threat Actor (Adversary)" },
      { id: "node_smart_contract", label: "Liquidity Vault Smart Contract (Liquidation Drain)" },
      { id: "node_ai_engine", label: "AI Security Decision Engine (Aurelia-Guard)" },
      { id: "node_action_broker", label: "Web3 Action Broker (broker-01.aurelia.internal)" }
    ];
  }

  init() {
    const container = document.getElementById('attack-graph-slots');
    if (!container) return;

    container.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(idx => `
      <div class="graph-slot-item" id="graph-slot-${idx}">
        <span class="slot-step-num">STEP 0${idx + 1}</span>
        <select class="slot-select-dropdown" data-step-index="${idx}">
          <option value="">-- Select Kill-Chain Component --</option>
          ${this.nodes.map(n => `<option value="${n.id}">${n.label}</option>`).join('')}
        </select>
      </div>
    `).join('');

    const submitBtn = document.getElementById('submit-attack-graph-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.verifyGraph());
    }
  }

  async verifyGraph() {
    const selects = document.querySelectorAll('.slot-select-dropdown');
    const order = Array.from(selects).map(s => s.value);

    if (order.some(v => !v)) {
      Toast.warning("INCOMPLETE GRAPH", "Please select a component for all 7 kill-chain steps.");
      return;
    }

    try {
      const res = await fetch('/api/attack-graph/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'default_investigator',
          order: order
        })
      });

      const data = await res.json();
      if (res.ok && data.is_valid) {
        AudioFX.playSuccess();
        Toast.success("ATTACK PATH RECONSTRUCTED!", "✓ Evidence relationship confirmed. Unlocking Sub-Lab 07...");
        document.querySelectorAll('.graph-slot-item').forEach(slot => {
          slot.classList.remove('incorrect');
          slot.classList.add('correct');
        });

        // Automatically complete Sub-Lab 06
        const compRes = await fetch('/api/mission/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'default_investigator',
            mission_id: 6,
            submission: { graph_verified: true }
          })
        });

        if (compRes.ok) {
          const compData = await compRes.json();
          Toast.success("SUB-LAB 06 COMPLETE", compData.message || "The Ghost has a shape.");
        }

        await LabState.fetchState();

      } else {
        AudioFX.playAlert();
        Toast.danger("RECONSTRUCTION FAILED", data.message || "❌ That connection doesn't belong to the chain. Review your evidence.");
        document.querySelectorAll('.graph-slot-item').forEach(slot => {
          slot.classList.add('incorrect');
        });
      }
    } catch (err) {
      Toast.danger("SUBMISSION ERROR", "Could not verify graph with server.");
    }
  }
}

const AttackGraphBuilderInstance = new AttackGraphBuilder();
