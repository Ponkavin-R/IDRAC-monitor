import sqlite3
import os
import socket
import json
import sys
from fastapi import APIRouter, HTTPException
from app.services.idrac_client import IdracClient
from pydantic import BaseModel

# Corrected the path to find the database file in the parent directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# The database file is in the parent directory 'app'
DB_FILE = os.path.join(BASE_DIR, ".", "servers.db")

router = APIRouter(prefix="/servers", tags=["Servers"])

# TODO: move to DB or .env later
IDRAC_USERNAME = "root"
IDRAC_PASSWORD = "calvin"

class ServerData(BaseModel):
    DataCenterID: str
    Cabinet: str
    Position: str
    Label: str | None = None
    Height: int | None = None
    Manufacturer: str | None = None
    Model: str | None = None
    Hostname: str
    SerialNo: str | None = None
    AssetTag: str | None = None
    Hypervisor: str | None = None
    BackSide: str | None = None
    HalfDepth: str | None = None
    Status: str | None = None
    Owner: str | None = None
    InstallDate: str | None = None
    PrimaryContact: str | None = None
    CustomTags: str | None = None
    iDRAC_details: dict | None = None

def init_db():
    """Initializes the SQLite database and creates the 'servers' table."""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                DataCenterID TEXT NOT NULL,
                Cabinet TEXT NOT NULL,
                Position TEXT NOT NULL,
                Label TEXT,
                Height INTEGER,
                Manufacturer TEXT,
                Model TEXT,
                Hostname TEXT NOT NULL UNIQUE,
                SerialNo TEXT,
                AssetTag TEXT,
                Hypervisor TEXT,
                BackSide TEXT,
                HalfDepth TEXT,
                Status TEXT,
                Owner TEXT,
                InstallDate TEXT,
                PrimaryContact TEXT,
                CustomTags TEXT,
                iDRAC_IP TEXT,
                iDRAC_details JSON
            )
        """)
        conn.commit()
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

def get_all_servers_for_sidebar():
    """Retrieves all servers for the sidebar dropdown."""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        # Updated query to include Hostname
        cursor.execute("SELECT DataCenterID, Cabinet, Position, Label, Hostname, iDRAC_IP FROM servers")
        servers = [
            {"DataCenterID": row[0], "Cabinet": row[1], "Position": row[2], "Label": row[3], "Hostname": row[4], "iDRAC_IP": row[5]}
            for row in cursor.fetchall()
        ]
        return servers
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_all_servers():
    """Retrieves all server hostnames and IPs from the database."""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT Hostname, iDRAC_IP FROM servers")
        return [{"hostname": row[0], "ip": row[1]} for row in cursor.fetchall()]
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return []
    finally:
        if conn:
            conn.close()

def nslookup_hostname(hostname: str):
    """Performs a DNS lookup to get the IP address for a given hostname."""
    try:
        ip_address = socket.gethostbyname(hostname)
        return ip_address
    except socket.gaierror:
        return None

# Initialize the database when the application starts
init_db()

@router.get("/")
def list_servers():
    """List all available server IPs from the database."""
    return {"servers": get_all_servers()}

@router.get("/check-db-status")
def check_db_status():
    """Checks the status of the servers.db database."""
    if not os.path.exists(DB_FILE):
        raise HTTPException(
            status_code=500,
            detail=f"The servers.db file was not found at the expected path: {DB_FILE}"
        )
    
    server_list = get_all_servers()
    
    return {
        "status": "success",
        "message": f"Database '{DB_FILE}' was found and contains {len(server_list)} IP addresses.",
        "servers": server_list
    }
    
@router.get("/sidebar")
def list_servers_for_sidebar():
    """List servers for the sidebar dropdown."""
    servers = get_all_servers_for_sidebar()
    return {"servers": servers}

@router.post("/add-server")
def add_server(server: ServerData):
    """Adds a new server to the database, performing a DNS lookup to get its IP."""
    # Perform DNS lookup for the iDRAC IP
    idrac_ip = nslookup_hostname(server.Hostname)
    if not idrac_ip:
        raise HTTPException(status_code=400, detail=f"Could not resolve IP for hostname: {server.Hostname}")

    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Prepare data for insertion, including the resolved IP
        data = server.model_dump()
        data['iDRAC_IP'] = idrac_ip
        
        # Convert iDRAC_details to JSON string
        if 'iDRAC_details' in data and data['iDRAC_details'] is not None:
            data['iDRAC_details'] = json.dumps(data['iDRAC_details'])

        # Prepare and execute the insert statement
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        cursor.execute(f"INSERT INTO servers ({columns}) VALUES ({placeholders})", list(data.values()))
        conn.commit()
        return {"status": "success", "message": f"Server '{server.Hostname}' added with IP '{idrac_ip}'."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail=f"A server with hostname '{server.Hostname}' already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.get("/{ip}")
def get_server_details(ip: str):
    """Retrieves details for a specific server IP."""
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT Hostname, iDRAC_IP FROM servers WHERE iDRAC_IP = ?", (ip,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Server IP not found in database")
        
        hostname = row[0]
        
        client = IdracClient(hostname, IDRAC_USERNAME, IDRAC_PASSWORD)
        details = client.get_full_details()
        return {"status": "success", "data": details}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
