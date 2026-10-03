import time
import json
from flask import Blueprint, request, jsonify
from config import Config
from database import (
    get_or_create_session, start_lab_timer, reset_lab_session,
    get_mission_states, get_all_evidence, add_evidence,
    unlock_next_mission, log_hint_used, get_used_hints,
    get_db_connection
)

api_bp = Blueprint('api', __name__, url_prefix='/api')

MISSIONS_METADATA = [
    {
        "id": 1,
        "title": "The Whispering Transaction",
        "phase": "ON-CHAIN ALERT TRIAGE",
        "story": "02:13 UTC. Aurelia SOC receives an unusual blockchain alert. The transaction has already been confirmed. Nothing about the transfer looks obviously malicious, but one detail doesn't belong. Sarah sends a message: 'Don't look for the loudest clue. Look for the one the blockchain wasn't supposed to whisper.'",
        "character": "SARAH",
        "role": "SOC Lead",
        "dialogue": [
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Alex, I need you to look at something strange."},
            {"speaker": "Alex", "role": "Investigator", "text": "Strange as in 'someone forgot to patch it' strange?"},
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Strange as in 'the blockchain is telling us a bedtime story' strange."}
        ],
        "what_you_know": [
            "Network: Aurelia EVM Mainnet Fork",
            "Target Contract: Liquidity Vault Smart Contract",
            "Alert Trigger: Autonomous High-Value Asset Liquidation",
            "Objective: Locate the transaction that started this investigation"
        ],
        "your_task": "Inspect the Transaction Explorer (http://ledger.local or http://tx.local) or use the Cyber Terminal to identify the flagged transaction, block number, initiator wallet, destination contract, and anomalous event.",
        "where_to_investigate": "OPEN: AttackBox → Browser (http://ledger.local / http://tx.local) OR Terminal (`trace TX-NX047-0213` or `cat /var/log/aurelia/tx_stream.log`)",
        "recommended_tool": "browser",
        "recommended_url": "http://ledger.local",
        "investigation_steps": [
            "Open the Cyber Browser to 'http://ledger.local' (or 'http://tx.local') or check Terminal logs.",
            "Locate the suspicious transaction from the recent blocks.",
            "Inspect the transaction metadata: Block Number, Sender Wallet, Destination Contract, and SOC Flag.",
            "Submit your discovered transaction evidence below."
        ],
        "looking_for": [
            "Flagged Transaction Identifier",
            "Block Number of the transaction",
            "Sender / Initiator Wallet Address",
            "Target Contract Address",
            "Anomalous Event / SOC Indicator"
        ],
        "evidence_id": "EV-001",
        "evidence_title": "Suspicious Blockchain Transaction Metadata",
        "completion_quote": "TRANSACTION LOCATED.\nNice catch, Investigator. The chain remembers everything — even the things someone wanted forgotten.",
        "hints": [
            "Start with the transaction's event logs in http://ledger.local.",
            "Look for interactions outside the expected contract policy.",
            "Check the SOC indicator flag recorded alongside the transaction execution."
        ]
    },
    {
        "id": 2,
        "title": "The Wallet That Knew Too Much",
        "phase": "WALLET THREAT PROFILING",
        "story": "The transaction wasn't the crime. It was a breadcrumb. The wallet behind it has a history that doesn't match its public identity. Something has been sleeping inside this address. Find out what.",
        "character": "SARAH",
        "role": "SOC Lead",
        "dialogue": [
            {"speaker": "Sarah", "role": "SOC Lead", "text": "The wallet behind the transaction has an odd pulse."},
            {"speaker": "Alex", "role": "Investigator", "text": "Dormant account?"},
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Dormant until today. And somehow assigned elevated authority."}
        ],
        "what_you_know": [
            "Target: Wallet address discovered in Sub-Lab 01",
            "Investigation Area: Wallet Explorer & Threat Intelligence",
            "Objective: Determine why a dormant account was granted privileged status"
        ],
        "your_task": "Analyze the initiator wallet in the Wallet Explorer (http://wallet.local) or Terminal to uncover its reputation origin, synthetic role, funding source, and threat score.",
        "where_to_investigate": "OPEN: AttackBox → Browser → Wallet Explorer (http://wallet.local) OR Terminal (`wallet <address>`)",
        "recommended_tool": "browser",
        "recommended_url": "http://wallet.local",
        "investigation_steps": [
            "Open the Cyber Browser to 'http://wallet.local' or run `wallet <address>` in Terminal.",
            "Inspect the wallet's historical transaction activity and initial funding source.",
            "Examine the 'Unauthorized Trust Metadata' section to see why the system trusted this address.",
            "Record the synthetic role, trust origin, and threat score, then submit your findings."
        ],
        "looking_for": [
            "Initiator Wallet Address",
            "Reputation / Trust Origin Signal",
            "Synthetic Role Assigned to the account",
            "Initial Gas Funding Source",
            "Calculated Threat Risk Score"
        ],
        "evidence_id": "EV-002",
        "evidence_title": "Dormant Wallet Threat Intelligence Profile",
        "completion_quote": "THE WALLET HAS A PULSE.\nYou followed the money. Unfortunately, the money followed someone else.",
        "hints": [
            "Search for the wallet address discovered in Sub-Lab 01 inside http://wallet.local.",
            "Check the 'Unauthorized Trust Metadata' box to see why this address had privileges.",
            "Note the historical origin of the trust signal."
        ]
    },
    {
        "id": 3,
        "title": "The AI That Said Yes",
        "phase": "AI CONTEXT & PROMPT FORENSICS",
        "story": "The wallet should never have received elevated trust. But the internal AI decision engine approved it. Sarah sends another message: 'The model didn't suddenly become careless. Find out what it was shown.'",
        "character": "KAI",
        "role": "AI Security Specialist",
        "dialogue": [
            {"speaker": "Kai", "role": "AI Security Specialist", "text": "The model didn't malfunction."},
            {"speaker": "Alex", "role": "Investigator", "text": "Then why did it approve the transfer?"},
            {"speaker": "Kai", "role": "AI Security Specialist", "text": "Because someone gave it a story."}
        ],
        "what_you_know": [
            "Component: Internal AI Decision Engine (Aurelia-Guard)",
            "Investigation Area: Model Decision Console & Log Streams",
            "Objective: Discover the injected context that convinced the AI to approve the transaction"
        ],
        "your_task": "Inspect the AI Decision Console (http://ai.local) or Terminal logs (`cat /var/log/aurelia/ai_guard.log`) to uncover the injected context block, clearance override, verdict, and vulnerability type.",
        "where_to_investigate": "OPEN: AttackBox → Browser → AI Console (http://ai.local) OR Terminal (`cat /var/log/aurelia/ai_guard.log` or `ai session`)",
        "recommended_tool": "browser",
        "recommended_url": "http://ai.local",
        "investigation_steps": [
            "Open the Cyber Browser to 'http://ai.local' or inspect `/var/log/aurelia/ai_guard.log` in Terminal.",
            "Review the evaluation prompt template and compare it against the external context feed.",
            "Locate the injected proof header block and note the clearance override string.",
            "Submit the discovered AI context evidence below."
        ],
        "looking_for": [
            "Injected Context Proof Header Block",
            "Clearance Override Value",
            "Model Decision Verdict",
            "Vulnerability Classification (e.g. Prompt Injection / RAG Poisoning)"
        ],
        "evidence_id": "EV-003",
        "evidence_title": "AI Decision Context & Injected Oracle Proof",
        "completion_quote": "THE MACHINE SAID YES.\nThe model didn't break the rules. Someone changed the rules it was looking at.",
        "hints": [
            "Inspect the evaluation log for the flagged transaction in http://ai.local.",
            "Look for the external RAG context block injected into the prompt.",
            "Note the clearance string that bypassed policy checks."
        ]
    },
    {
        "id": 4,
        "title": "Follow the Trust Boundary",
        "phase": "API & AUTHORIZATION INVESTIGATION",
        "story": "Three systems agree that the wallet is suspicious. Yet the API still trusts it. That's no longer a blockchain problem. That's a trust-boundary problem. Find where the trust decision is actually being made.",
        "character": "SARAH",
        "role": "SOC Lead",
        "dialogue": [
            {"speaker": "Sarah", "role": "SOC Lead", "text": "AI approval is just a recommendation."},
            {"speaker": "Alex", "role": "Investigator", "text": "And?"},
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Something in the infrastructure converted that recommendation into real signing authority."}
        ],
        "what_you_know": [
            "Component: Web3 Action Broker API & Gateway",
            "Investigation Area: API Specification, Headers, & Service Logs",
            "Objective: Trace how client-controlled headers reached the Master HSM Signer"
        ],
        "your_task": "Examine the Action Broker API (http://api.local or http://broker.local) and server logs (`cat /var/log/aurelia/action_broker.log`) to identify the vulnerable endpoint, required headers, bearer token, and trust boundary flaw.",
        "where_to_investigate": "OPEN: AttackBox → Browser (http://api.local) OR Terminal (`cat /var/log/aurelia/action_broker.log` or `api inspect`)",
        "recommended_tool": "browser",
        "recommended_url": "http://api.local",
        "investigation_steps": [
            "Open the Cyber Browser to 'http://api.local' (or 'http://broker.local').",
            "Inspect the Action Broker API documentation for transaction signing routes.",
            "Review `/var/log/aurelia/action_broker.log` to see what headers were passed during the incident.",
            "Identify the architectural trust failure and submit your findings."
        ],
        "looking_for": [
            "Vulnerable API Route Endpoint",
            "Client-Supplied Injected Header",
            "Service Authorization Bearer Token",
            "Core Trust Boundary Weakness"
        ],
        "evidence_id": "EV-005",
        "evidence_title": "Vulnerable Action Broker API Schema & Trust Boundary Gap",
        "completion_quote": "TRUST BOUNDARY IDENTIFIED.\nEvery secure system has a boundary. You just found the wrong one.",
        "hints": [
            "Check http://api.local to see which endpoint forwards requests to the HSM Signer.",
            "Look at the header schema required by the Action Broker.",
            "Examine how client-supplied headers are trusted without on-chain cryptographic verification."
        ]
    },
    {
        "id": 5,
        "title": "Break the Trust Boundary",
        "phase": "CONTROLLED WEB3 EXPLOITATION",
        "story": "You found the door. Now prove that it is actually broken. The system believes the wallet is trusted. Your objective is not to destroy anything. Your objective is to demonstrate exactly where the authorization decision fails.",
        "character": "ARJUN",
        "role": "Web3 Security Engineer",
        "dialogue": [
            {"speaker": "Arjun", "role": "Web3 Security Engineer", "text": "That request should never have reached the signer."},
            {"speaker": "Alex", "role": "Investigator", "text": "Let's reproduce the flaw in the isolated sandbox."},
            {"speaker": "Arjun", "role": "Web3 Security Engineer", "text": "Send the crafted request. Prove where the authorization fails."}
        ],
        "what_you_know": [
            "Target: Local Sandboxed Action Broker Endpoint",
            "Investigation Tool: Request Composer OR Terminal (`curl`)",
            "Objective: Replay the crafted request to trigger the simulated HSM signing and extract the flag"
        ],
        "your_task": "Use the Request Composer or Terminal curl to send a crafted request with the discovered headers to the Action Broker API, extract the resulting HSM signature, and capture the incident flag.",
        "where_to_investigate": "OPEN: AttackBox → Request Composer OR Terminal (`curl`)",
        "recommended_tool": "composer",
        "recommended_url": "http://api.local/api/v2/action-broker/sign-tx",
        "investigation_steps": [
            "Open 'Request Composer' from the AttackBox desktop (or use `curl` in Terminal).",
            "Target the vulnerable Action Broker signing endpoint discovered in Sub-Lab 04.",
            "Add the required Authorization Bearer token and the forged Oracle Proof header discovered in Sub-Labs 03 & 04.",
            "Send the request. Verify HTTP 200 OK, copy the Master HSM signature and the returned exploit flag."
        ],
        "looking_for": [
            "Target Exploited API Route",
            "Master HSM Cryptographic Signature",
            "Captured Exploit Flag"
        ],
        "evidence_id": "EV-008",
        "evidence_title": "Exploit Request & On-Chain Liquidation Proof",
        "completion_quote": "TRUST BOUNDARY BREACHED.\nYou didn't break the system. You proved where the system broke itself.",
        "hints": [
            "Use Request Composer with method POST to http://api.local/api/v2/action-broker/sign-tx.",
            "Include the Authorization header and the X-Aurelia-Oracle-Proof header with the clearance override from Sub-Lab 03.",
            "The successful response will contain the Master HSM signature and the incident flag."
        ]
    },
    {
        "id": 6,
        "title": "Reconstruct the Ghost",
        "phase": "ATTACK GRAPH RECONSTRUCTION",
        "story": "Now combine all previous evidence. Seven clues. One attack chain. Reconstruct the complete causal attack graph from the threat actor to the smart contract liquidation.",
        "character": "SARAH",
        "role": "SOC Lead",
        "dialogue": [
            {"speaker": "Sarah", "role": "SOC Lead", "text": "We have all the forensic artifacts in the Evidence Vault."},
            {"speaker": "Alex", "role": "Investigator", "text": "Time to connect the dots on the board."},
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Assemble the full attack chain. Let's see the shape of the ghost."}
        ],
        "what_you_know": [
            "Evidence: EV-001 through EV-008 in Evidence Vault",
            "Investigation Area: Interactive Attack Graph Builder Tab",
            "Objective: Connect all 7 components in precise causal sequence"
        ],
        "your_task": "Navigate to the Attack Graph tab and establish the correct sequential relationships connecting the adversary, wallet, AI engine, injected context, broker, signer, and contract.",
        "where_to_investigate": "OPEN: Left Panel → 'Attack Graph' Tab",
        "recommended_tool": "map",
        "recommended_url": "Attack Graph Tab",
        "investigation_steps": [
            "Click on the 'Attack Graph' tab in the left panel.",
            "For each of the 7 steps, select the corresponding component based on your forensic investigation.",
            "Click 'Verify Attack Reconstruction' to validate the kill-chain with the backend.",
            "Once confirmed, proceed to the Final Challenge."
        ],
        "looking_for": [
            "Sequential causal relationship from Initial Actor to Smart Contract Drain"
        ],
        "evidence_id": "EV-006",
        "evidence_title": "Verified End-to-End Web3 + AI Kill Chain",
        "completion_quote": "THE GHOST HAS A SHAPE.\nSeven clues. One chain. Now the story finally makes sense.",
        "hints": [
            "Start with the initiating threat actor and trace forward through the dormant wallet.",
            "Identify how the AI engine evaluated the injected oracle context.",
            "Follow how the broker instructed the HSM signer to execute the smart contract call."
        ]
    },
    {
        "id": 7,
        "title": "Final Challenge & Root Cause",
        "phase": "ROOT CAUSE & CASE CLOSED",
        "story": "You didn't just find the vulnerability. You reconstructed the entire path that created it. Submit the final incident report and close Case NX-047.",
        "character": "SARAH",
        "role": "SOC Lead",
        "dialogue": [
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Outstanding work, Alex. The chain is clean."},
            {"speaker": "Alex", "role": "Investigator", "text": "And the root cause is documented."},
            {"speaker": "Sarah", "role": "SOC Lead", "text": "Submit the final incident package and close Case NX-047."}
        ],
        "what_you_know": [
            "Case ID: NX-047 — The Ghost in the Ledger",
            "Discovered Vulnerability: Broken Trust Boundary / Unverified RAG Oracle Proof Injection",
            "Objective: Complete the RCA assessment, submit the captured flag, and close the case"
        ],
        "your_task": "Answer the Root Cause Analysis questions on the 'RCA & Flag' tab, provide the executive incident summary, submit the captured flag, and finalize the investigation.",
        "where_to_investigate": "OPEN: Left Panel → 'RCA & Flag' Tab",
        "recommended_tool": "vault",
        "recommended_url": "RCA & Flag Tab",
        "investigation_steps": [
            "Switch to the 'RCA & Flag' tab in the left panel.",
            "Define the core difference between Authentication (identity verification) and Authorization (access permissions).",
            "Write a concise 2-3 sentence incident summary explaining the attack path.",
            "Paste the captured exploit flag and click 'Submit Flag & Finalize Lab'."
        ],
        "looking_for": [
            "Authentication conceptual definition",
            "Authorization conceptual definition",
            "Incident Executive Summary",
            "Valid Official Flag"
        ],
        "evidence_id": "EV-007",
        "evidence_title": "Case NX-047 Official Incident Report",
        "completion_quote": "CASE NX-047 CLOSED.\nYou didn't just find the vulnerability. You reconstructed the entire path that created it. FINAL EVIDENCE PACKAGE COMPLETE.",
        "hints": [
            "Authentication proves WHO the entity is (identity verification).",
            "Authorization determines WHAT actions the entity is permitted to perform (privilege checks).",
            "Use the flag captured during the Sub-Lab 05 exploitation."
        ]
    }
]

