from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List

from utils.system_utils import SystemUtils
from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/routing",
    tags=["routing"],
    responses={404: {"description": "Not found"}},
)

@router.get("/table")
async def get_routing_table() -> List[Dict[str, Any]]:
    """
    Get routing table
    """
    try:
        return SystemUtils.get_routing_table()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting routing table: {str(e)}")

@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """
    Get routing configuration
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            return {"routing": config.get("routing", {})}
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            return {"routing": config.get("routing", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading routing configuration: {str(e)}")

@router.put("/config")
async def update_config(routing_config: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update routing configuration
    """
    try:
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"routing": routing_config},
            create_if_missing=True
        )
        
        return {
            "success": True,
            "message": "Routing configuration updated successfully",
            "config": updated_config.get("routing", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating routing configuration: {str(e)}")
