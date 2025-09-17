import requests
import logging
from datetime import datetime
import warnings

# Suppress warnings for unverified HTTPS requests
warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO)

class IdracClient:
    def __init__(self, ip: str, username: str, password: str, verify_ssl: bool = False):
        self.ip = ip
        self.username = username
        self.password = password
        self.verify_ssl = verify_ssl
        self.base_url = f"https://{self.ip}/redfish/v1"

    def _request(self, path: str):
        """Generic GET request to iDRAC Redfish API."""
        url = f"{self.base_url}{path}"
        try:
            response = requests.get(url, auth=(self.username, self.password), verify=self.verify_ssl, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP error for {self.ip} on {path}: {e.response.status_code} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Network error for {self.ip} on {path}: {e}")
        return None

    def get_system_info(self):
        """Get hostname, model, service tag, health, and more detailed system info."""
        data = self._request("/Systems/System.Embedded.1")
        if not data:
            return {}
        
        system_info = {
            "hostname": data.get("HostName"),
            "model": data.get("Model"),
            "service_tag": data.get("SKU"),
            "serial_number": data.get("SerialNumber"),
            "manufacturer": data.get("Manufacturer"),
            "health": data.get("Status", {}).get("Health"),
            "power_state": data.get("PowerState"),
            "bios_version": data.get("BiosVersion"),
        }
        
        # Add Dell-specific OEM data if available
        dell_oem_data = data.get("Oem", {}).get("Dell", {}).get("DellSystem", {})
        system_info.update(dell_oem_data)
        
        return system_info

    def get_hardware_inventory(self):
        """Get detailed information for processors, memory, and network devices."""
        inventory = {
            "processors": [],
            "memory_modules": [],
            "nics": []
        }
        
        # Processors
        processors_collection = self._request("/Systems/System.Embedded.1/Processors")
        if processors_collection:
            for member in processors_collection.get("Members", []):
                processor_details = self._request(member["@odata.id"])
                if processor_details:
                    inventory["processors"].append(processor_details)

        # Memory
        memory_collection = self._request("/Systems/System.Embedded.1/Memory")
        if memory_collection:
            for member in memory_collection.get("Members", []):
                memory_details = self._request(member["@odata.id"])
                if memory_details:
                    inventory["memory_modules"].append(memory_details)
        
        # NICs
        nics_collection = self._request("/Systems/System.Embedded.1/EthernetInterfaces")
        if nics_collection:
            for member in nics_collection.get("Members", []):
                nic_details = self._request(member["@odata.id"])
                if nic_details:
                    inventory["nics"].append(nic_details)
        
        return inventory
        
    def get_thermals_and_power(self):
        """Get detailed information for fans, temperature sensors, and power supplies."""
        env_data = {
            "fans": [],
            "temperature_sensors": [],
            "power_supplies": []
        }

        # Thermal details
        thermal_data = self._request("/Chassis/System.Embedded.1/Thermal")
        if thermal_data:
            env_data["fans"] = thermal_data.get("Fans", [])
            env_data["temperature_sensors"] = thermal_data.get("Temperatures", [])

        # Power supply details
        power_data = self._request("/Chassis/System.Embedded.1/Power")
        if power_data:
            # The Dell script showed an example of handling a case where PowerSupplies is not a direct key.
            # This logic should be more robust in a production environment, but for now, we'll assume the standard Redfish path.
            for psu in power_data.get("PowerSupplies", []):
                psu_details = psu
                # Fetch Dell OEM-specific details if available
                dell_psu_oem = psu.get("Oem", {}).get("Dell", {}).get("DellPowerSupply", {})
                psu_details.update(dell_psu_oem)
                env_data["power_supplies"].append(psu_details)

        return env_data

    def get_storage_details(self):
        """Get detailed information for storage controllers and connected physical disks."""
        storage_info = {
            "controllers": [],
            "drives": []
        }

        storage_collection = self._request("/Systems/System.Embedded.1/Storage")
        if storage_collection:
            for controller_link in storage_collection.get("Members", []):
                controller_data = self._request(controller_link["@odata.id"])
                if not controller_data:
                    continue
                
                # Get controller details
                controller_details = controller_data.get("StorageControllers", [{}])[0]
                dell_controller_oem = controller_data.get("Oem", {}).get("Dell", {}).get("DellController", {})
                controller_details.update(dell_controller_oem)
                storage_info["controllers"].append(controller_details)

                # Get drive details for this controller
                for drive_link in controller_data.get("Drives", []):
                    drive_data = self._request(drive_link["@odata.id"])
                    if drive_data:
                        # Get Dell OEM-specific drive info
                        dell_drive_oem = drive_data.get("Oem", {}).get("Dell", {}).get("DellPhysicalDisk", {})
                        drive_data.update(dell_drive_oem)
                        storage_info["drives"].append(drive_data)
        
        return storage_info

    def get_full_details(self):
        """Aggregates all system inventory into a single, structured dictionary."""
        try:
            return {
                "idrac_ip": self.ip,
                "timestamp": datetime.utcnow().isoformat(),
                "system": self.get_system_info(),
                "hardware": self.get_hardware_inventory(),
                "storage": self.get_storage_details(),
                "thermals_and_power": self.get_thermals_and_power(),
                "firmware": self._request("/UpdateService/FirmwareInventory"), # This endpoint provides a high-level view
                "warranty": self.get_warranty_info()
            }
        except Exception as e:
            logging.error(f"Failed to get full details for {self.ip}: {e}")
            return {"status": "error", "message": str(e)}

    def get_warranty_info(self):
        """Get warranty details (Dell OEM extension)."""
        try:
            data = self._request("/Managers/iDRAC.Embedded.1/Oem/Dell/DellWarranty")
            if data:
                return {
                    "start_date": data.get("WarrantyStartDate"),
                    "end_date": data.get("WarrantyEndDate"),
                    "status": data.get("WarrantyStatus")
                }
            return {"message": "Warranty data not found"}
        except Exception:
            return {"message": "Warranty API not supported on this iDRAC"}