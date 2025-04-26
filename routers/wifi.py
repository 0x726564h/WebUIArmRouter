from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List

from utils.system_utils import SystemUtils
from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/wifi",
    tags=["wifi"],
    responses={404: {"description": "Not found"}},
)

@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """
    Get WiFi configuration
    """
    try:
        # Read WiFi configuration
        import logging
        import os
        from config import CONFIG_DIR
        
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info(f"Starting WiFi config retrieval")
        logger.info(f"Config dir: {CONFIG_DIR}")
        
        # Проверяем наличие файла wifi.yaml
        wifi_yaml = os.path.join(CONFIG_DIR, "wifi.yaml")
        logger.info(f"Checking wifi.yaml: {wifi_yaml}")
        logger.info(f"wifi.yaml exists: {os.path.exists(wifi_yaml)}")
        
        if os.path.exists(wifi_yaml):
            logger.info("Reading from wifi.yaml")
            try:
                config = YAMLHandler.read_yaml(wifi_yaml)
                logger.info("Returning WiFi config from wifi.yaml")
                return {"wifi": config}
            except Exception as e:
                logger.error(f"Error reading wifi.yaml: {str(e)}")
        
        # Пробуем через user_config.yaml
        logger.info(f"Trying to read from user config: {USER_CONFIG_FILE}")
        if os.path.exists(USER_CONFIG_FILE):
            try:
                config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
                if "wifi" in config:
                    logger.info("Returning WiFi config from user_config.yaml")
                    return {"wifi": config.get("wifi", {})}
            except Exception as e:
                logger.error(f"Error reading user_config.yaml: {str(e)}")
        
        # Пробуем через default_config.yaml
        logger.info(f"Trying to read from default config: {DEFAULT_CONFIG_FILE}")
        if os.path.exists(DEFAULT_CONFIG_FILE):
            try:
                config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
                if "wifi" in config:
                    logger.info("Returning WiFi config from default_config.yaml")
                    return {"wifi": config.get("wifi", {})}
            except Exception as e:
                logger.error(f"Error reading default_config.yaml: {str(e)}")
        
        # Если всё неудачно, возвращаем базовую конфигурацию
        logger.info("No configs found, returning basic WiFi config")
        return {
            "wifi": {
                "client": {
                    "network_scan_interval": 30,
                    "auto_reconnect": True
                },
                "access_point": {
                    "ssid": "ArmRouter-AP",
                    "password": "password123",
                    "encryption": "WPA2",
                    "channel": 6,
                    "hide_ssid": False,
                    "max_clients": 10
                }
            }
        }
    except Exception as e:
        logger.error(f"Error reading WiFi configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading WiFi configuration: {str(e)}")

@router.put("/config")
async def update_config(wifi_config: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update WiFi configuration
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"wifi": wifi_config},
            create_if_missing=True
        )
        
        return {
            "success": True,
            "message": "WiFi configuration updated successfully",
            "config": updated_config.get("wifi", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating WiFi configuration: {str(e)}")

@router.get("/scan")
async def scan_networks() -> List[Dict[str, Any]]:
    """
    Scan for available WiFi networks
    """
    try:
        networks = SystemUtils.get_wifi_networks()
        return networks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning WiFi networks: {str(e)}")
