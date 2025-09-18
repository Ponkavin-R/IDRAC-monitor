import sqlite3
import json

DATABASE_FILE = "servers.db"

def init_db():
    conn = sqlite3.connect(DATABASE_FILE)
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
    conn.close()

def add_server(data: dict):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    columns = ", ".join(data.keys())
    placeholders = ", ".join(["?"] * len(data))
    try:
        cursor.execute(f"INSERT INTO servers ({columns}) VALUES ({placeholders})", list(data.values()))
        conn.commit()
        conn.close()
        return {"message": "Server added successfully."}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "Hostname already exists."}
    except Exception as e:
        conn.close()
        return {"error": str(e)}

def get_datacenters():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT DataCenterID FROM servers")
    datacenters = [row[0] for row in cursor.fetchall()]
    conn.close()
    return datacenters

def get_cabinets(datacenter_id: str):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT Cabinet FROM servers WHERE DataCenterID = ?", (datacenter_id,))
    cabinets = [row[0] for row in cursor.fetchall()]
    conn.close()
    return cabinets

def get_positions(datacenter_id: str, cabinet: str):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT Position FROM servers WHERE DataCenterID = ? AND Cabinet = ?", (datacenter_id, cabinet))
    positions = [row[0] for row in cursor.fetchall()]
    conn.close()
    return positions

def get_hostnames(datacenter_id: str, cabinet: str, position: str):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT Hostname FROM servers WHERE DataCenterID = ? AND Cabinet = ? AND Position = ?", (datacenter_id, cabinet, position))
    hostnames = [row[0] for row in cursor.fetchall()]
    conn.close()
    return hostnames

def get_server_details(hostname: str):
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM servers WHERE Hostname = ?", (hostname,))
    row = cursor.fetchone()
    conn.close()
    if row:
        columns = [desc[0] for desc in cursor.description]
        server_details = dict(zip(columns, row))
        if server_details['iDRAC_details']:
            server_details['iDRAC_details'] = json.loads(server_details['iDRAC_details'])
        return server_details
    return None

def get_all_servers_for_sidebar():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT DataCenterID, Cabinet, Position, Label, iDRAC_IP FROM servers")
    servers = [
        {"DataCenterID": row[0], "Cabinet": row[1], "Position": row[2], "Label": row[3], "iDRAC_IP": row[4]}
        for row in cursor.fetchall()
    ]
    conn.close()
    return servers
