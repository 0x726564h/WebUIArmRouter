import os
import re
import json
import socket
import platform
import subprocess
import logging
import psutil
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SystemUtils:
    """
    Утилиты для взаимодействия с системой.
    
    Этот класс предоставляет методы для получения информации о системе,
    а также для выполнения системных команд.
    """
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """
        Получить общую информацию о системе.
        
        Returns:
            Словарь с информацией о системе
        """
        try:
            system_info = {
                "hostname": socket.gethostname(),
                "platform": platform.system(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
                "kernel": platform.release()
            }
            
            # Для Linux получаем дополнительную информацию
            if platform.system() == "Linux":
                # Получаем информацию о дистрибутиве
                if os.path.exists("/etc/os-release"):
                    with open("/etc/os-release", "r") as f:
                        os_release = {}
                        for line in f:
                            if "=" in line:
                                key, value = line.rstrip().split("=", 1)
                                os_release[key] = value.strip('"')
                    
                    if "PRETTY_NAME" in os_release:
                        system_info["distro"] = os_release["PRETTY_NAME"]
                    elif "NAME" in os_release and "VERSION" in os_release:
                        system_info["distro"] = f"{os_release['NAME']} {os_release['VERSION']}"
                    else:
                        system_info["distro"] = "Linux"
                
                # Определяем, является ли система Armbian
                if os.path.exists("/etc/armbian-release"):
                    system_info["is_armbian"] = True
                    
                    with open("/etc/armbian-release", "r") as f:
                        armbian_release = {}
                        for line in f:
                            if "=" in line:
                                key, value = line.rstrip().split("=", 1)
                                armbian_release[key] = value.strip('"')
                    
                    system_info["armbian_version"] = armbian_release.get("VERSION", "Unknown")
                    system_info["armbian_codename"] = armbian_release.get("CODENAME", "Unknown")
                else:
                    system_info["is_armbian"] = False
            
            # Определяем часовой пояс
            try:
                # Для Linux
                if platform.system() == "Linux":
                    if os.path.exists("/etc/timezone"):
                        with open("/etc/timezone", "r") as f:
                            system_info["timezone"] = f.read().strip()
                    else:
                        # Получаем через localtime
                        localtime_path = os.path.realpath("/etc/localtime")
                        if "/zoneinfo/" in localtime_path:
                            system_info["timezone"] = localtime_path.split("/zoneinfo/", 1)[1]
                        else:
                            system_info["timezone"] = "UTC"
                else:
                    # Для других систем используем Python
                    import time
                    system_info["timezone"] = time.tzname[0]
            except Exception as e:
                logger.error(f"Ошибка определения часового пояса: {str(e)}")
                system_info["timezone"] = "UTC"
            
            return system_info
        except Exception as e:
            logger.error(f"Ошибка получения информации о системе: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    def get_cpu_info() -> Dict[str, Any]:
        """
        Получить информацию о процессоре.
        
        Returns:
            Словарь с информацией о процессоре
        """
        try:
            cpu_count = psutil.cpu_count(logical=False)
            cpu_count_logical = psutil.cpu_count(logical=True)
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            cpu_info = {
                "cores": cpu_count if cpu_count else 1,
                "threads": cpu_count_logical if cpu_count_logical else 1,
                "usage": cpu_percent,
                "per_cpu": psutil.cpu_percent(interval=0.1, percpu=True)
            }
            
            # Для Linux получаем дополнительную информацию
            if platform.system() == "Linux":
                if os.path.exists("/proc/cpuinfo"):
                    with open("/proc/cpuinfo", "r") as f:
                        cpuinfo = f.read()
                    
                    # Получаем модель процессора
                    model_pattern = re.compile(r"model name\s+:\s+(.+)")
                    model_match = model_pattern.search(cpuinfo)
                    if model_match:
                        cpu_info["model"] = model_match.group(1)
                    
                    # Получаем частоту процессора
                    freq_pattern = re.compile(r"cpu MHz\s+:\s+(.+)")
                    freq_match = freq_pattern.search(cpuinfo)
                    if freq_match:
                        cpu_info["frequency"] = f"{float(freq_match.group(1)) / 1000:.2f} GHz"
            
            # Получаем температуру процессора, если доступно
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    # Проверяем разные ключи для разных систем
                    for key in ["cpu_thermal", "coretemp", "cpu"]:
                        if key in temps and temps[key]:
                            cpu_info["temperature"] = temps[key][0].current
                            break
            
            return cpu_info
        except Exception as e:
            logger.error(f"Ошибка получения информации о процессоре: {str(e)}")
            return {"usage": 0, "cores": 1, "threads": 1}
    
    @staticmethod
    def get_memory_info() -> Dict[str, Any]:
        """
        Получить информацию о памяти.
        
        Returns:
            Словарь с информацией о памяти
        """
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            memory_info = {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "free": memory.free,
                "percent": memory.percent,
                "swap_total": swap.total,
                "swap_used": swap.used,
                "swap_free": swap.free,
                "swap_percent": swap.percent
            }
            
            return memory_info
        except Exception as e:
            logger.error(f"Ошибка получения информации о памяти: {str(e)}")
            return {"total": 0, "available": 0, "used": 0, "free": 0, "percent": 0}
    
    @staticmethod
    def get_disk_info() -> Dict[str, Any]:
        """
        Получить информацию о дисках.
        
        Returns:
            Словарь с информацией о дисках
        """
        try:
            partitions = psutil.disk_partitions()
            
            disk_info = {}
            
            for partition in partitions:
                if not partition.mountpoint:
                    continue
                
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    
                    disk_info[partition.mountpoint] = {
                        "device": partition.device,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent
                    }
                except (PermissionError, OSError) as e:
                    # Пропускаем недоступные разделы
                    continue
            
            return disk_info
        except Exception as e:
            logger.error(f"Ошибка получения информации о дисках: {str(e)}")
            return {}
    
    @staticmethod
    def get_uptime() -> Dict[str, Any]:
        """
        Получить аптайм системы.
        
        Returns:
            Словарь с аптаймом системы
        """
        try:
            # Получаем время запуска системы
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time
            
            # Форматируем аптайм
            days = uptime.days
            hours, remainder = divmod(uptime.seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            uptime_str = ""
            if days > 0:
                uptime_str += f"{days} д "
            
            uptime_str += f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            
            uptime_info = {
                "uptime": uptime_str,
                "uptime_seconds": uptime.total_seconds(),
                "boot_time": boot_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return uptime_info
        except Exception as e:
            logger.error(f"Ошибка получения аптайма системы: {str(e)}")
            return {"uptime": "Unknown", "uptime_seconds": 0, "boot_time": "Unknown"}
    
    @staticmethod
    def get_network_interfaces() -> Dict[str, Any]:
        """
        Получить информацию о сетевых интерфейсах.
        
        Returns:
            Словарь с информацией о сетевых интерфейсах
        """
        try:
            interfaces = {}
            
            # Получаем адреса интерфейсов
            net_if_addrs = psutil.net_if_addrs()
            
            # Получаем статистику интерфейсов
            net_if_stats = psutil.net_if_stats()
            
            # Получаем сетевые счетчики
            net_io_counters = psutil.net_io_counters(pernic=True)
            
            for name, addrs in net_if_addrs.items():
                # Пропускаем локальный интерфейс
                if name == "lo" or name.startswith("docker") or name.startswith("br-"):
                    continue
                
                interfaces[name] = {
                    "addresses": [],
                    "stats": {}
                }
                
                # Добавляем адреса
                for addr in addrs:
                    address_info = {
                        "family": str(addr.family.name if hasattr(addr.family, "name") else addr.family),
                        "address": addr.address
                    }
                    
                    if addr.netmask:
                        address_info["netmask"] = addr.netmask
                    
                    if addr.broadcast:
                        address_info["broadcast"] = addr.broadcast
                    
                    if addr.ptp:
                        address_info["ptp"] = addr.ptp
                    
                    interfaces[name]["addresses"].append(address_info)
                
                # Добавляем статистику
                if name in net_if_stats:
                    stats = net_if_stats[name]
                    
                    interfaces[name]["stats"] = {
                        "isup": stats.isup,
                        "duplex": str(stats.duplex.name if hasattr(stats.duplex, "name") else stats.duplex),
                        "speed": stats.speed,
                        "mtu": stats.mtu
                    }
                
                # Добавляем счетчики
                if name in net_io_counters:
                    counters = net_io_counters[name]
                    
                    interfaces[name]["stats"]["rx_bytes"] = counters.bytes_recv
                    interfaces[name]["stats"]["tx_bytes"] = counters.bytes_sent
                    interfaces[name]["stats"]["rx_packets"] = counters.packets_recv
                    interfaces[name]["stats"]["tx_packets"] = counters.packets_sent
                    interfaces[name]["stats"]["rx_errors"] = counters.errin
                    interfaces[name]["stats"]["tx_errors"] = counters.errout
                    interfaces[name]["stats"]["rx_dropped"] = counters.dropin
                    interfaces[name]["stats"]["tx_dropped"] = counters.dropout
            
            return interfaces
        except Exception as e:
            logger.error(f"Ошибка получения информации о сетевых интерфейсах: {str(e)}")
            return {}
    
    @staticmethod
    def get_routing_table() -> List[Dict[str, Any]]:
        """
        Получить таблицу маршрутизации.
        
        Returns:
            Список маршрутов
        """
        try:
            routes = []
            
            # Получаем таблицу маршрутизации с помощью команды route
            output = subprocess.check_output(["route", "-n"], universal_newlines=True)
            
            # Парсим вывод
            lines = output.strip().split('\n')
            
            # Пропускаем заголовки (первые 2 строки)
            for line in lines[2:]:
                fields = line.split()
                
                if len(fields) >= 8:
                    route = {
                        "destination": fields[0],
                        "gateway": fields[1],
                        "netmask": fields[2],
                        "flags": fields[3],
                        "metric": int(fields[4]),
                        "ref": int(fields[5]),
                        "use": int(fields[6]),
                        "interface": fields[7]
                    }
                    
                    routes.append(route)
            
            return routes
        except Exception as e:
            logger.error(f"Ошибка получения таблицы маршрутизации: {str(e)}")
            return []
    
    @staticmethod
    def get_wifi_adapters() -> List[str]:
        """
        Получить список доступных WiFi адаптеров.
        
        Returns:
            Список имен доступных WiFi адаптеров
        """
        wifi_interfaces = []
        
        try:
            for name, data in SystemUtils.get_network_interfaces().items():
                if name.startswith(("wlan", "wlp")):
                    wifi_interfaces.append(name)
        except Exception as e:
            logger.error(f"Ошибка получения списка WiFi адаптеров: {str(e)}")
        
        return wifi_interfaces
    
    @staticmethod
    def get_wifi_networks(adapter_name: str = None) -> List[Dict[str, Any]]:
        """
        Получить список доступных WiFi сетей.
        
        Args:
            adapter_name: Имя WiFi адаптера для сканирования. Если None, будет использован первый доступный.
            
        Returns:
            Список WiFi сетей
        """
        try:
            # Получаем список WiFi интерфейсов
            wifi_interfaces = SystemUtils.get_wifi_adapters()
            
            if not wifi_interfaces:
                logger.warning("Нет доступных WiFi интерфейсов")
                return []
            
            # Определяем интерфейс для сканирования
            scan_interface = adapter_name if adapter_name and adapter_name in wifi_interfaces else wifi_interfaces[0]
            logger.info(f"Используем интерфейс {scan_interface} для сканирования WiFi сетей")
            
            # Сканируем сети на выбранном WiFi интерфейсе
            networks = []
            
            try:
                # Пробуем использовать iw для сканирования в Linux
                if os.path.exists("/usr/sbin/iw") or os.path.exists("/sbin/iw") or os.path.exists("/usr/bin/iw"):
                    logger.info(f"Сканирование WiFi сетей с помощью iw на интерфейсе {scan_interface}")
                    process = subprocess.Popen(
                        ["iw", "dev", scan_interface, "scan"],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        universal_newlines=True
                    )
                    output, error = process.communicate()
                    
                    if process.returncode != 0:
                        logger.error(f"Ошибка сканирования WiFi: {error}")
                        return []
                    
                    # Парсим вывод iw
                    current_network = None
                    
                    for line in output.split('\n'):
                        line = line.strip()
                        
                        if line.startswith("BSS "):
                            # Новая сеть
                            if current_network:
                                networks.append(current_network)
                            
                            # Получаем MAC адрес
                            mac = line.split('(')[0].strip()[4:]
                            
                            current_network = {
                                "bssid": mac,
                                "signal": -100,
                                "channel": 0,
                                "encryption": "unknown",
                                "frequency": 0
                            }
                        elif current_network:
                            if line.startswith("SSID: "):
                                current_network["ssid"] = line[6:]
                            elif line.startswith("signal: "):
                                # Convert dBm to signal quality (0-100%)
                                signal_dbm = float(line.split()[1])
                                if signal_dbm <= -100:
                                    signal_strength = 0
                                elif signal_dbm >= -50:
                                    signal_strength = 100
                                else:
                                    signal_strength = 2 * (signal_dbm + 100)
                                
                                current_network["signal"] = int(signal_strength)
                            elif line.startswith("freq: "):
                                current_network["frequency"] = int(line.split()[1])
                                
                                # Рассчитываем канал на основе частоты
                                freq = int(line.split()[1])
                                
                                if freq >= 2412 and freq <= 2484:
                                    # 2.4 GHz
                                    if freq == 2484:
                                        current_network["channel"] = 14
                                    else:
                                        current_network["channel"] = (freq - 2412) // 5 + 1
                                elif freq >= 5170 and freq <= 5825:
                                    # 5 GHz
                                    current_network["channel"] = (freq - 5170) // 5 + 34
                                elif freq >= 5955 and freq <= 7115:
                                    # 6 GHz
                                    current_network["channel"] = (freq - 5955) // 5 + 1
                            elif "WPA" in line:
                                current_network["encryption"] = "WPA"
                            elif "WEP" in line:
                                current_network["encryption"] = "WEP"
                
                # Добавляем последнюю сеть
                if current_network:
                    networks.append(current_network)
            
            except subprocess.CalledProcessError:
                # Если iw не работает, пробуем iwlist
                try:
                    # Используем iwlist для сканирования
                    output = subprocess.check_output(["iwlist", scan_interface, "scan"], universal_newlines=True)
                    
                    # Парсим вывод
                    current_network = None
                    
                    for line in output.split('\n'):
                        line = line.strip()
                        
                        if line.startswith("Cell "):
                            # Новая сеть
                            if current_network:
                                networks.append(current_network)
                            
                            # Получаем MAC адрес
                            mac = line.split('Address: ')[1]
                            
                            current_network = {
                                "bssid": mac,
                                "signal": 0,
                                "channel": 0,
                                "encryption": "unknown",
                                "frequency": 0
                            }
                        elif current_network:
                            if line.startswith("ESSID:"):
                                current_network["ssid"] = line[7:-1]
                            elif line.startswith("Quality="):
                                quality = line.split('=')[1].split(' ')[0]
                                if '/' in quality:
                                    current_value, max_value = quality.split('/')
                                    current_network["signal"] = int(float(current_value) / float(max_value) * 100)
                                else:
                                    current_network["signal"] = int(quality)
                            elif line.startswith("Frequency:"):
                                freq_str = line.split(':')[1].split(' ')[0]
                                current_network["frequency"] = float(freq_str) * 1000
                                
                                # Извлекаем канал из строки
                                channel_match = re.search(r"Channel\s+(\d+)", line)
                                if channel_match:
                                    current_network["channel"] = int(channel_match.group(1))
                            elif "Encryption key:on" in line:
                                current_network["encryption"] = "WEP"
                            elif "WPA" in line:
                                current_network["encryption"] = "WPA"
                    
                    # Добавляем последнюю сеть
                    if current_network:
                        networks.append(current_network)
                
                except subprocess.CalledProcessError:
                    # Не удалось отсканировать сети
                    pass
            
            # Сортируем сети по уровню сигнала (от сильного к слабому)
            networks.sort(key=lambda x: x.get("signal", 0), reverse=True)
            
            return networks
        
        except Exception as e:
            logger.error(f"Ошибка получения списка WiFi сетей: {str(e)}")
            return []
    
    @staticmethod
    def set_hostname(hostname: str) -> bool:
        """
        Установить имя хоста.
        
        Args:
            hostname: Новое имя хоста
            
        Returns:
            True, если операция выполнена успешно, иначе False
        """
        try:
            # Проверяем, что имя хоста допустимо
            if not re.match(r"^[a-zA-Z0-9-]+$", hostname):
                logger.error(f"Недопустимое имя хоста: {hostname}")
                return False
            
            # Устанавливаем имя хоста
            result = subprocess.run(["hostnamectl", "set-hostname", hostname], check=True)
            
            # Также обновляем /etc/hosts
            with open("/etc/hosts", "r") as f:
                hosts = f.readlines()
            
            new_hosts = []
            for line in hosts:
                if re.search(r"127\.0\.0\.1\s+localhost", line):
                    # Обновляем строку с localhost
                    new_hosts.append(f"127.0.0.1\tlocalhost {hostname}\n")
                elif re.search(r"127\.0\.1\.1", line):
                    # Обновляем строку с hostname
                    new_hosts.append(f"127.0.1.1\t{hostname}\n")
                else:
                    new_hosts.append(line)
            
            with open("/etc/hosts", "w") as f:
                f.writelines(new_hosts)
            
            return True
        except Exception as e:
            logger.error(f"Ошибка установки имени хоста: {str(e)}")
            return False
    
    @staticmethod
    def set_timezone(timezone: str) -> bool:
        """
        Установить часовой пояс.
        
        Args:
            timezone: Новый часовой пояс
            
        Returns:
            True, если операция выполнена успешно, иначе False
        """
        try:
            # Проверяем, что часовой пояс допустим
            if not os.path.exists(f"/usr/share/zoneinfo/{timezone}"):
                logger.error(f"Недопустимый часовой пояс: {timezone}")
                return False
            
            # Устанавливаем часовой пояс
            result = subprocess.run(["timedatectl", "set-timezone", timezone], check=True)
            
            return True
        except Exception as e:
            logger.error(f"Ошибка установки часового пояса: {str(e)}")
            return False
    
    @staticmethod
    def restart_network_service() -> bool:
        """
        Перезапустить сетевую службу.
        
        Returns:
            True, если операция выполнена успешно, иначе False
        """
        try:
            # Сначала пробуем NetworkManager
            try:
                result = subprocess.run(["systemctl", "restart", "NetworkManager"], check=True)
                return True
            except subprocess.CalledProcessError:
                # Если NetworkManager не работает, пробуем networking
                try:
                    result = subprocess.run(["systemctl", "restart", "networking"], check=True)
                    return True
                except subprocess.CalledProcessError:
                    # Если networking не работает, пробуем netplan
                    try:
                        result = subprocess.run(["netplan", "apply"], check=True)
                        return True
                    except subprocess.CalledProcessError:
                        # Если все не работает, возвращаем False
                        return False
        except Exception as e:
            logger.error(f"Ошибка перезапуска сетевой службы: {str(e)}")
            return False