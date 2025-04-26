from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from utils.system_utils import SystemUtils

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    responses={404: {"description": "Not found"}},
)

@router.get("/system-info")
async def get_system_info() -> Dict[str, Any]:
    """
    Get system information (hostname, platform, architecture, etc.)
    """
    return SystemUtils.get_system_info()

@router.get("/statistics")
async def get_statistics() -> Dict[str, Any]:
    """
    Get system statistics (CPU, memory, disk, network)
    """
    try:
        return {
            "cpu": SystemUtils.get_cpu_info(),
            "memory": SystemUtils.get_memory_info(),
            "disk": SystemUtils.get_disk_info(),
            "uptime": SystemUtils.get_uptime()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")
