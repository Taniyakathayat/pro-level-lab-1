#!/usr/bin/env python3
"""
Aurelia Cyber Systems — Cybersecurity PRO Training Lab Platform
Case ID: NX-047 — The Ghost in the Gateway
"""

import sys
import webbrowser
from app import create_app
from config import Config

def main():
    print("=" * 75)
    print("  ___  _   _ ____  _____ _     ___    _       ____  ____   ___  ")
    print(" / _ \\| | | |  _ \\| ____| |   |_ _|  / \\     |  _ \\|  _ \\ / _ \\ ")
    print("| |_| | | | | |_) |  _| | |    | |  / _ \\    | |_) | |_) | | | |")
    print("|  _  | |_| |  _ <| |___| |___ | | / ___ \\   |  __/|  _ <| |_| |")
    print("|_| |_|\\___/|_| \\_\\_____|_____|___/_/   \\_\\  |_|   |_| \\_\\\\___/ ")
    print("=" * 75)
    print(f"[*] Case ID: {Config.CASE_ID} | Difficulty: {Config.DIFFICULTY}")
    print(f"[*] Title: {Config.LAB_TITLE}")
    print(f"[*] Subtitle: {Config.LAB_SUBTITLE}")
    print(f"[*] Organization: {Config.ORGANIZATION}")
    print(f"[*] Recommended Time: {Config.RECOMMENDED_MINUTES} Minutes")
    print("=" * 75)
    print(f"[*] Starting local server on: http://127.0.0.1:5050")
    print(f"[*] Instructor PIN: {Config.INSTRUCTOR_PIN}")
    print("=" * 75)

    app = create_app()
    app.run(host='0.0.0.0', port=5050, debug=False)

if __name__ == '__main__':
    main()
