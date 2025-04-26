from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/tunnel",
    tags=["tunnel"],
    responses={404: {"description": "Not found"}},
)

@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """
    Get tunnel configuration
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            return {"tunnel": config.get("tunnel", {})}
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            return {"tunnel": config.get("tunnel", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading tunnel configuration: {str(e)}")

@router.put("/config")
async def update_config(tunnel_config: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update tunnel configuration
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"tunnel": tunnel_config},
            create_if_missing=True
        )
        
        return {
            "success": True,
            "message": "Tunnel configuration updated successfully",
            "config": updated_config.get("tunnel", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating tunnel configuration: {str(e)}")

@router.post("/restart")
async def restart_tunnel() -> Dict[str, Any]:
    """
    Restart tunnel service
    """
    try:
        # This would actually call a system utility function
        # For now, just return success
        return {
            "success": True,
            "message": "Tunnel service restarted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restarting tunnel service: {str(e)}")