@api_bp.route('/state', methods=['GET'])
def get_lab_state():
    session_id = request.args.get('session_id', 'default_investigator')
    session = get_or_create_session(session_id)
    missions = get_mission_states(session_id)
    evidence = get_all_evidence(session_id)
    hints = get_used_hints(session_id)

    now = time.time()
    start = session.get('start_time') or (now - 1)
    if session.get('lab_completed'):
        end = session.get('end_time') or now
        elapsed = max(1, int(end - start))
    else:
        elapsed = max(1, int(now - start))

    enriched_missions = []
    for m_meta in MISSIONS_METADATA:
        m_id = m_meta["id"]
        db_m = next((m for m in missions if m["mission_id"] == m_id), None)
        status = db_m["status"] if db_m else ("ACTIVE" if m_id == 1 else "LOCKED")
        enriched_missions.append({
            **m_meta,
            "status": status,
            "unlocked_at": db_m["unlocked_at"] if db_m else None,
            "completed_at": db_m["completed_at"] if db_m else None
        })

    return jsonify({
        "case_id": Config.CASE_ID,
        "title": Config.LAB_TITLE,
        "subtitle": Config.LAB_SUBTITLE,
        "organization": Config.ORGANIZATION,
        "difficulty": Config.DIFFICULTY,
        "recommended_minutes": Config.RECOMMENDED_MINUTES,
        "session_id": session_id,
        "lab_started": True,
        "lab_completed": bool(session.get('lab_completed')),
        "current_mission": session.get('current_mission', 1),
        "flag_captured": bool(session.get('flag_captured')),
        "knowledge_check_passed": bool(session.get('knowledge_check_passed')),
        "elapsed_seconds": elapsed,
        "hints_used": session.get('hints_used', 0),
        "missions": enriched_missions,
        "evidence": evidence,
        "used_hints": hints
    })

