from flask import Flask, render_template, request, redirect, url_for, jsonify, abort
import os
import json
import yaml
from utils.config_manager import ConfigManager

app = Flask(__name__)

@app.route('/')
def get_index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/network')
def get_network():
    """Страница управления сетью"""
    return render_template('network.html')

@app.route('/topology')
def get_topology():
    """Страница сетевой топологии"""
    return render_template('topology.html')

@app.route('/wifi')
def get_wifi():
    """Страница Wi-Fi настроек"""
    return render_template('wifi.html')

@app.route('/firewall')
def get_firewall():
    """Страница межсетевого экрана"""
    return render_template('firewall.html')

@app.route('/vpn')
def get_vpn():
    """Перенаправление со старой страницы VPN на новую страницу Туннелей"""
    return redirect(url_for('get_tunnels'))

@app.route('/tunnels')
def get_tunnels():
    """Страница безопасных туннелей"""
    return render_template('tunnels.html')

@app.route('/routing')
def get_routing():
    """Страница маршрутизации"""
    return render_template('routing.html')

@app.route('/modules')
def get_modules():
    """Страница управления модулями"""
    return render_template('modules.html')

@app.route('/settings')
def get_settings():
    """Страница настроек"""
    return render_template('settings.html')

@app.route('/api/tunnel/config', methods=['GET'])
def get_tunnel_config():
    """API для получения конфигурации туннелей"""
    try:
        tunnel_config = ConfigManager.get_tunnel_config()
        return jsonify({"tunnel": tunnel_config})
    except Exception as e:
        app.logger.error(f"Error getting tunnel config: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tunnel/config', methods=['PUT'])
def update_tunnel_config():
    """API для обновления конфигурации туннелей"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        tunnel_config = data.get('tunnel', {})
        updated_config = ConfigManager.update_tunnel_config(tunnel_config)
        return jsonify({"success": True, "tunnel": updated_config})
    except Exception as e:
        app.logger.error(f"Error updating tunnel config: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tunnel/restart', methods=['POST'])
def restart_tunnel():
    """API для перезапуска сервисов туннелей"""
    try:
        # Тут будет реальный код перезапуска служб туннелей в боевом окружении
        # В демонстрационной версии просто возвращаем успешный результат
        return jsonify({"success": True, "message": "Tunel services restarted successfully"})
    except Exception as e:
        app.logger.error(f"Error restarting tunnel services: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/firewall/config', methods=['GET'])
def get_firewall_config():
    """API для получения конфигурации межсетевого экрана"""
    try:
        firewall_config = ConfigManager.get_firewall_config()
        return jsonify({"firewall": firewall_config})
    except Exception as e:
        app.logger.error(f"Error getting firewall config: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/firewall/config', methods=['PUT'])
def update_firewall_config():
    """API для обновления конфигурации межсетевого экрана"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        firewall_config = data.get('firewall', {})
        updated_config = ConfigManager.update_firewall_config(firewall_config)
        return jsonify({"success": True, "firewall": updated_config})
    except Exception as e:
        app.logger.error(f"Error updating firewall config: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/firewall/restart', methods=['POST'])
def restart_firewall():
    """API для перезапуска межсетевого экрана"""
    try:
        # Тут будет реальный код перезапуска служб межсетевого экрана в боевом окружении
        # В демонстрационной версии просто возвращаем успешный результат
        return jsonify({"success": True, "message": "Firewall restarted successfully"})
    except Exception as e:
        app.logger.error(f"Error restarting firewall: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health_check():
    """API для проверки работоспособности"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)