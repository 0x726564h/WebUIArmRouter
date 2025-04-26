# ArmRouter API Endpoints

This document describes all API endpoints available in the ArmRouter application.

## Dashboard

- `GET /api/dashboard/system-info`
  - Description: Get system information (hostname, platform, architecture, etc.)
  - Response: JSON object with system information

- `GET /api/dashboard/statistics`
  - Description: Get system statistics (CPU, memory, disk, network)
  - Response: JSON object with system statistics

## Network Settings

- `GET /api/network/interfaces`
  - Description: Get network interface information
  - Response: JSON object with network interface information

- `GET /api/network/config`
  - Description: Get network configuration
  - Response: JSON object with network configuration

- `PUT /api/network/config`
  - Description: Update network configuration
  - Request: JSON object with updated network configuration
  - Response: JSON object with result of update

- `POST /api/network/restart`
  - Description: Restart networking service
  - Response: JSON object with result of restart

## WiFi Configuration

- `GET /api/wifi/config`
  - Description: Get WiFi configuration
  - Response: JSON object with WiFi configuration

- `PUT /api/wifi/config`
  - Description: Update WiFi configuration
  - Request: JSON object with updated WiFi configuration
  - Response: JSON object with result of update

- `GET /api/wifi/scan`
  - Description: Scan for available WiFi networks
  - Response: JSON array of WiFi networks

## Firewall

- `GET /api/firewall/config`
  - Description: Get firewall configuration
  - Response: JSON object with firewall configuration

- `PUT /api/firewall/config`
  - Description: Update firewall configuration
  - Request: JSON object with updated firewall configuration
  - Response: JSON object with result of update

- `POST /api/firewall/restart`
  - Description: Restart firewall service
  - Response: JSON object with result of restart

## Tunnel Manager

- `GET /api/tunnel/config`
  - Description: Get tunnel configuration
  - Response: JSON object with tunnel configuration

- `PUT /api/tunnel/config`
  - Description: Update tunnel configuration
  - Request: JSON object with updated tunnel configuration
  - Response: JSON object with result of update

- `POST /api/tunnel/restart`
  - Description: Restart tunnel service
  - Response: JSON object with result of restart

## Routing

- `GET /api/routing/table`
  - Description: Get routing table
  - Response: JSON array of routing table entries

- `GET /api/routing/config`
  - Description: Get routing configuration
  - Response: JSON object with routing configuration

- `PUT /api/routing/config`
  - Description: Update routing configuration
  - Request: JSON object with updated routing configuration
  - Response: JSON object with result of update

## General Settings

- `GET /api/settings/system`
  - Description: Get system settings
  - Response: JSON object with system settings

- `PUT /api/settings/system`
  - Description: Update system settings
  - Request: JSON object with updated system settings
  - Response: JSON object with result of update

- `GET /api/settings/access`
  - Description: Get access settings
  - Response: JSON object with access settings

- `PUT /api/settings/access`
  - Description: Update access settings
  - Request: JSON object with updated access settings
  - Response: JSON object with result of update

## Module Manager

- `GET /api/modules`
  - Description: Get list of available modules
  - Response: JSON array of available modules

- `GET /api/modules/{module_id}`
  - Description: Get module information
  - Path parameters:
    - `module_id`: Module ID
  - Response: JSON object with module information

- `PUT /api/modules/{module_id}`
  - Description: Update module status (enable/disable)
  - Path parameters:
    - `module_id`: Module ID
  - Request: JSON object with updated module status
  - Response: JSON object with result of update

- `GET /api/modules/available`
  - Description: Get list of available modules for installation
  - Response: JSON array of available modules for installation

- `POST /api/modules/install/{module_id}`
  - Description: Install a module
  - Path parameters:
    - `module_id`: Module ID
  - Response: JSON object with result of installation

- `DELETE /api/modules/{module_id}`
  - Description: Remove a module
  - Path parameters:
    - `module_id`: Module ID
  - Response: JSON object with result of removal