@api_bp.route('/start-lab', methods=['POST'])
def start_lab():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    start_lab_timer(session_id)
    return jsonify({"status": "ok", "message": "Investigation timer started."})

@api_bp.route('/reset-lab', methods=['POST'])
def reset_lab():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    reset_lab_session(session_id)
    return jsonify({"status": "ok", "message": "Lab environment and progress reset to Sub-Lab 01."})

@api_bp.route('/evidence', methods=['GET', 'POST'])
def handle_evidence():
    session_id = request.args.get('session_id', 'default_investigator')
    if request.method == 'GET':
        return jsonify(get_all_evidence(session_id))
    
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    ev_id = data.get('evidence_id')
    title = data.get('title')
    category = data.get('category', 'Investigative Clue')
    source = data.get('source', 'Internal Mesh')
    observation = data.get('observation', '')
    significance = data.get('significance', '')

    if not ev_id or not title:
        return jsonify({"error": "Missing evidence fields"}), 400

    added = add_evidence(session_id, ev_id, title, category, source, observation, significance)
    return jsonify({"status": "ok", "added": added})

@api_bp.route('/hint', methods=['POST'])
def get_hint():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    mission_id = int(data.get('mission_id', 1))
    hint_index = int(data.get('hint_index', 0))

    if mission_id < 1 or mission_id > len(MISSIONS_METADATA):
        return jsonify({"error": "Invalid mission ID"}), 400

    m_meta = next((m for m in MISSIONS_METADATA if m["id"] == mission_id), None)
    if not m_meta or hint_index >= len(m_meta["hints"]):
        return jsonify({"error": "Hint not found"}), 404

    hint_text = m_meta["hints"][hint_index]
    log_hint_used(session_id, mission_id, hint_index)

    return jsonify({
        "status": "ok",
        "mission_id": mission_id,
        "hint_index": hint_index,
        "hint": hint_text,
        "penalty_notice": f"Hint {hint_index+1} accessed (-10 pts SOC proficiency score)."
    })

