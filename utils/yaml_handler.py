import os
import yaml
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class YAMLHandler:
    """
    Обработчик YAML-файлов.
    
    Этот класс предоставляет методы для работы с YAML-файлами
    для хранения конфигураций системы.
    """
    
    @staticmethod
    def read_yaml(file_path: str) -> Dict[str, Any]:
        """
        Прочитать YAML-файл.
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            Словарь с содержимым файла или пустой словарь, если файл не существует
        """
        try:
            if not os.path.exists(file_path):
                return {}
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                
                if data is None:
                    return {}
                
                return data
        except Exception as e:
            logger.error(f"Ошибка чтения YAML-файла {file_path}: {str(e)}")
            return {}
    
    @staticmethod
    def write_yaml(file_path: str, data: Dict[str, Any]) -> bool:
        """
        Записать YAML-файл.
        
        Args:
            file_path: Путь к файлу
            data: Данные для записи
            
        Returns:
            True, если запись прошла успешно, иначе False
        """
        try:
            # Создаем директорию, если она не существует
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            
            return True
        except Exception as e:
            logger.error(f"Ошибка записи YAML-файла {file_path}: {str(e)}")
            return False
    
    @staticmethod
    def update_yaml(file_path: str, updates: Dict[str, Any], create_if_missing: bool = False) -> Dict[str, Any]:
        """
        Обновить YAML-файл.
        
        Args:
            file_path: Путь к файлу
            updates: Данные для обновления
            create_if_missing: Флаг, указывающий на необходимость создания файла, если он не существует
            
        Returns:
            Обновленный словарь
        """
        try:
            # Проверяем существование файла
            if not os.path.exists(file_path):
                if create_if_missing:
                    # Создаем директорию, если она не существует
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    # Создаем файл с начальными данными
                    YAMLHandler.write_yaml(file_path, updates)
                    return updates
                else:
                    # Если файл не существует и не нужно его создавать, возвращаем пустой словарь
                    return {}
            
            # Читаем текущие данные
            current_data = YAMLHandler.read_yaml(file_path)
            
            # Рекурсивно обновляем данные
            def deep_update(original, update):
                for key, value in update.items():
                    if isinstance(value, dict) and key in original and isinstance(original[key], dict):
                        deep_update(original[key], value)
                    else:
                        original[key] = value
                return original
            
            # Обновляем данные
            updated_data = deep_update(current_data, updates)
            
            # Записываем обновленные данные
            YAMLHandler.write_yaml(file_path, updated_data)
            
            return updated_data
        except Exception as e:
            logger.error(f"Ошибка обновления YAML-файла {file_path}: {str(e)}")
            return updates