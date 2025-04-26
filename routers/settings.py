from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

from utils.system_utils import SystemUtils
from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

@router.get("/system")
async def get_system_settings() -> Dict[str, Any]:
    """
    Get system settings
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            return {"system": config.get("system", {})}
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            return {"system": config.get("system", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading system settings: {str(e)}")

@router.put("/system")
async def update_system_settings(system_settings: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update system settings
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"system": system_settings},
            create_if_missing=True
        )
        
        # Apply the settings
        if "hostname" in system_settings:
            SystemUtils.set_hostname(system_settings["hostname"])
            
        if "timezone" in system_settings:
            SystemUtils.set_timezone(system_settings["timezone"])
        
        return {
            "success": True,
            "message": "System settings updated successfully",
            "config": updated_config.get("system", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating system settings: {str(e)}")

@router.get("/access")
async def get_access_settings() -> Dict[str, Any]:
    """
    Get access settings
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            return {"access": config.get("access", {})}
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            return {"access": config.get("access", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading access settings: {str(e)}")

@router.put("/access")
async def update_access_settings(access_settings: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update access settings
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"access": access_settings},
            create_if_missing=True
        )
        
        # Apply the settings
        # This would actually call system utilities to update SSH and web access
        
        return {
            "success": True,
            "message": "Access settings updated successfully",
            "config": updated_config.get("access", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating access settings: {str(e)}")
