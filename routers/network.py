from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

from utils.system_utils import SystemUtils
from utils.yaml_handler import YAMLHandler
from config import DEFAULT_CONFIG_FILE, USER_CONFIG_FILE

router = APIRouter(
    prefix="/api/network",
    tags=["network"],
    responses={404: {"description": "Not found"}},
)

@router.get("/interfaces")
async def get_interfaces() -> Dict[str, Any]:
    """
    Get network interface information
    """
    return SystemUtils.get_network_interfaces()

@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """
    Get network configuration
    """
    try:
        # Read network.yaml file
        import logging
        import os
        from config import CONFIG_DIR
        
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info(f"Starting network config retrieval")
        logger.info(f"Config dir: {CONFIG_DIR}")
        logger.info(f"User config exists: {os.path.exists(USER_CONFIG_FILE)}")
        
        # Сначала проверим файл network.yaml
        network_yaml = os.path.join(CONFIG_DIR, "network.yaml")
        logger.info(f"Checking network.yaml: {network_yaml}")
        logger.info(f"network.yaml exists: {os.path.exists(network_yaml)}")
        
        if os.path.exists(network_yaml):
            logger.info("Reading from network.yaml")
            config = YAMLHandler.read_yaml(network_yaml)
            if "interfaces" in config:
                logger.info("Returning network config from network.yaml")
                return {"network": config}
        
        # Затем пробуем через user_config.yaml и default_config.yaml
        try:
            logger.info(f"Trying to read from user config: {USER_CONFIG_FILE}")
            if os.path.exists(USER_CONFIG_FILE):
                config = YAMLHandler.read_yaml(USER_CONFIG_FILE)
                if "network" in config:
                    logger.info("Returning network config from user_config.yaml")
                    return {"network": config.get("network", {})}
            
            logger.info(f"Trying to read from default config: {DEFAULT_CONFIG_FILE}")
            if os.path.exists(DEFAULT_CONFIG_FILE):
                config = YAMLHandler.read_yaml(DEFAULT_CONFIG_FILE)
                if "network" in config:
                    logger.info("Returning network config from default_config.yaml")
                    return {"network": config.get("network", {})}
            
            # Используем network.yaml в качестве запасного варианта
            logger.info("No configs found, using network.yaml as fallback")
            config = YAMLHandler.read_yaml(network_yaml)
            return {"network": config}
        except FileNotFoundError as e:
            logger.error(f"File not found: {str(e)}")
            config = YAMLHandler.read_yaml(network_yaml)
            return {"network": config}
    except Exception as e:
        logger.error(f"Error reading network configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading network configuration: {str(e)}")

@router.put("/config")
async def update_config(network_config: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Update network configuration
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Updating network configuration: {network_config}")
        
        # Если обновляем WAN или LAN настройки - обрабатываем специальным образом
        if "wan_interface" in network_config or "lan_interface" in network_config:
            logger.info("WAN/LAN configuration found in request")
            
            # Получим текущую конфигурацию
            import os
            from config import CONFIG_DIR
            network_yaml_path = os.path.join(CONFIG_DIR, "network.yaml")
            
            if os.path.exists(network_yaml_path):
                current_config = YAMLHandler.read_yaml(network_yaml_path)
            else:
                current_config = {}
            
            # Обновляем интерфейсы
            if "interfaces" in network_config:
                if "interfaces" not in current_config:
                    current_config["interfaces"] = {}
                    
                for iface_name, iface_config in network_config["interfaces"].items():
                    if iface_name not in current_config["interfaces"]:
                        current_config["interfaces"][iface_name] = {}
                    
                    # Обновляем настройки интерфейса
                    for key, value in iface_config.items():
                        current_config["interfaces"][iface_name][key] = value
            
            # Обновляем настройки WAN
            if "wan_interface" in network_config:
                current_config["wan_interface"] = network_config["wan_interface"]
                logger.info(f"Updated WAN interface: {network_config['wan_interface']}")
            
            # Обновляем настройки LAN
            if "lan_interface" in network_config:
                current_config["lan_interface"] = network_config["lan_interface"]
                logger.info(f"Updated LAN interface: {network_config['lan_interface']}")
            
            # Обновляем настройки DHCP сервера
            if "dhcp_server" in network_config:
                current_config["dhcp_server"] = network_config["dhcp_server"]
                logger.info(f"Updated DHCP server settings: {network_config['dhcp_server']}")
            
            # Сохраняем обновленную конфигурацию в network.yaml
            logger.info(f"Saving updated configuration to {network_yaml_path}")
            YAMLHandler.write_yaml(network_yaml_path, current_config)
            
            # Обновляем также user_config.yaml для совместимости
            updated_config = YAMLHandler.update_yaml(
                USER_CONFIG_FILE, 
                {"network": current_config},
                create_if_missing=True
            )
            
            return {
                "success": True,
                "message": "Network configuration updated successfully",
                "config": current_config
            }
        else:
            # Стандартное обновление конфигурации
            updated_config = YAMLHandler.update_yaml(
                USER_CONFIG_FILE, 
                {"network": network_config},
                create_if_missing=True
            )
            
            # Также обновляем network.yaml для совместимости
            import os
            from config import CONFIG_DIR
            network_yaml_path = os.path.join(CONFIG_DIR, "network.yaml")
            
            # Если в запросе есть hostname или dns_servers, применяем их к network.yaml
            if "hostname" in network_config or "dns_servers" in network_config:
                current_network_config = YAMLHandler.read_yaml(network_yaml_path) if os.path.exists(network_yaml_path) else {}
                
                if "hostname" in network_config:
                    current_network_config["hostname"] = network_config["hostname"]
                
                if "dns_servers" in network_config:
                    current_network_config["dns_servers"] = network_config["dns_servers"]
                
                YAMLHandler.write_yaml(network_yaml_path, current_network_config)
            
            return {
                "success": True,
                "message": "Network configuration updated successfully",
                "config": updated_config.get("network", {})
            }
    except Exception as e:
        logger.error(f"Error updating network configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating network configuration: {str(e)}")

@router.post("/restart")
async def restart_network(interface_data: Dict[str, Any] = Body(None)) -> Dict[str, Any]:
    """
    Restart networking service
    
    Parameters:
        interface_data: Optional dict with interface name to restart just one interface
        Example: {"interface": "eth0"}
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # Если указан конкретный интерфейс, перезапускаем только его
        if interface_data and "interface" in interface_data:
            interface_name = interface_data["interface"]
            logger.info(f"Restarting specific interface: {interface_name}")
            
            # Здесь может быть системно-зависимый код для перезапуска конкретного интерфейса
            # В идеале, надо реализовать этот метод в SystemUtils
            
            # Для демонстрации используем общий метод restart_network_service
            result = SystemUtils.restart_network_service()
            
            if result:
                return {
                    "success": True,
                    "message": f"Interface {interface_name} restarted successfully"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to restart interface {interface_name}"
                }
        else:
            # Перезапускаем всю сетевую службу
            logger.info("Restarting entire network service")
            result = SystemUtils.restart_network_service()
            
            if result:
                return {
                    "success": True,
                    "message": "Network service restarted successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to restart network service"
                }
    except Exception as e:
        logger.error(f"Error restarting network service: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error restarting network service: {str(e)}")
