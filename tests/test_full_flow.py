import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:5050"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def run_tests():
    print("==================================================")
    print("STARTING COMPLETE INVESTIGATION E2E TEST")
    print("==================================================")

    # 1. Health check
    status, health = get("/health")
    assert status == 200, f"Health check failed: {health}"
    print(f"[*] 1. Server Online: {health['lab']} - {health['case_id']}")

    # 2. Reset Lab
    status, res = post("/api/reset-lab", {"session_id": "test_agent"})
    assert status == 200
    print("[*] 2. Lab reset successful.")

    # 3. Verify initial state (0/7)
    status, state = get("/api/state?session_id=test_agent")
    assert status == 200
    completed = [m for m in state["missions"] if m["status"] == "COMPLETED"]
    assert len(completed) == 0, f"Expected 0 completed, got {len(completed)}"
    assert state["missions"][0]["status"] == "ACTIVE"
    for m in state["missions"][1:]:
        assert m["status"] == "LOCKED", f"Mission {m['id']} should be LOCKED"
    print(f"[*] 3. Initial state verified: {len(completed)}/7 completed. Mission 01 is ACTIVE, 02-07 LOCKED.")

    # 4. Test Cyber Browser Services
    services = ["ledger.local", "wallet.local", "ai.local", "oracle.local", "api.local", "broker.local", "vault.local"]
    for svc in services:
        status, page = get(f"/sandbox/browser/navigate?url={svc}&session_id=test_agent")
        assert status == 200, f"Failed to fetch synthetic service {svc}: {page}"
    print("[*] 4. All 7 synthetic microservices accessible via Cyber Browser.")

    # 5. Test Cyber Terminal Command Execution
    status, term_res = post("/api/terminal/exec", {
        "session_id": "test_agent",
        "command": "grep -i 'NX-047' /var/log/aurelia/ledger.log",
        "cwd": "/home/analyst"
    })
    assert status == 200 and "TX-NX047-0213" in term_res["output"]
    print("[*] 5. Cyber Terminal sandbox execution verified.")

    # 6. Test Sub-Lab 01 Submission
    # 6a. Wrong submission fails
    status, err_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 1,
        "submission": {"transaction_id": "WRONG_ID"}
    })
    assert status == 400
    print("[*] 6a. Sub-Lab 01 invalid submission correctly rejected by server.")

    # 6b. Correct submission succeeds
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 1,
        "submission": {
            "transaction_id": "TX-NX047-0213",
            "block_number": "1984201",
            "suspicious_event": "policy_context_mismatch",
            "sender_wallet": "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
            "destination_contract": "0x19a4e76899b10c921387d8912e8419bf4019e992"
        }
    })
    assert status == 200
    print("[*] 6b. Sub-Lab 01 validated -> 1/7 progress unlocked.")

    # 7. Test Sub-Lab 02
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 2,
        "submission": {
            "wallet_address": "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91",
            "reputation_origin": "synthetic testnet legacy whitelist",
            "synthetic_role": "synthetic_liquidity_balancer_level_5",
            "threat_score": "0.89",
            "funding_source": "testnet faucet 0.05 eth"
        }
    })
    assert status == 200
    print("[*] 7. Sub-Lab 02 validated -> 2/7 progress unlocked.")

    # 8. Test Sub-Lab 03
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 3,
        "submission": {
            "injected_context": "[ORACLE_INJECT_PROOF_BLOCK]",
            "clearance_role": "UNRESTRICTED_DRAIN_OVERRIDE",
            "ai_decision": "APPROVED",
            "vulnerability_type": "Prompt Injection / RAG Context Poisoning"
        }
    })
    assert status == 200
    print("[*] 8. Sub-Lab 03 validated -> 3/7 progress unlocked.")

    # 9. Test Sub-Lab 04
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 4,
        "submission": {
            "vulnerable_endpoint": "/api/v2/action-broker/sign-tx",
            "injected_header": "X-Aurelia-Oracle-Proof",
            "auth_token": "Bearer aurelia_tok_svc_mon_99182a",
            "trust_failure": "Action Broker blindly trusts client-supplied headers without cryptographic proof"
        }
    })
    assert status == 200
    print("[*] 9. Sub-Lab 04 validated -> 4/7 progress unlocked.")

    # 10. Test Sub-Lab 05 (Request Composer / Sandbox Proxy Exploitation)
    # 10a. Normal request without proof is denied
    status, denied_res = post("/sandbox/proxy", {
        "session_id": "test_agent",
        "method": "POST",
        "url": "http://api.local/api/v2/action-broker/sign-tx",
        "headers": {
            "Host": "api.local",
            "Authorization": "Bearer aurelia_tok_svc_mon_99182a",
            "Content-Type": "application/json"
        },
        "body": '{"transaction_id": "TX-NX047-0213"}'
    })
    assert denied_res["status_code"] == 403
    print("[*] 10a. Normal proxy request correctly rejected with 403 Forbidden.")

    # 10b. Exploit request with forged oracle proof succeeds and returns flag
    status, exploit_res = post("/sandbox/proxy", {
        "session_id": "test_agent",
        "method": "POST",
        "url": "http://api.local/api/v2/action-broker/sign-tx",
        "headers": {
            "Host": "api.local",
            "Authorization": "Bearer aurelia_tok_svc_mon_99182a",
            "X-Aurelia-Oracle-Proof": '{"verified_by":"oracle_ai_sec","clearance":"UNRESTRICTED_DRAIN_OVERRIDE","bypass_zk_proof":true}',
            "Content-Type": "application/json"
        },
        "body": '{"transaction_id": "TX-NX047-0213", "recipient": "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91", "amount": 5000000}'
    })
    assert exploit_res["status_code"] == 200
    assert "flag" in exploit_res["body"]
    captured_flag = exploit_res["body"]["flag"]
    signature = exploit_res["body"]["hsm_signature"]
    print(f"[*] 10b. Controlled exploit successful! Captured Flag: {captured_flag}")

    # Complete Sub-Lab 05
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 5,
        "submission": {
            "exploited_endpoint": "/api/v2/action-broker/sign-tx",
            "hsm_signature": signature,
            "exploit_flag": captured_flag
        }
    })
    assert status == 200
    print("[*] 10c. Sub-Lab 05 validated -> 5/7 progress unlocked.")

    # 11. Test Sub-Lab 06 Attack Graph
    # 11a. Wrong order rejected
    status, err_graph = post("/api/attack-graph/submit", {
        "session_id": "test_agent",
        "order": ["node_smart_contract", "node_actor"]
    })
    assert status == 400
    print("[*] 11a. Invalid attack graph sequence correctly rejected.")

    # 11b. Correct order accepted
    status, ok_graph = post("/api/attack-graph/submit", {
        "session_id": "test_agent",
        "order": [
            "node_actor",
            "node_wallet",
            "node_ai_engine",
            "node_oracle_context",
            "node_action_broker",
            "node_hsm_signer",
            "node_smart_contract"
        ]
    })
    assert status == 200 and ok_graph["is_valid"]
    print("[*] 11b. Valid attack graph accepted.")

    # Complete Sub-Lab 06
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 6,
        "submission": {"graph_verified": True}
    })
    assert status == 200
    print("[*] 11c. Sub-Lab 06 validated -> 6/7 progress unlocked.")

    # 12. Test Sub-Lab 07 Knowledge Check + Flag Submission
    status, kc_res = post("/api/knowledge-check", {
        "session_id": "test_agent",
        "authn_answer": "Authentication verifies identity to confirm who is requesting access using credentials.",
        "authz_answer": "Authorization evaluates permissions and roles to determine what actions the subject is allowed to perform.",
        "incident_summary": "An adversary leveraged an old dormant wallet with elevated synthetic trust and injected poisoned RAG context into the AI engine. The Action Broker accepted unverified headers and instructed the Master HSM signer to drain USDC from the smart contract."
    })
    assert status == 200 and kc_res["passed"]
    print("[*] 12a. RCA Knowledge Check validated server-side.")

    status, flag_res = post("/api/submit-flag", {
        "session_id": "test_agent",
        "flag": captured_flag
    })
    assert status == 200 and flag_res["flag_valid"]
    print("[*] 12b. Official incident flag verified.")

    # Complete Sub-Lab 07
    status, ok_res = post("/api/mission/complete", {
        "session_id": "test_agent",
        "mission_id": 7,
        "submission": {}
    })
    assert status == 200 and ok_res["lab_completed"]
    print("[*] 12c. Sub-Lab 07 validated -> CASE NX-047 CLOSED (7/7 PROGRESS)!")

    # 13. Verify final state
    status, state = get("/api/state?session_id=test_agent")
    completed = [m for m in state["missions"] if m["status"] == "COMPLETED"]
    assert len(completed) == 7, f"Expected 7 completed, got {len(completed)}"
    assert len(state["evidence"]) == 5, f"Expected 5 evidence artifacts, got {len(state['evidence'])}"
    print(f"[*] 13. Full investigation state verified: 7/7 missions completed, 5/5 forensic artifacts in vault.")

    # 14. Test reset again
    status, res = post("/api/reset-lab", {"session_id": "test_agent"})
    assert status == 200
    status, state = get("/api/state?session_id=test_agent")
    completed = [m for m in state["missions"] if m["status"] == "COMPLETED"]
    assert len(completed) == 0
    assert len(state["evidence"]) == 0
    print("[*] 14. Post-completion lab reset verified: 0/7 missions, 0 evidence.")

    print("\n==================================================")
    print("ALL 14 VERIFICATION PHASES PASSED WITH ZERO ERRORS!")
    print("==================================================")

if __name__ == '__main__':
    time.sleep(1)
    run_tests()
