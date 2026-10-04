import os
from flask import Flask, render_template, jsonify, send_from_directory
from config import Config
from database import init_db, get_or_create_session
from routes.api import api_bp
from routes.vulnerable_sandbox import sandbox_bp
from routes.terminal_engine import terminal_bp
from routes.instructor import instructor_bp

def create_app():
    app = Flask(
        __name__,
        static_folder='static',
        static_url_path='/static',
        template_folder='templates'
    )
    app.config.from_object(Config)

    # Initialize Database Schema
    init_db()

    # Register Blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(sandbox_bp)
    app.register_blueprint(terminal_bp)
    app.register_blueprint(instructor_bp)

    @app.route('/')
    def index():
        session = get_or_create_session("default_investigator")
        return render_template('index.html', config=Config, session=session)

    @app.route('/health')
    def health():
        return jsonify({"status": "ONLINE", "lab": Config.LAB_TITLE, "case_id": Config.CASE_ID})

    @app.route('/static/<path:filename>')
    def serve_static_fallback(filename):
        return send_from_directory(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'), filename)

    return app

# Expose app for Vercel WSGI / Serverless runtime
app = create_app()

if __name__ == '__main__':
    print("=" * 70)
    print(f"[*] AURELIA CYBER SYSTEMS — {Config.LAB_TITLE}")
    print(f"[*] CASE ID: {Config.CASE_ID} | DIFFICULTY: {Config.DIFFICULTY}")
    print(f"[*] Running on http://127.0.0.1:5050")
    print("=" * 70)
    app.run(host='0.0.0.0', port=5050, debug=False)
