import os
from pathlib import Path

# Base directory for the application
BASE_DIR = Path(__file__).resolve().parent

# Configuration directory
CONFIG_DIR = BASE_DIR / "config"

# Default configuration file
DEFAULT_CONFIG_FILE = CONFIG_DIR / "default_config.yaml"

# User configuration file
USER_CONFIG_FILE = CONFIG_DIR / "user_config.yaml"

# Ensure config directory exists
CONFIG_DIR.mkdir(exist_ok=True)

# YAML file extensions
YAML_EXTENSIONS = ['.yaml', '.yml']

# Module directories - used by the module manager
MODULES_DIR = BASE_DIR / "modules"
AVAILABLE_MODULES = {
    "dashboard": {"name": "Dashboard", "description": "System overview and status", "enabled": True, "core": True},
    "network": {"name": "Network Settings", "description": "WAN and LAN configuration", "enabled": True, "core": True},
    "wifi": {"name": "WiFi Configuration", "description": "WiFi network setup", "enabled": True, "core": False},
    "firewall": {"name": "Firewall", "description": "Network security rules", "enabled": True, "core": False},
    "tunnel": {"name": "Tunnel Manager", "description": "VPN, Tor and other tunneling options", "enabled": True, "core": False},
    "routing": {"name": "Routing", "description": "Network routing configuration", "enabled": True, "core": False},
    "settings": {"name": "General Settings", "description": "System-wide settings", "enabled": True, "core": True},
}
