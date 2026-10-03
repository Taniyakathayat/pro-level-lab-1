import sqlite3
import time
import json
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lab_sessions (
        session_id TEXT PRIMARY KEY,
        created_at REAL,
        start_time REAL,
        end_time REAL,
        current_mission INTEGER DEFAULT 1,
        lab_started INTEGER DEFAULT 1,
        lab_completed INTEGER DEFAULT 0,
        flag_captured INTEGER DEFAULT 0,
        knowledge_check_passed INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        flag_value TEXT,
        last_activity REAL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS mission_progress (
        session_id TEXT,
        mission_id INTEGER,
        status TEXT DEFAULT 'LOCKED',
        unlocked_at REAL,
        completed_at REAL,
        submission_data TEXT,
        PRIMARY KEY (session_id, mission_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        evidence_id TEXT,
        title TEXT,
        category TEXT,
        source TEXT,
        observation TEXT,
        significance TEXT,
        discovered_at REAL,
        UNIQUE(session_id, evidence_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS hint_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        mission_id INTEGER,
        hint_index INTEGER,
        requested_at REAL,
        UNIQUE(session_id, mission_id, hint_index)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS knowledge_checks (
        session_id TEXT PRIMARY KEY,
        authn_answer TEXT,
        authz_answer TEXT,
        incident_summary TEXT,
        passed INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        feedback TEXT,
        submitted_at REAL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attack_graphs (
        session_id TEXT PRIMARY KEY,
        graph_data TEXT,
        is_valid INTEGER DEFAULT 0,
        submitted_at REAL
    )
    ''')

    conn.commit()
    conn.close()

def get_or_create_session(session_id="default_investigator"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM lab_sessions WHERE session_id = ?', (session_id,))
    row = cursor.fetchone()
    now = time.time()

    if not row:
        flag = Config.BASE_FLAG
        cursor.execute('''
            INSERT INTO lab_sessions (session_id, created_at, start_time, current_mission, lab_started, flag_value, last_activity)
            VALUES (?, ?, ?, 1, 1, ?, ?)
        ''', (session_id, now, now, flag, now))
        
        # 7 Sub-Labs (01 to 07)
        for m in range(1, 8):
            status = 'ACTIVE' if m == 1 else 'LOCKED'
            cursor.execute('''
                INSERT OR REPLACE INTO mission_progress (session_id, mission_id, status, unlocked_at)
                VALUES (?, ?, ?, ?)
            ''', (session_id, m, status, now if m == 1 else None))
            
        conn.commit()
        cursor.execute('SELECT * FROM lab_sessions WHERE session_id = ?', (session_id,))
        row = cursor.fetchone()
    else:
        cursor.execute('UPDATE lab_sessions SET last_activity = ? WHERE session_id = ?', (now, session_id))
        conn.commit()

    conn.close()
    return dict(row)

def start_lab_timer(session_id="default_investigator"):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute('''
        UPDATE lab_sessions
        SET lab_started = 1, start_time = ?, last_activity = ?
        WHERE session_id = ?
    ''', (now, now, session_id))
    conn.commit()
    conn.close()

def reset_lab_session(session_id="default_investigator"):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    flag = Config.BASE_FLAG

    cursor.execute('DELETE FROM mission_progress WHERE session_id = ?', (session_id,))
    cursor.execute('DELETE FROM evidence WHERE session_id = ?', (session_id,))
    cursor.execute('DELETE FROM hint_logs WHERE session_id = ?', (session_id,))
    cursor.execute('DELETE FROM knowledge_checks WHERE session_id = ?', (session_id,))
    cursor.execute('DELETE FROM attack_graphs WHERE session_id = ?', (session_id,))

    cursor.execute('''
        INSERT OR REPLACE INTO lab_sessions (
            session_id, created_at, start_time, end_time, current_mission,
            lab_started, lab_completed, flag_captured, knowledge_check_passed,
            hints_used, flag_value, last_activity
        ) VALUES (?, ?, ?, NULL, 1, 1, 0, 0, 0, 0, ?, ?)
    ''', (session_id, now, now, flag, now))

    for m in range(1, 8):
        status = 'ACTIVE' if m == 1 else 'LOCKED'
        cursor.execute('''
            INSERT OR REPLACE INTO mission_progress (session_id, mission_id, status, unlocked_at)
            VALUES (?, ?, ?, ?)
        ''', (session_id, m, status, now if m == 1 else None))

    conn.commit()
    conn.close()

def add_evidence(session_id, evidence_id, title, category, source, observation, significance):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    try:
        cursor.execute('''
            INSERT INTO evidence (session_id, evidence_id, title, category, source, observation, significance, discovered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, evidence_id, title, category, source, observation, significance, now))
        conn.commit()
        added = True
    except sqlite3.IntegrityError:
        added = False
    conn.close()
    return added

def get_all_evidence(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM evidence WHERE session_id = ? ORDER BY discovered_at ASC', (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_mission_states(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM mission_progress WHERE session_id = ? ORDER BY mission_id ASC', (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def unlock_next_mission(session_id, current_mission_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    
    cursor.execute('''
        UPDATE mission_progress
        SET status = 'COMPLETED', completed_at = ?
        WHERE session_id = ? AND mission_id = ?
    ''', (now, session_id, current_mission_id))

    next_mission_id = current_mission_id + 1
    if next_mission_id <= 7:
        cursor.execute('''
            UPDATE mission_progress
            SET status = 'ACTIVE', unlocked_at = ?
            WHERE session_id = ? AND mission_id = ?
        ''', (now, session_id, next_mission_id))
        cursor.execute('''
            UPDATE lab_sessions
            SET current_mission = ?
            WHERE session_id = ?
        ''', (next_mission_id, session_id))
    else:
        cursor.execute('''
            UPDATE lab_sessions
            SET lab_completed = 1, end_time = ?
            WHERE session_id = ?
        ''', (now, session_id))

    conn.commit()
    conn.close()

def log_hint_used(session_id, mission_id, hint_index):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    try:
        cursor.execute('''
            INSERT INTO hint_logs (session_id, mission_id, hint_index, requested_at)
            VALUES (?, ?, ?, ?)
        ''', (session_id, mission_id, hint_index, now))
        cursor.execute('''
            UPDATE lab_sessions
            SET hints_used = (SELECT COUNT(*) FROM hint_logs WHERE session_id = ?)
            WHERE session_id = ?
        ''', (session_id, session_id))
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    conn.close()

def get_used_hints(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT mission_id, hint_index FROM hint_logs WHERE session_id = ?', (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
