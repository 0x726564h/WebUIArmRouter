import os
import yaml
import json
import logging
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigManager:
    """
    Менеджер конфигураций для работы с настройками системы.
    
    Этот класс предоставляет методы для чтения и записи настроек системы,
    а также взаимодействия с системными командами для применения изменений.
    """
    
    # Путь к директории с конфигурациями
    CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config')
    
    # В демонстрационном режиме используем файл с настройками по умолчанию
    DEFAULT_CONFIG = {
        "network": {
            "interfaces": [
                {
                    "name": "eth0",
                    "type": "ethernet",
                    "enabled": True,
                    "settings": {
                        "ipv4": {
                            "method": "dhcp",
                            "address": "",
                            "netmask": "",
                            "gateway": ""
                        },
                        "ipv6": {
                            "enabled": False,
                            "method": "auto",
                            "address": "",
                            "prefix_length": 64,
                            "gateway": ""
                        }
                    }
                },
                {
                    "name": "eth1",
                    "type": "ethernet",
                    "enabled": False,
                    "settings": {
                        "ipv4": {
                            "method": "static",
                            "address": "192.168.1.1",
                            "netmask": "255.255.255.0",
                            "gateway": ""
                        },
                        "ipv6": {
                            "enabled": False,
                            "method": "auto",
                            "address": "",
                            "prefix_length": 64,
                            "gateway": ""
                        }
                    }
                }
            ]
        },
        "wifi": {
            "adapters": [
                {
                    "name": "wlan0",
                    "enabled": True,
                    "mode": "ap",
                    "ap_settings": {
                        "ssid": "ArmRouter",
                        "password": "securepassword",
                        "security": "wpa2",
                        "channel": 6,
                        "hidden": False
                    },
                    "client_settings": {
                        "ssid": "",
                        "password": "",
                        "security": "wpa2",
                        "hidden": False
                    },
                    "ip_settings": {
                        "ipv4": {
                            "method": "static",
                            "address": "192.168.4.1",
                            "netmask": "255.255.255.0",
                            "gateway": ""
                        }
                    }
                }
            ]
        },
        "firewall": {
            "enabled": True,
            "allow_ping": True,
            "allow_established": True,
            "allow_related": True,
            "default_policy": {
                "input": "DROP",
                "forward": "DROP",
                "output": "ACCEPT"
            },
            "open_ports": [
                {
                    "port": 22,
                    "protocol": "tcp",
                    "description": "Allow SSH"
                },
                {
                    "port": 80,
                    "protocol": "tcp",
                    "description": "Allow HTTP"
                },
                {
                    "port": 443,
                    "protocol": "tcp",
                    "description": "Allow HTTPS"
                }
            ],
            "rules": [
                {
                    "name": "Allow SSH",
                    "chain": "INPUT",
                    "protocol": "tcp",
                    "destination_port": "22",
                    "action": "ACCEPT",
                    "priority": 100,
                    "enabled": True
                },
                {
                    "name": "Allow HTTP",
                    "chain": "INPUT",
                    "protocol": "tcp",
                    "destination_port": "80",
                    "action": "ACCEPT",
                    "priority": 100,
                    "enabled": True
                },
                {
                    "name": "Allow HTTPS",
                    "chain": "INPUT",
                    "protocol": "tcp",
                    "destination_port": "443",
                    "action": "ACCEPT",
                    "priority": 100,
                    "enabled": True
                }
            ]
        },
        "tunnel": {
            "enabled": False,
            "traffic_routing": {
                "mode": "all",
                "tunnel_selection": "first_available",
                "geo_countries": ["US", "GB", "DE"],
                "ip_addresses": ["8.8.8.8/32", "1.1.1.1/32"],
                "domains": ["example.com", "example.org"],
                "load_balance_algorithm": "round_robin"
            },
            "tunnels": [
                {
                    "name": "OpenVPN US",
                    "type": "openvpn",
                    "enabled": False,
                    "priority": 10,
                    "default": True,
                    "config": {
                        "config_file": "/etc/openvpn/us-server.conf",
                        "auth": {
                            "username": "demo_user",
                            "password": "demo_pass"
                        },
                        "advanced": {
                            "mtu": 1500,
                            "cipher": "AES-256-GCM"
                        }
                    }
                },
                {
                    "name": "WireGuard DE",
                    "type": "wireguard",
                    "enabled": False,
                    "priority": 20,
                    "default": False,
                    "config": {
                        "interface": "wg0",
                        "private_key": "private_key_placeholder",
                        "address": "10.10.10.2/24",
                        "dns": ["8.8.8.8", "1.1.1.1"],
                        "peers": [
                            {
                                "public_key": "public_key_placeholder",
                                "endpoint": "de-server.example.com:51820",
                                "allowed_ips": ["0.0.0.0/0"],
                                "keep_alive": 25
                            }
                        ]
                    }
                }
            ],
            "tor": {
                "enabled": False,
                "use_bridges": False,
                "use_redsocks": True,
                "use_socks2tun": False,
                "exit_country": "us",
                "bridges": [
                    {
                        "type": "obfs4",
                        "address": "obfs4 placeholderipaddress:443 fingerprint=placeholder cert=placeholder iat-mode=0"
                    }
                ],
                "tunnel_proxy": {
                    "enabled": False,
                    "tunnel_name": "OpenVPN US"
                }
            }
        },
        "routing": {
            "static_routes": [
                {
                    "destination": "192.168.100.0/24",
                    "gateway": "192.168.1.254",
                    "interface": "eth1",
                    "metric": 100,
                    "enabled": True
                }
            ],
            "advanced": {
                "ip_forward": True,
                "use_custom_rules": False,
                "custom_rules_file": "/etc/network/custom-routing.sh"
            }
        },
        "system": {
            "hostname": "ArmRouter",
            "timezone": "UTC",
            "ntp": {
                "enabled": True,
                "servers": ["0.pool.ntp.org", "1.pool.ntp.org"]
            },
            "logging": {
                "level": "info",
                "remote_syslog": {
                    "enabled": False,
                    "server": "",
                    "port": 514
                }
            },
            "power": {
                "cpu_governor": "ondemand",
                "usb_power_save": False,
                "scheduled_reboot": {
                    "enabled": False,
                    "time": "03:00",
                    "days": ["sun"]
                }
            }
        },
        "access": {
            "ssh": {
                "enabled": True,
                "port": 22,
                "allow_root": False,
                "password_auth": True,
                "key_auth": True
            },
            "web_ui": {
                "port": 80,
                "https": {
                    "enabled": False,
                    "port": 443,
                    "certificate": "self-signed"
                },
                "session_timeout": 30
            },
            "ip_restrictions": {
                "enabled": False,
                "allowed_ips": []
            }
        },
        "modules": {
            "installed": [
                {
                    "id": "openvpn",
                    "name": "OpenVPN",
                    "version": "1.0.0",
                    "enabled": True,
                    "autostart": True
                },
                {
                    "id": "wireguard",
                    "name": "WireGuard",
                    "version": "1.0.0",
                    "enabled": True,
                    "autostart": True
                },
                {
                    "id": "tor",
                    "name": "Tor",
                    "version": "1.0.0",
                    "enabled": False,
                    "autostart": False
                }
            ]
        }
    }
    
    @staticmethod
    def get_config_path(config_name: str) -> str:
        """
        Получить путь к файлу конфигурации.
        
        Args:
            config_name: Имя конфигурации (без расширения)
            
        Returns:
            Полный путь к файлу конфигурации
        """
        # Создать директорию конфигурации, если она не существует
        os.makedirs(ConfigManager.CONFIG_DIR, exist_ok=True)
        
        # Путь к файлу конфигурации
        return os.path.join(ConfigManager.CONFIG_DIR, f"{config_name}.yaml")
    
    @staticmethod
    def read_config(config_name: str) -> Dict[str, Any]:
        """
        Прочитать конфигурацию из файла.
        
        Args:
            config_name: Имя конфигурации (без расширения)
            
        Returns:
            Словарь с конфигурацией или пустой словарь, если файл не существует
        """
        config_path = ConfigManager.get_config_path(config_name)
        
        # В демонстрационном режиме, если файл не существует, возвращаем настройки по умолчанию
        if not os.path.exists(config_path):
            logger.info(f"Config file {config_path} not found, using default values")
            return ConfigManager.DEFAULT_CONFIG.get(config_name, {})
        
        try:
            with open(config_path, 'r') as file:
                return yaml.safe_load(file) or {}
        except Exception as e:
            logger.error(f"Error reading config {config_name}: {str(e)}")
            return {}
    
    @staticmethod
    def write_config(config_name: str, config_data: Dict[str, Any]) -> bool:
        """
        Записать конфигурацию в файл.
        
        Args:
            config_name: Имя конфигурации (без расширения)
            config_data: Данные конфигурации
            
        Returns:
            True, если запись прошла успешно, иначе False
        """
        config_path = ConfigManager.get_config_path(config_name)
        
        try:
            with open(config_path, 'w') as file:
                yaml.dump(config_data, file, default_flow_style=False)
            return True
        except Exception as e:
            logger.error(f"Error writing config {config_name}: {str(e)}")
            return False
    
    @staticmethod
    def update_config(config_name: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию.
        
        Args:
            config_name: Имя конфигурации (без расширения)
            updates: Данные для обновления
            
        Returns:
            Обновленная конфигурация
        """
        current_config = ConfigManager.read_config(config_name)
        
        # В демонстрационном режиме просто заменяем конфигурацию
        updated_config = updates
        
        ConfigManager.write_config(config_name, updated_config)
        return updated_config
    
    @staticmethod
    def execute_command(command: str) -> tuple:
        """
        Выполнить системную команду.
        
        Args:
            command: Команда для выполнения
            
        Returns:
            Кортеж (код выхода, stdout, stderr)
        """
        # В демонстрационном режиме не выполняем системные команды
        logger.info(f"Would execute command: {command}")
        return (0, "Success", "")
    
    @staticmethod
    def get_network_config() -> Dict[str, Any]:
        """
        Получить текущую конфигурацию сети.
        
        Returns:
            Словарь с конфигурацией сети
        """
        return ConfigManager.read_config("network")
    
    @staticmethod
    def update_network_config(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию сети.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленная конфигурация сети
        """
        return ConfigManager.update_config("network", updates)
    
    @staticmethod
    def get_wifi_config() -> Dict[str, Any]:
        """
        Получить текущую конфигурацию WiFi с поддержкой нескольких адаптеров.
        
        Returns:
            Словарь с конфигурацией WiFi
        """
        return ConfigManager.read_config("wifi")
    
    @staticmethod
    def update_wifi_config(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию WiFi с поддержкой нескольких адаптеров.
        
        Args:
            updates: Данные для обновления с ключом 'adapters' для указания настроек каждого адаптера
            
        Returns:
            Обновленная конфигурация WiFi
        """
        return ConfigManager.update_config("wifi", updates)
    
    @staticmethod
    def get_firewall_config() -> Dict[str, Any]:
        """
        Получить текущую конфигурацию брандмауэра.
        
        Returns:
            Словарь с конфигурацией брандмауэра
        """
        return ConfigManager.read_config("firewall")
    
    @staticmethod
    def update_firewall_config(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию брандмауэра.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленная конфигурация брандмауэра
        """
        return ConfigManager.update_config("firewall", updates)
    
    @staticmethod
    def get_tunnel_config() -> Dict[str, Any]:
        """
        Получить текущую конфигурацию туннелей.
        
        Returns:
            Словарь с конфигурацией туннелей
        """
        return ConfigManager.read_config("tunnel")
    
    @staticmethod
    def update_tunnel_config(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию туннелей.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленная конфигурация туннелей
        """
        return ConfigManager.update_config("tunnel", updates)
    
    @staticmethod
    def get_routing_config() -> Dict[str, Any]:
        """
        Получить текущую конфигурацию маршрутизации.
        
        Returns:
            Словарь с конфигурацией маршрутизации
        """
        return ConfigManager.read_config("routing")
    
    @staticmethod
    def update_routing_config(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить конфигурацию маршрутизации.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленная конфигурация маршрутизации
        """
        return ConfigManager.update_config("routing", updates)
    
    @staticmethod
    def get_system_settings() -> Dict[str, Any]:
        """
        Получить системные настройки.
        
        Returns:
            Словарь с системными настройками
        """
        return ConfigManager.read_config("system")
    
    @staticmethod
    def update_system_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить системные настройки.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленные системные настройки
        """
        return ConfigManager.update_config("system", updates)
    
    @staticmethod
    def get_access_settings() -> Dict[str, Any]:
        """
        Получить настройки доступа.
        
        Returns:
            Словарь с настройками доступа
        """
        return ConfigManager.read_config("access")
    
    @staticmethod
    def update_access_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить настройки доступа.
        
        Args:
            updates: Данные для обновления
            
        Returns:
            Обновленные настройки доступа
        """
        return ConfigManager.update_config("access", updates)
    
    @staticmethod
    def get_modules() -> Dict[str, Any]:
        """
        Получить список модулей.
        
        Returns:
            Словарь с модулями
        """
        modules_config = ConfigManager.read_config("modules")
        return modules_config
    
    @staticmethod
    def get_module(module_id: str) -> Dict[str, Any]:
        """
        Получить информацию о модуле.
        
        Args:
            module_id: Идентификатор модуля
            
        Returns:
            Словарь с информацией о модуле или пустой словарь, если модуль не найден
        """
        modules_config = ConfigManager.get_modules()
        
        for module in modules_config.get("installed", []):
            if module.get("id") == module_id:
                return module
        
        return {}
    
    @staticmethod
    def update_module(module_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обновить модуль.
        
        Args:
            module_id: Идентификатор модуля
            updates: Данные для обновления
            
        Returns:
            Обновленная информация о модуле или пустой словарь, если модуль не найден
        """
        modules_config = ConfigManager.get_modules()
        
        # Проверяем, существует ли модуль
        module_exists = False
        for i, module in enumerate(modules_config.get("installed", [])):
            if module.get("id") == module_id:
                # Обновляем модуль
                modules_config["installed"][i].update(updates)
                module_exists = True
                updated_module = modules_config["installed"][i]
                break
        
        if not module_exists:
            return {}
        
        # Сохраняем обновленную конфигурацию
        ConfigManager.update_config("modules", modules_config)
        
        return updated_module
    
    @staticmethod
    def get_available_modules() -> Dict[str, Any]:
        """
        Получить список доступных для установки модулей.
        
        Returns:
            Словарь с доступными модулями
        """
        # В демонстрационном режиме возвращаем фиксированный список модулей
        available_modules = {
            "available": [
                {
                    "id": "zerotier",
                    "name": "ZeroTier One",
                    "description": "Secure mesh network virtualization",
                    "version": "1.0.0",
                    "size": "2.5 MB",
                    "dependencies": []
                },
                {
                    "id": "sstp",
                    "name": "SSTP VPN",
                    "description": "Secure Socket Tunneling Protocol for VPN",
                    "version": "1.0.0",
                    "size": "1.8 MB",
                    "dependencies": []
                },
                {
                    "id": "ikev2",
                    "name": "IKEv2/IPsec",
                    "description": "Internet Key Exchange version 2 with IPsec",
                    "version": "1.0.0",
                    "size": "3.2 MB",
                    "dependencies": []
                },
                {
                    "id": "pptp",
                    "name": "PPTP VPN",
                    "description": "Point-to-Point Tunneling Protocol",
                    "version": "1.0.0",
                    "size": "1.2 MB",
                    "dependencies": []
                }
            ]
        }
        
        return available_modules
    
    @staticmethod
    def install_module(module_id: str) -> Dict[str, Any]:
        """
        Установить модуль.
        
        Args:
            module_id: Идентификатор модуля
            
        Returns:
            Словарь с информацией об установленном модуле или пустой словарь, если модуль не найден
        """
        available_modules = ConfigManager.get_available_modules()
        
        # Проверяем, существует ли модуль
        module_to_install = None
        for module in available_modules.get("available", []):
            if module.get("id") == module_id:
                module_to_install = module
                break
        
        if module_to_install is None:
            return {}
        
        # Получаем текущие модули
        modules_config = ConfigManager.get_modules()
        
        # Добавляем новый модуль
        new_module = {
            "id": module_to_install["id"],
            "name": module_to_install["name"],
            "version": module_to_install["version"],
            "enabled": True,
            "autostart": True
        }
        
        if "installed" not in modules_config:
            modules_config["installed"] = []
        
        modules_config["installed"].append(new_module)
        
        # Сохраняем обновленную конфигурацию
        ConfigManager.update_config("modules", modules_config)
        
        return new_module
    
    @staticmethod
    def remove_module(module_id: str) -> bool:
        """
        Удалить модуль.
        
        Args:
            module_id: Идентификатор модуля
            
        Returns:
            True, если модуль успешно удален, иначе False
        """
        modules_config = ConfigManager.get_modules()
        
        # Проверяем, существует ли модуль
        module_exists = False
        for i, module in enumerate(modules_config.get("installed", [])):
            if module.get("id") == module_id:
                # Удаляем модуль
                modules_config["installed"].pop(i)
                module_exists = True
                break
        
        if not module_exists:
            return False
        
        # Сохраняем обновленную конфигурацию
        ConfigManager.update_config("modules", modules_config)
        
        return True