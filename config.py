import os
import tempfile

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'aurelia-ledger-nx047-secret-key-2026-secure')
    
    # On Vercel / AWS Lambda serverless environments, local root is read-only
    if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        DATABASE = os.path.join(tempfile.gettempdir(), 'aurelia_lab.sqlite')
    else:
        DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aurelia_lab.sqlite')
        
    CASE_ID = "NX-047"
    LAB_TITLE = "The Ghost in the Ledger"
    LAB_SUBTITLE = "AI Security × Web3 Security × Blockchain Forensics × Smart Contracts"
    ORGANIZATION = "Aurelia Cyber Systems"
    DIFFICULTY = "PRO / HARD"
    RECOMMENDED_MINUTES = 50
    BASE_FLAG = "LAB{ai_context_poisoned_smart_contract_drained_nx047}"
    INSTRUCTOR_PIN = "NX047_INSTRUCTOR_2026"
