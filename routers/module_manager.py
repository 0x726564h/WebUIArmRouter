from fastapi import APIRouter, HTTPException, Body, Path
from typing import Dict, Any, List

from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE, AVAILABLE_MODULES

router = APIRouter(
    prefix="/api/modules",
    tags=["modules"],
    responses={404: {"description": "Not found"}},
)

@router.get("")
async def get_modules() -> Dict[str, Any]:
    """
    Get list of available modules
    """
    try:
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            modules = config.get("modules", {})
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            modules = config.get("modules", {})
        
        # Combine with available modules info
        result = {}
        for module_id, module_info in AVAILABLE_MODULES.items():
            module_status = modules.get(module_id, {}).get("enabled", True)
            result[module_id] = {
                **module_info,
                "enabled": module_status
            }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting modules: {str(e)}")

@router.get("/{module_id}")
async def get_module(
    module_id: str = Path(..., description="Module ID")
) -> Dict[str, Any]:
    """
    Get module information
    """
    try:
        if module_id not in AVAILABLE_MODULES:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        # Try to read from user config, fall back to default
        try:
            config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
            module_status = config.get("modules", {}).get(module_id, {}).get("enabled", True)
        except FileNotFoundError:
            config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
            module_status = config.get("modules", {}).get(module_id, {}).get("enabled", True)
        
        return {
            **AVAILABLE_MODULES[module_id],
            "enabled": module_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting module information: {str(e)}")

@router.put("/{module_id}")
async def update_module(
    module_status: Dict[str, Any] = Body(...),
    module_id: str = Path(..., description="Module ID")
) -> Dict[str, Any]:
    """
    Update module status (enable/disable)
    """
    try:
        if module_id not in AVAILABLE_MODULES:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        # Check if module is core and trying to disable
        if AVAILABLE_MODULES[module_id].get("core", False) and not module_status.get("enabled", True):
            raise HTTPException(status_code=400, detail=f"Cannot disable core module {module_id}")
        
        # Update the configuration
        updated_config = YAMLHandler.update_yaml(
            USER_CONFIG_FILE, 
            {"modules": {module_id: {"enabled": module_status.get("enabled", True)}}},
            create_if_missing=True
        )
        
        return {
            "success": True,
            "message": f"Module {module_id} status updated successfully",
            "module": {
                **AVAILABLE_MODULES[module_id],
                "enabled": updated_config.get("modules", {}).get(module_id, {}).get("enabled", True)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating module status: {str(e)}")

@router.get("/available")
async def get_available_modules() -> Dict[str, Any]:
    """
    Get list of available modules for installation
    """
    # In a real implementation, this would query a repository or package manager
    # For now, just return the built-in modules
    return AVAILABLE_MODULES

@router.post("/install/{module_id}")
async def install_module(
    module_id: str = Path(..., description="Module ID")
) -> Dict[str, Any]:
    """
    Install a module
    """
    try:
        # In a real implementation, this would download and install the module
        # For now, just check if it exists and return success
        if module_id not in AVAILABLE_MODULES:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        return {
            "success": True,
            "message": f"Module {module_id} installed successfully",
            "module": AVAILABLE_MODULES[module_id]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error installing module: {str(e)}")

@router.delete("/{module_id}")
async def remove_module(
    module_id: str = Path(..., description="Module ID")
) -> Dict[str, Any]:
    """
    Remove a module
    """
    try:
        if module_id not in AVAILABLE_MODULES:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        # Check if module is core
        if AVAILABLE_MODULES[module_id].get("core", False):
            raise HTTPException(status_code=400, detail=f"Cannot remove core module {module_id}")
        
        # In a real implementation, this would actually remove the module
        # For now, just return success
        return {
            "success": True,
            "message": f"Module {module_id} removed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing module: {str(e)}")
