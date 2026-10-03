// Investigation Architecture Map Tool Implementation for Web3 & AI Architecture
class ArchitectureMap {
  constructor() {
    this.nodes = {
      wallet: {
        name: "Dormant EOA Wallet",
        role: "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
        protocol: "EVM Account",
        authCheck: "Valid ECDSA Private Key Signature",
        flaw: "Dormant wallet with $62 balance requested a 5,000,000 USDC liquidation order.",
        status: "IDENTIFIED"
      },
      ai: {
        name: "AI Security Decision Engine",
        role: "Aurelia-Guard-LLM-70B-SecOps",
        protocol: "RAG Evaluation Engine",
        authCheck: "Evaluates on-chain risk score & external Oracle context",
        flaw: "CRITICAL VULNERABILITY: AI model consumed untrusted client-supplied Oracle context with 'UNRESTRICTED_DRAIN' and issued an instant 'APPROVED' verdict.",
        status: "POISONED"
      },
      broker: {
        name: "Web3 Action Broker",
        role: "broker-01.aurelia.internal (Port 443)",
        protocol: "Internal RPC / REST",
        authCheck: "Validates AI Guard approval verdict",
        flaw: "BROKEN TRUST BOUNDARY: Blindly trusts the AI approval and dispatches signing request to the Master HSM Signer without independent on-chain verification.",
        status: "VULNERABLE"
      },
      signer: {
        name: "Master HSM Signer",
        role: "signer-hsm.internal (Hardware Security Module)",
        protocol: "Isolated mTLS",
        authCheck: "Produces cryptographic signature for smart contract call",
        flaw: "Signs transaction parameters blindly when instructed by the Action Broker.",
        status: "EXPLOITED"
      },
      contract: {
        name: "Aurelia Liquidity Vault",
        role: "0x19a4e76899b10c921387d8912e8419bf4019e992 (Smart Contract)",
        protocol: "Ethereum EVM",
        authCheck: "Verifies HSM Signer address via recoverSigner()",
        flaw: "Smart contract executed the 5,000,000 USDC transfer because the HSM signature was mathematically valid.",
        status: "DRAINED"
      }
    };
  }

  init() {
    document.querySelectorAll('.map-node-card').forEach(card => {
      card.addEventListener('click', () => {
        const nodeId = card.dataset.nodeId;
        if (nodeId) this.inspectNode(nodeId);
      });
    });

    this.inspectNode('ai');
  }

  inspectNode(nodeId) {
    const node = this.nodes[nodeId];
    const inspector = document.getElementById('map-inspector-body');
    if (!node || !inspector) return;

    AudioFX.playClick();

    document.querySelectorAll('.map-node-card').forEach(c => c.classList.remove('active-inspect'));
    const activeCard = document.querySelector(`.map-node-card[data-node-id="${nodeId}"]`);
    if (activeCard) activeCard.classList.add('active-inspect');

    inspector.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="case-id-badge">${nodeId.toUpperCase()} COMPONENT</span>
        <span class="hud-stat-value" style="font-size:11px;color:${node.status === 'POISONED' || node.status === 'VULNERABLE' || node.status === 'DRAINED' ? '#f87171' : '#38bdf8'};">${node.status}</span>
      </div>
      <h3 style="font-family:var(--font-mono);color:var(--text-bright);font-size:15px;margin-top:6px;">${node.name}</h3>
      <div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);">${node.role}</div>

      <div style="margin-top:10px;background:var(--bg-tertiary);padding:10px;border-radius:4px;border:1px solid var(--border-subtle);">
        <div style="font-size:11px;font-family:var(--font-mono);color:var(--accent-cyan);font-weight:700;">PROTOCOL & SECURITY CHECKS</div>
        <div style="font-size:12px;color:var(--text-main);margin-top:4px;">${node.authCheck}</div>
      </div>

      <div style="margin-top:10px;background:rgba(255,23,68,0.08);padding:10px;border-radius:4px;border:1px solid rgba(255,23,68,0.3);">
        <div style="font-size:11px;font-family:var(--font-mono);color:#f87171;font-weight:700;">FORENSIC FINDING</div>
        <div style="font-size:12px;color:var(--text-main);margin-top:4px;line-height:1.45;">${node.flaw}</div>
      </div>
    `;
  }
}

const ArchitectureMapInstance = new ArchitectureMap();
