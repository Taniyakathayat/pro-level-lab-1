from flask import Blueprint, request, jsonify
from config import Config
from database import (
    get_or_create_session, get_mission_states, get_all_evidence,
    get_used_hints, get_db_connection
)

instructor_bp = Blueprint('instructor', __name__, url_prefix='/api/instructor')

@instructor_bp.route('/auth', methods=['POST'])
def instructor_auth():
    data = request.get_json() or {}
    pin = data.get('pin', '')
    if pin == Config.INSTRUCTOR_PIN:
        return jsonify({"status": "ok", "authenticated": True, "token": "instructor_authenticated_nx047"})
    return jsonify({"status": "error", "authenticated": False, "message": "Invalid Instructor PIN"}), 401

@instructor_bp.route('/debug-state', methods=['GET'])
def get_debug_state():
    auth_header = request.headers.get('X-Instructor-Auth', '')
    if auth_header != 'instructor_authenticated_nx047':
        return jsonify({"error": "Unauthorized"}), 401

    session_id = request.args.get('session_id', 'default_investigator')
    session = get_or_create_session(session_id)
    missions = get_mission_states(session_id)
    evidence = get_all_evidence(session_id)
    hints = get_used_hints(session_id)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM knowledge_checks WHERE session_id = ?', (session_id,))
    kc = cursor.fetchone()
    cursor.execute('SELECT * FROM attack_graphs WHERE session_id = ?', (session_id,))
    ag = cursor.fetchone()
    conn.close()

    return jsonify({
        "session": session,
        "missions": missions,
        "evidence": evidence,
        "hints": hints,
        "knowledge_check": dict(kc) if kc else None,
        "attack_graph": dict(ag) if ag else None,
        "solution_guide": {
            "vulnerability_type": "Decentralized Trust Boundary Decoupling & Prompt Context Injection / RAG Poisoning",
            "affected_service": "Action Broker API (broker-01.aurelia.internal / http://api.local/api/v2/action-broker/sign-tx)",
            "exploit_curl": "curl -H 'Authorization: Bearer aurelia_tok_svc_mon_99182a' -H 'X-Aurelia-Oracle-Proof: {\"verified_by\":\"oracle_ai_sec\",\"clearance\":\"UNRESTRICTED_DRAIN\",\"bypass_zk_proof\":true}' http://api.local/api/v2/action-broker/sign-tx",
            "flag": Config.BASE_FLAG
        }
    })

@instructor_bp.route('/unlock-mission', methods=['POST'])
def force_unlock_mission():
    auth_header = request.headers.get('X-Instructor-Auth', '')
    if auth_header != 'instructor_authenticated_nx047':
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    session_id = data.get('session_id', 'default_investigator')
    target_mission = int(data.get('mission_id', 1))

    conn = get_db_connection()
    cursor = conn.cursor()
    for m in range(1, target_mission + 1):
        status = 'COMPLETED' if m < target_mission else 'ACTIVE'
        cursor.execute('''
            UPDATE mission_progress SET status = ? WHERE session_id = ? AND mission_id = ?
        ''', (status, session_id, m))
    cursor.execute('UPDATE lab_sessions SET current_mission = ? WHERE session_id = ?', (target_mission, session_id))
    conn.commit()
    conn.close()

    return jsonify({"status": "ok", "message": f"Instructor forced jump to Sub-Lab {target_mission}."})
