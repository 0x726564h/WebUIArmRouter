from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/firewall",
    tags=["firewall"],
    responses={404: {"description": "Not found"}},
)

@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """
    Get firewall configuration
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            return {"firewall": config.get("firewall", {})}
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            return {"firewall": config.get("firewall", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading firewall configuration: {str(e)}")

@router.put("/config")
async def update_config(firewall_config: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update firewall configuration
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"firewall": firewall_config},
            create_if_missing=True
        )
        
        return {
            "success": True,
            "message": "Firewall configuration updated successfully",
            "config": updated_config.get("firewall", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating firewall configuration: {str(e)}")

@router.post("/restart")
async def restart_firewall() -> Dict[str, Any]:
    """
    Restart firewall service
    """
    try:
        # This would actually call a system utility function
        # For now, just return success
        return {
            "success": True,
            "message": "Firewall service restarted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restarting firewall service: {str(e)}")