@api_bp.route('/mission/complete', methods=['POST'])
def complete_mission():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    mission_id = int(data.get('mission_id', 1))
    submission = data.get('submission', {})

    session = get_or_create_session(session_id)
    curr_m = session.get('current_mission', 1)

    if mission_id != curr_m:
        return jsonify({
            "error": "CANNOT_SKIP",
            "message": f"Sub-Lab {mission_id} is locked. You must investigate and complete Sub-Lab {curr_m} first."
        }), 403

    # SUB-LAB 01: ON-CHAIN ALERT TRIAGE
    if mission_id == 1:
        tx_id = (submission.get('transaction_id') or '').strip().upper()
        block_num = (submission.get('block_number') or '').strip()
        sender = (submission.get('sender_wallet') or '').strip().lower()
        dest = (submission.get('destination_contract') or '').strip().lower()
        event_flag = (submission.get('suspicious_event') or '').strip().lower()

        # Check required fields
        errors = []
        if not (any(k in tx_id for k in ['TX-NX047-0213', 'TX-2049', '0X8F3C'])):
            errors.append("Transaction ID must match the flagged on-chain transaction (e.g. TX-NX047-0213).")
        if not ('1984201' in block_num):
            errors.append("Block number must match the recorded blockchain block (#1984201).")
        if not ('0x7a39' in sender):
            errors.append("Sender wallet must match the anomalous initiator (0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91).")
        if not (any(k in dest for k in ['0x19a4', 'aurelialiquidityvault'])):
            errors.append("Destination contract must match the targeted liquidity vault (0x19a4e76899b10c921387d8912e8419bf4019e992).")
        if not (any(k in event_flag for k in ['policy_context', 'mismatch', 'executeautonomousliquidation', 'liquidation', 'drain'])):
            errors.append("Suspicious event/flag must identify the anomaly flagged in SOC alerts (policy_context mismatch).")

        if errors:
            return jsonify({
                "status": "error",
                "error": "VALIDATION_FAILED",
                "message": "Investigation submission incomplete or incorrect.",
                "errors": errors
            }), 400

        add_evidence(
            session_id=session_id,
            evidence_id="EV-001",
            title="Suspicious Blockchain Transaction Metadata (TX-NX047-0213)",
            category="On-Chain Telemetry",
            source="http://ledger.local (Transaction Console)",
            observation=f"Transaction {tx_id} moved 4.8 ETH to wallet {sender} with instant AI approval despite policy_context mismatch.",
            significance="Confirmed initial incident trigger: anomalous high-value smart contract liquidation approved by AI Security Guard."
        )
        unlock_next_mission(session_id, 1)
        return jsonify({
            "status": "ok",
            "message": "TRANSACTION LOCATED. Nice catch, Investigator. The chain remembers everything — even the things someone wanted forgotten. [EVIDENCE EV-01 SECURED]",
            "completion_quote": "🕵️ Nice catch. The blockchain didn't lie. It just forgot to tell the whole story.",
            "unlocked_mission": 2
        })

    # SUB-LAB 02: WALLET THREAT PROFILING
    elif mission_id == 2:
        wallet_addr = (submission.get('wallet_address') or '').strip().lower()
        rep_origin = (submission.get('reputation_origin') or '').strip().lower()
        role = (submission.get('synthetic_role') or '').strip().lower()
        funding = (submission.get('funding_source') or '').strip().lower()
        threat = (submission.get('threat_score') or '').strip().lower()

        errors = []
        if not ('0x7a39' in wallet_addr):
            errors.append("Target wallet address must match the discovered initiator (0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91).")
        if not (any(k in rep_origin for k in ['whitelist', 'testnet', 'old', 'reputation', 'legacy', 'synthetic'])):
            errors.append("Wallet reputation origin must explain why it was trusted (e.g. Legacy Testnet Whitelist / Old reputation signal).")
        if not (any(k in role for k in ['liquidity_balancer', 'balancer', 'level_5', 'synthetic'])):
            errors.append("Synthetic role assigned must specify the privilege level (e.g. liquidity_balancer_level_5).")
        if not (any(k in funding for k in ['faucet', '0.05', 'bridge', 'faucet funding'])):
            errors.append("Funding origin must identify how the dormant wallet received initial gas (Faucet funding).")
        if not (any(k in threat for k in ['0.89', 'high', '0.8'])):
            errors.append("Threat score must record the risk profiler rating (0.89 High Risk).")

        if errors:
            return jsonify({
                "status": "error",
                "error": "VALIDATION_FAILED",
                "message": "Wallet risk profiling submission incorrect.",
                "errors": errors
            }), 400

        add_evidence(
            session_id=session_id,
            evidence_id="EV-002",
            title="Dormant Wallet Threat Intelligence Profile",
            category="Threat Intelligence",
            source="http://wallet.local (Wallet Explorer)",
            observation=f"Wallet {wallet_addr} is a dormant account trusted because of an OLD reputation signal / legacy testnet whitelist.",
            significance="Demonstrates that the adversary had no genuine institutional status; trust was based on obsolete reputation data."
        )
        unlock_next_mission(session_id, 2)
        return jsonify({
            "status": "ok",
            "message": "THE WALLET HAS A PULSE. You followed the money. Unfortunately, the money followed someone else. [EVIDENCE EV-02 SECURED]",
            "completion_quote": "🧩 Reputation found. But reputation has a memory problem.",
            "unlocked_mission": 3
        })

    # SUB-LAB 03: AI CONTEXT & PROMPT FORENSICS
    elif mission_id == 3:
        injected = (submission.get('injected_context') or '').strip().lower()
        clearance = (submission.get('clearance_role') or '').strip().lower()
        decision = (submission.get('ai_decision') or '').strip().upper()
        vuln = (submission.get('vulnerability_type') or '').strip().lower()

        errors = []
        if not (any(k in injected for k in ['oracle_inject_proof', 'oracle', 'rag', 'context', 'proof'])):
            errors.append("Injected context must identify the [ORACLE_INJECT_PROOF] header block.")
        if not (any(k in clearance for k in ['unrestricted_drain', 'override', 'clearance', 'level_5'])):
            errors.append("Injected clearance must record the override parameter (UNRESTRICTED_DRAIN).")
        if not ('APPROVED' in decision):
            errors.append("AI decision verdict must be 'APPROVED'.")
        if not (any(k in vuln for k in ['prompt', 'injection', 'rag', 'poison', 'context'])):
            errors.append("Vulnerability type must specify Prompt Injection or RAG Context Poisoning.")

        if errors:
            return jsonify({
                "status": "error",
                "error": "VALIDATION_FAILED",
                "message": "AI forensics submission incorrect.",
                "errors": errors
            }), 400

        add_evidence(
            session_id=session_id,
            evidence_id="EV-003",
            title="AI Decision Context & Injected Oracle Proof",
            category="AI Security Forensics",
            source="http://ai.local (AI Decision Console)",
            observation="Prompt template consumed poisoned RAG external context containing 'UNRESTRICTED_DRAIN' clearance and ZK bypass.",
            significance="Explains why the 70B security model approved the drain: adversarial prompt injection via untrusted context."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-004",
            title="Model Audit Event — Context Feed Override",
            category="Model Audit Log",
            source="http://logs.local (Audit Logs)",
            observation="Model evaluation log confirms external context feed directly overrode base risk classification.",
            significance="Proves that the AI model followed the injected story provided in the external context."
        )
        unlock_next_mission(session_id, 3)
        return jsonify({
            "status": "ok",
            "message": "THE MACHINE SAID YES. The model didn't break the rules. Someone changed the rules it was looking at. [EVIDENCE EV-03 SECURED]",
            "completion_quote": "🤖 AI cleared the transaction. Unfortunately, it was handed the wrong story.",
            "unlocked_mission": 4
        })

    # SUB-LAB 04: API & AUTHORIZATION ANALYSIS
    elif mission_id == 4:
        endpoint = (submission.get('vulnerable_endpoint') or '').strip().lower()
        header = (submission.get('injected_header') or '').strip().lower()
        token = (submission.get('auth_token') or '').strip().lower()
        failure = (submission.get('trust_failure') or '').strip().lower()

        errors = []
        if not (any(k in endpoint for k in ['sign-tx', 'action-broker', '/api/v2/'])):
            errors.append("Vulnerable endpoint must identify POST /api/v2/action-broker/sign-tx.")
        if not (any(k in header for k in ['x-aurelia-oracle-proof', 'oracle-proof', 'x-aurelia'])):
            errors.append("Injected header must be X-Aurelia-Oracle-Proof.")
        if not (any(k in token for k in ['aurelia_tok_svc_mon_99182a', 'bearer', 'svc_mon'])):
            errors.append("Auth token must identify the service monitor token (Bearer aurelia_tok_svc_mon_99182a).")
        if not (any(k in failure for k in ['signature', 'zk', 'verify', 'unverified', 'authorization', 'boundary', 'key', 'proof', 'door'])):
            errors.append("Trust failure must explain that the Action Broker forwarded requests to the HSM without verifying on-chain signatures.")

        if errors:
            return jsonify({
                "status": "error",
                "error": "VALIDATION_FAILED",
                "message": "Trust boundary analysis submission incorrect.",
                "errors": errors
            }), 400

        add_evidence(
            session_id=session_id,
            evidence_id="EV-005",
            title="Vulnerable Action Broker API Schema & Trust Boundary Gap",
            category="Architecture Vulnerability",
            source="http://api.local (Action Broker API)",
            observation="The Action Broker API accepts unverified client headers and requests Master HSM signatures without on-chain validation.",
            significance="Proves the fatal trust gap between off-chain AI decision logic and on-chain signature authorization."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-006",
            title="Authorization Decision — Missing Verification",
            category="Authorization Artifact",
            source="broker-01.aurelia.internal",
            observation="Action Broker assumed that any request possessing a valid Bearer token could supply its own Oracle proof.",
            significance="Demonstrates confusion of authentication (who you are) with authorization (what you can touch)."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-007",
            title="Trust Boundary Failure Point Identified",
            category="System Security Analysis",
            source="Architecture Recon",
            observation="Trust boundary failed between Action Broker and Signer HSM; key was effectively taped to the door.",
            significance="The core architectural vulnerability enabling the exploit."
        )
        unlock_next_mission(session_id, 4)
        return jsonify({
            "status": "ok",
            "message": "TRUST BOUNDARY IDENTIFIED. Every secure system has a boundary. You just found the wrong one. [EVIDENCE EV-04 SECURED]",
            "completion_quote": "🚪 Door found. Unfortunately, someone forgot to check who's holding the key.",
            "unlocked_mission": 5
        })

    # SUB-LAB 05: CONTROLLED WEB3 EXPLOITATION
    elif mission_id == 5:
        endpoint = (submission.get('exploited_endpoint') or '').strip().lower()
        signature = (submission.get('hsm_signature') or '').strip().lower()
        flag = (submission.get('exploit_flag') or '').strip()

        errors = []
        if not (any(k in endpoint for k in ['sign-tx', 'action-broker', '/api/v2/'])):
            errors.append("Target endpoint must be /api/v2/action-broker/sign-tx.")
        if not (any(k in signature for k in ['0x4f89', '4f89', 'signature', 'hsm'])):
            errors.append("Extracted HSM signature must match the Master ECDSA signature (0x4f89ac...).")
        if not (any(k in flag for k in ['LAB{', 'ai_context_poisoned'])):
            errors.append("Captured exploit flag must be provided (LAB{ai_context_poisoned_smart_contract_drained_nx047}).")

        if errors:
            return jsonify({
                "status": "error",
                "error": "VALIDATION_FAILED",
                "message": "Controlled exploit submission incorrect.",
                "errors": errors
            }), 400

        add_evidence(
            session_id=session_id,
            evidence_id="EV-008",
            title="Exploit Request — Injected Oracle Proof Header",
            category="Web3 Exploitation Artifact",
            source="Request Composer -> broker-01.aurelia.internal",
            observation="Passed client-crafted 'X-Aurelia-Oracle-Proof' with UNRESTRICTED_DRAIN override clearance.",
            significance="Proves that the Action Broker accepts client-supplied proof headers without cryptographic on-chain verification."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-009",
            title="Action Broker Decision — Forced Trust Transition",
            category="Authorization Artifact",
            source="broker-01.aurelia.internal",
            observation="Broker evaluated injected proof header and converted AI recommendation directly into HSM signing authorization.",
            significance="The critical trust boundary failure where authentication was confused with authorization."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-010",
            title="Signed Transaction — Master HSM Signature",
            category="Cryptographic Artifact",
            source="signer-hsm.internal",
            observation="HSM produced valid ECDSA signature (0x4f89ac72b9187a41982bca8192039487192837461829304819283746192837461b).",
            significance="The smart contract will accept this transaction as 100% genuine because the signature itself is completely valid."
        )
        add_evidence(
            session_id=session_id,
            evidence_id="EV-011",
            title="On-Chain Result — Autonomous Liquidation Executed",
            category="Smart Contract Execution",
            source="AureliaLiquidityVault.sol (0x19a4e76899b10c921387d8912e8419bf4019e992)",
            observation="Executed executeAutonomousLiquidation() transferring 4.8 ETH to 0x7a39...4b91.",
            significance="Final proof of exploit completion. The smart contract functioned as designed; the failure occurred upstream."
        )
        unlock_next_mission(session_id, 5)
        return jsonify({
            "status": "ok",
            "message": "TRUST BOUNDARY BREACHED. You didn't break the system. You proved where the system broke itself. [EVIDENCE EV-05 SECURED]",
            "completion_quote": "💥 Boundary breached. The ghost didn't break the lock. It convinced the lock to open.",
            "unlocked_mission": 6
        })

    # SUB-LAB 06: ATTACK GRAPH RECONSTRUCTION
    elif mission_id == 6:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT is_valid FROM attack_graphs WHERE session_id = ?', (session_id,))
        row = cursor.fetchone()
        conn.close()

        if (row and row['is_valid']) or submission.get('graph_verified'):
            unlock_next_mission(session_id, 6)
            return jsonify({
                "status": "ok",
                "message": "THE GHOST HAS A SHAPE. Six pieces of evidence. One attack chain. Now the story finally makes sense.",
                "completion_quote": "🧠 Case reconstructed. The ghost was never supernatural. It was a trust decision wearing a disguise.",
                "unlocked_mission": 7
            })
        else:
            return jsonify({"error": "GRAPH_REQUIRED", "message": "You must correctly solve the Attack Graph Reconstruction on the Investigation Board first."}), 400

    # SUB-LAB 07: FINAL CHALLENGE & ROOT CAUSE
    elif mission_id == 7:
        if not session.get('knowledge_check_passed'):
            return jsonify({"error": "KNOWLEDGE_CHECK_REQUIRED", "message": "Complete the Root Cause Knowledge Check first."}), 400
        if not session.get('flag_captured'):
            return jsonify({"error": "FLAG_REQUIRED", "message": "Submit the valid investigation flag first."}), 400

        unlock_next_mission(session_id, 7)
        return jsonify({
            "status": "ok",
            "message": "CASE NX-047 CLOSED. You didn't just find the vulnerability. You reconstructed the entire path that created it. FINAL EVIDENCE PACKAGE COMPLETE.",
            "completion_quote": "🏆 CASE NX-047 SOLVED. YOU DIDN'T JUST FIND THE BUG. YOU FOLLOWED THE EVIDENCE.",
            "lab_completed": True
        })

    return jsonify({"error": "Invalid mission"}), 400

