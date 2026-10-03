# AURELIA CYBER SYSTEMS — CYBERSECURITY PRO LAB 01
## Case ID: `NX-047` — "The Ghost in the Ledger"
### *AI Security × Web3 Forensics × Blockchain Security × Smart Contracts*

---

## 🎯 Lab Overview

**The Ghost in the Ledger (Case NX-047)** is a professional, hands-on, fully functional cybersecurity training lab. It is specifically themed around **AI Security + Web3 Security + Blockchain Forensics**, focusing on how adversarial RAG context poisoning tricked an autonomous AI security guard into signing an unauthorized 5,000,000 USDC smart contract liquidation.

At **02:13:07 AM**, the Aurelia Liquidity Vault smart contract (`AureliaLiquidityVault.sol`) executed transaction `TX-2049`, transferring 5,000,000 USDC to a dormant wallet (`0x7a39...4b91`). The transaction was mathematically signed by the protocol's master HSM key and approved by the 70B parameter AI Security Guard (`Aurelia-Guard v3.4`) with a 0.94 confidence score.

As the **Junior Cyber Threat Investigator**, you join the Aurelia Incident Response team to dissect the blockchain telemetry, analyze the dormant wallet, uncover the prompt injection inside the AI's external Oracle context feed, exploit the broken trust boundary on the Web3 Action Broker API, reconstruct the full 7-step kill-chain, and contain the incident.

---

## 🧭 The 8-Part Guided Mission Structure

To ensure maximum clarity and eliminate dead ends, every single Sub-Lab strictly provides:
1. **STORY**: Cinematic incident brief with interactive character dialogue.
2. **WHAT YOU KNOW**: 3–5 verified on-chain and architectural facts.
3. **YOUR TASK**: 1 single, unambiguous directive.
4. **WHERE TO INVESTIGATE**: Explicit path with a prominent `[ 🟢 OPEN RECOMMENDED TOOL ]` button that automatically opens and focuses the target tool window.
5. **INVESTIGATION STEPS**: Step-by-step numbered instructions.
6. **WHAT YOU ARE LOOKING FOR**: Clues box highlighting key parameters, hashes, and clearance values.
7. **FORENSIC EVIDENCE CARD**: Visual proof card with backend persistence (`EV-01` to `EV-05`).
8. **SUCCESS & CONTINUATION**: Verification action button unlocking the next Sub-Lab with a clear `[ CONTINUE INVESTIGATION → ]` handoff.

---

## 📋 5 Sub-Labs + Final Challenge Structure

| Sub-Lab | Title | Focus & Objective | Recommended Tool | Evidence Acquired |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **The Whispering Transaction** | Triage the 02:13:07 AM on-chain drain, identify tx `TX-2049`, recipient wallet `0x7a39...4b91`, and AI verdict `APPROVED`. | **Transaction Console** (`http://tx.local`) | `EV-01` |
| **02** | **The Wallet That Knew Too Much** | Profile the dormant EOA wallet and discover its synthetic `liquidity_balancer_level_5` role. | **Wallet Explorer** (`http://wallet.local`) | `EV-02` |
| **03** | **The AI That Said Yes** | Uncover prompt injection / RAG context poisoning with clearance `UNRESTRICTED_DRAIN` on the AI Security Guard. | **AI Decision Console** (`http://ai.local`) | `EV-03` |
| **04** | **The Broken Trust Boundary** | Execute the exploit request with forged `X-Aurelia-Oracle-Proof` against the Web3 Action Broker API to extract the HSM signature & Flag. | **Request Composer** (`http://api.local`) | `EV-04` |
| **05** | **Reconstruct the Ghost** | Connect the 7-step sequential kill chain on the interactive Investigation Board. | **Attack Graph Builder** | `EV-05` |
| **06** | **Final Challenge & RCA** | Complete the Web3 Authentication vs Authorization RCA questionnaire and submit the verified flag. | **RCA & Flag Tab** | `EV-06` (Case Closed) |

---

## 🛠️ AttackBox Cyber Tools

1. **Cyber Browser**: Internal Web3 mesh explorer with bookmarks:
   - `⭐ tx.local` (Blockchain Transaction Console)
   - `👛 wallet.local` (Threat Intel & Wallet Explorer)
   - `🧠 ai.local` (AI Decision Engine Console & Prompt Log)
   - `⚡ api.local` (Web3 Action Broker & Signer API Spec)
   - `📜 contract.local` (Solidity Smart Contract Explorer)
2. **Cyber Terminal**: Full shell environment with commands: `trace TX-2049`, `wallet <addr>`, `cat`, `grep`, `curl`, `whoami`, `help`, and `clear`.
3. **Request Composer**: Postman / Burp Suite style HTTP request builder with a 1-click **"Load Exploit Preset"** button and live response inspector.
4. **Evidence Vault**: Real-time forensic vault organizing collected cards with status tags and cryptographic proofs.
5. **Investigation Architecture Map**: Interactive node-flow diagram showing the zero-trust mesh and trust boundaries.
6. **Attack Graph Builder**: 7-step kill-chain reconstruction board with real-time feedback.

---

## 🚀 Running Locally

```bash
# 1. Start the local server
python run.py

# 2. Open your browser
http://127.0.0.1:5050/
```

- **Instructor PIN**: `NX047_INSTRUCTOR_2026`
- **Official Captured Flag**: `LAB{ai_context_poisoned_smart_contract_drained_nx047}`

---

## 🧪 Automated Testing

To run the complete end-to-end automated test suite:
```bash
python -m unittest tests/test_lab_flow.py
```
*All 5 integration tests validate timer persistence, tool sandboxing, exploit execution, graph validation, and anti-cheat constraints.*
