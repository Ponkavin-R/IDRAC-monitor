from fastapi import APIRouter, HTTPException
from app.services.idrac_client import IdracClient
import os

router = APIRouter(prefix="/servers", tags=["Servers"])

# TODO: move to DB or .env later
IDRAC_USERNAME = "root"
IDRAC_PASSWORD = "calvin"

# Construct a full, absolute path to the servers.txt file
# This is the correct way to handle file paths in applications
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVERS_FILE = os.path.join(BASE_DIR, "servers.txt")

def load_servers():
    try:
        with open(SERVERS_FILE, "r") as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        return []

@router.get("/")
def list_servers():
    """List all available server IPs"""
    return {"servers": load_servers()}

@router.get("/check-file-status")
def check_file_status():
    """Checks if the servers.txt file is detected and reports its status."""
    file_exists = os.path.exists(SERVERS_FILE)
    if not file_exists:
        raise HTTPException(
            status_code=404,
            detail=f"The servers.txt file was not found at the expected path: {SERVERS_FILE}"
        )
    
    server_list = load_servers()
    if not server_list:
        return {
            "status": "success",
            "message": f"File '{SERVERS_FILE}' was found, but it appears to be empty or contains no valid IP addresses."
        }
    
    return {
        "status": "success",
        "message": f"File '{SERVERS_FILE}' was found and contains {len(server_list)} IP addresses.",
        "servers": server_list
    }

@router.get("/{ip}")
def get_server_details(ip: str):
    if ip not in load_servers():
        raise HTTPException(status_code=404, detail="Server IP not found in servers.txt")

    try:
        client = IdracClient(ip, IDRAC_USERNAME, IDRAC_PASSWORD)
        details = client.get_full_details()
        return {"status": "success", "data": details}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))