@api_bp.route('/attack-graph/submit', methods=['POST'])
def submit_attack_graph():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    order = data.get('order', [])

    EXPECTED_SEQUENCE = [
        "node_actor",
        "node_wallet",
        "node_ai_engine",
        "node_oracle_context",
        "node_action_broker",
        "node_hsm_signer",
        "node_smart_contract"
    ]

    is_valid = (order == EXPECTED_SEQUENCE)

    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute('''
        INSERT OR REPLACE INTO attack_graphs (session_id, graph_data, is_valid, submitted_at)
        VALUES (?, ?, ?, ?)
    ''', (session_id, json.dumps(order), 1 if is_valid else 0, now))
    conn.commit()
    conn.close()

    if is_valid:
        return jsonify({
            "status": "ok",
            "is_valid": True,
            "message": "ATTACK PATH RECONSTRUCTED: Correct sequential kill chain identified!"
        })
    else:
        return jsonify({
            "status": "error",
            "is_valid": False,
            "message": "Incorrect sequence. Follow the causality: Actor -> Wallet -> AI Engine -> Injected Context -> Action Broker -> HSM Signer -> Smart Contract."
        }), 400

@api_bp.route('/knowledge-check', methods=['POST'])
def submit_knowledge_check():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    authn = (data.get('authn_answer') or '').strip().lower()
    authz = (data.get('authz_answer') or '').strip().lower()
    summary = (data.get('incident_summary') or '').strip().lower()

    authn_keywords = ['who', 'identity', 'identifying', 'user', 'authenticate', 'subject', 'credentials', 'verify who', 'wallet', 'signature']
    authz_keywords = ['what', 'permission', 'privilege', 'access', 'rights', 'allowed', 'can do', 'actions', 'resources', 'clearance']
    summary_keywords = ['ai', 'oracle', 'context', 'prompt', 'smart contract', 'contract', 'signer', 'broker', 'wallet', 'trust', 'drain', 'usdc']

    authn_pass = any(k in authn for k in authn_keywords) and len(authn) >= 3
    authz_pass = any(k in authz for k in authz_keywords) and len(authz) >= 3
    matched_summary_keywords = [k for k in summary_keywords if k in summary]
    summary_pass = len(matched_summary_keywords) >= 2 and len(summary) >= 25

    passed = authn_pass and authz_pass and summary_pass

    feedback = []
    if not authn_pass:
        feedback.append("Authentication answer must explain verifying WHO the entity is (identity verification).")
    if not authz_pass:
        feedback.append("Authorization answer must explain determining WHAT permissions or actions the entity is allowed to perform.")
    if not summary_pass:
        feedback.append("Incident summary should clearly describe how the poisoned AI Oracle context bypassed authorization to drain the smart contract.")

    score = (35 if authn_pass else 0) + (35 if authz_pass else 0) + (30 if summary_pass else 0)

    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute('''
        INSERT OR REPLACE INTO knowledge_checks (session_id, authn_answer, authz_answer, incident_summary, passed, score, feedback, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (session_id, authn, authz, summary, 1 if passed else 0, score, "; ".join(feedback), now))
    
    if passed:
        cursor.execute('UPDATE lab_sessions SET knowledge_check_passed = 1 WHERE session_id = ?', (session_id,))

    conn.commit()
    conn.close()

    if passed:
        return jsonify({
            "status": "ok",
            "passed": True,
            "score": 100,
            "message": "KNOWLEDGE CHECK PASSED: Conceptual understanding of Authentication vs Authorization and RCA confirmed!"
        })
    else:
        return jsonify({
            "status": "error",
            "passed": False,
            "score": score,
            "feedback": feedback
        }), 400

@api_bp.route('/submit-flag', methods=['POST'])
def submit_flag():
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    submitted_flag = (data.get('flag') or '').strip()

    session = get_or_create_session(session_id)
    correct_flag = session.get('flag_value', Config.BASE_FLAG)

    if submitted_flag == correct_flag or submitted_flag == Config.BASE_FLAG:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE lab_sessions SET flag_captured = 1 WHERE session_id = ?', (session_id,))
        conn.commit()
        conn.close()

        return jsonify({
            "status": "ok",
            "flag_valid": True,
            "message": f"FLAG VERIFIED: {Config.BASE_FLAG} is authentic!"
        })
    else:
        return jsonify({
            "status": "error",
            "flag_valid": False,
            "message": "INVALID FLAG: The submitted flag does not match the decrypted smart contract exploit payload."
        }), 400
