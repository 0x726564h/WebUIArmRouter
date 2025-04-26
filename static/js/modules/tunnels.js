/**
 * Модуль управления безопасными туннелями
 */

/**
 * Инициализация страницы туннелей
 */
function initTunnelsPage() {
    // Инициализация иконок
    console.log('Инициализация иконок...');
    IconsLoader.init();
    
    // Инициализация вкладок
    document.querySelectorAll('.nav-tabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('href').substring(1);
            
            // Деактивировать все вкладки и панели
            document.querySelectorAll('.nav-tabs .nav-link').forEach(t => {
                t.classList.remove('active');
            });
            document.querySelectorAll('.tab-pane').forEach(p => {
                p.classList.remove('active');
            });
            
            // Активировать выбранную вкладку и панель
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Загрузить конфигурацию туннелей
    loadTunnelConfig();
    
    // Настроить обработчики событий для кнопок
    setupEventHandlers();
}

/**
 * Загрузить конфигурацию туннелей
 */
function loadTunnelConfig() {
    // Получение данных конфигурации с сервера
    API.get('/api/tunnel/config')
        .then(response => {
            console.log('Получена конфигурация туннелей:', response);
            renderTunnelConfig(response);
        })
        .catch(error => {
            console.error('Ошибка загрузки конфигурации туннелей:', error);
            showNotification('Не удалось загрузить конфигурацию туннелей', 'error');
        });
}

/**
 * Отобразить конфигурацию туннелей
 * @param {Object} config - Конфигурация туннелей
 */
function renderTunnelConfig(config) {
    // Настройка общих параметров туннелей
    renderGeneralSettings(config);
    
    // Отобразить список туннелей
    renderTunnelList(config);
    
    // Настройка параметров Tor
    renderTorSettings(config);
}

/**
 * Отобразить общие настройки туннелей
 * @param {Object} config - Конфигурация туннелей
 */
function renderGeneralSettings(config) {
    const generalSettings = document.getElementById('tunnel-general-settings');
    
    // Если нет контейнера для общих настроек, выходим
    if (!generalSettings) return;
    
    // Создаем содержимое для общих настроек
    const generalContent = document.createElement('div');
    generalContent.className = 'general-settings';
    
    // Создаем панель для выбора режима маршрутизации
    generalContent.innerHTML = `
        <div class="form-group">
            <label class="form-label">Статус маршрутизации через туннели</label>
            <div class="toggle-group" id="tunnel-routing-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" name="tunnel.enabled" ${config.tunnel.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">${config.tunnel.enabled ? 'Включено' : 'Отключено'}</span>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Режим маршрутизации</label>
            <select name="tunnel.routing_mode" class="form-input form-select">
                <option value="all" ${config.tunnel.routing_mode === 'all' ? 'selected' : ''}>Весь трафик (полный туннель)</option>
                <option value="balanced" ${config.tunnel.routing_mode === 'balanced' ? 'selected' : ''}>Балансировка нагрузки (между несколькими туннелями)</option>
                <option value="geo" ${config.tunnel.routing_mode === 'geo' ? 'selected' : ''}>По странам (геолокация)</option>
                <option value="ip" ${config.tunnel.routing_mode === 'ip' ? 'selected' : ''}>По IP-адресам и подсетям</option>
                <option value="domain" ${config.tunnel.routing_mode === 'domain' ? 'selected' : ''}>По доменам</option>
            </select>
            <div class="form-help">Выберите, как будет распределяться трафик между туннелями</div>
        </div>
    `;
    
    // Добавляем панель для выбранного режима маршрутизации
    const routingModePanel = document.createElement('div');
    routingModePanel.id = 'routing-mode-panel';
    routingModePanel.innerHTML = getRoutingModePanel(config.tunnel.routing_mode, config);
    generalContent.appendChild(routingModePanel);
    
    // Добавляем кнопки действий
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'form-actions';
    actionsDiv.innerHTML = `
        <button type="button" class="btn btn-primary" id="save-general-settings-btn">
            <span data-icon="save"></span> Сохранить настройки
        </button>
        <button type="button" class="btn btn-outline" id="restart-tunnel-service-btn">
            <span data-icon="refresh-cw"></span> Перезапустить службу туннелей
        </button>
    `;
    generalContent.appendChild(actionsDiv);
    
    // Заменяем содержимое контейнера
    generalSettings.innerHTML = '';
    generalSettings.appendChild(generalContent);
    
    // Инициализация иконок внутри созданных элементов
    IconsLoader.init(generalSettings);
    
    // Добавляем обработчики событий
    setupGeneralSettingsEvents(config);
}

/**
 * Получить панель для выбранного режима маршрутизации
 * @param {string} mode - Режим маршрутизации
 * @param {Object} config - Конфигурация туннелей
 * @returns {string} HTML-код панели
 */
function getRoutingModePanel(mode, config) {
    switch (mode) {
        case 'all':
            return `
                <div class="panel mb-3">
                    <div class="panel-header">
                        <h4>Настройка полного туннеля</h4>
                    </div>
                    <div class="panel-body">
                        <p>Весь трафик будет направляться через выбранный туннель.</p>
                        <div class="form-group">
                            <label class="form-label">Основной туннель</label>
                            <select name="tunnel.primary_tunnel" class="form-input form-select">
                                <option value="">-- Выберите туннель --</option>
                                ${getTunnelOptions(config.tunnel.tunnels, config.tunnel.primary_tunnel)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Резервный туннель</label>
                            <select name="tunnel.backup_tunnel" class="form-input form-select">
                                <option value="">-- Нет (не использовать) --</option>
                                ${getTunnelOptions(config.tunnel.tunnels, config.tunnel.backup_tunnel)}
                            </select>
                            <div class="form-help">Будет использован при недоступности основного туннеля</div>
                        </div>
                    </div>
                </div>
            `;
        case 'balanced':
            return `
                <div class="panel mb-3">
                    <div class="panel-header">
                        <h4>Балансировка нагрузки</h4>
                    </div>
                    <div class="panel-body">
                        <p>Трафик будет распределяться между выбранными туннелями для оптимальной производительности.</p>
                        <div class="form-group">
                            <label class="form-label">Туннели для балансировки</label>
                            <div class="list-items" id="balanced-tunnels-list">
                                ${getBalancedTunnelsList(config.tunnel.tunnels, config.tunnel.balanced_tunnels || [])}
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Метод балансировки</label>
                            <select name="tunnel.balancing_method" class="form-input form-select">
                                <option value="round-robin" ${config.tunnel.balancing_method === 'round-robin' ? 'selected' : ''}>Round Robin (поочередно)</option>
                                <option value="weighted" ${config.tunnel.balancing_method === 'weighted' ? 'selected' : ''}>Weighted (по весам)</option>
                                <option value="performance" ${config.tunnel.balancing_method === 'performance' ? 'selected' : ''}>По производительности (автоматически)</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        case 'geo':
            return `
                <div class="panel mb-3">
                    <div class="panel-header">
                        <h4>Маршрутизация по странам</h4>
                    </div>
                    <div class="panel-body">
                        <p>Трафик будет направляться через разные туннели в зависимости от страны назначения.</p>
                        <div class="form-group">
                            <label class="form-label">Правила маршрутизации по странам</label>
                            <div class="list-items" id="geo-routing-list">
                                ${getGeoRoutingList(config.tunnel.geo_routing || [])}
                            </div>
                            <button type="button" class="btn btn-outline" id="add-geo-rule-btn">
                                <span data-icon="plus"></span> Добавить правило
                            </button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Туннель по умолчанию</label>
                            <select name="tunnel.default_tunnel" class="form-input form-select">
                                <option value="">-- Прямое соединение --</option>
                                ${getTunnelOptions(config.tunnel.tunnels, config.tunnel.default_tunnel)}
                            </select>
                            <div class="form-help">Будет использован для стран, не указанных в правилах</div>
                        </div>
                    </div>
                </div>
            `;
        case 'ip':
            return `
                <div class="panel mb-3">
                    <div class="panel-header">
                        <h4>Маршрутизация по IP-адресам</h4>
                    </div>
                    <div class="panel-body">
                        <p>Трафик будет направляться через разные туннели в зависимости от IP-адреса или подсети назначения.</p>
                        <div class="form-group">
                            <label class="form-label">Правила маршрутизации по IP</label>
                            <div class="list-items" id="ip-routing-list">
                                ${getIpRoutingList(config.tunnel.ip_routing || [])}
                            </div>
                            <button type="button" class="btn btn-outline" id="add-ip-rule-btn">
                                <span data-icon="plus"></span> Добавить правило
                            </button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Туннель по умолчанию</label>
                            <select name="tunnel.default_tunnel" class="form-input form-select">
                                <option value="">-- Прямое соединение --</option>
                                ${getTunnelOptions(config.tunnel.tunnels, config.tunnel.default_tunnel)}
                            </select>
                            <div class="form-help">Будет использован для IP-адресов, не указанных в правилах</div>
                        </div>
                    </div>
                </div>
            `;
        case 'domain':
            return `
                <div class="panel mb-3">
                    <div class="panel-header">
                        <h4>Маршрутизация по доменам</h4>
                    </div>
                    <div class="panel-body">
                        <p>Трафик будет направляться через разные туннели в зависимости от домена назначения.</p>
                        <div class="form-group">
                            <label class="form-label">Правила маршрутизации по доменам</label>
                            <div class="list-items" id="domain-routing-list">
                                ${getDomainRoutingList(config.tunnel.domain_routing || [])}
                            </div>
                            <button type="button" class="btn btn-outline" id="add-domain-rule-btn">
                                <span data-icon="plus"></span> Добавить правило
                            </button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Туннель по умолчанию</label>
                            <select name="tunnel.default_tunnel" class="form-input form-select">
                                <option value="">-- Прямое соединение --</option>
                                ${getTunnelOptions(config.tunnel.tunnels, config.tunnel.default_tunnel)}
                            </select>
                            <div class="form-help">Будет использован для доменов, не указанных в правилах</div>
                        </div>
                    </div>
                </div>
            `;
        default:
            return `<p>Выберите режим маршрутизации для настройки дополнительных параметров.</p>`;
    }
}

/**
 * Получить HTML-код с опциями туннелей для выпадающего списка
 * @param {Array} tunnels - Список туннелей
 * @param {string} selectedTunnel - ID выбранного туннеля
 * @returns {string} HTML-код с опциями
 */
function getTunnelOptions(tunnels, selectedTunnel) {
    if (!tunnels || tunnels.length === 0) {
        return '<option value="" disabled>Нет доступных туннелей</option>';
    }
    
    return tunnels.map(tunnel => {
        return `<option value="${tunnel.id}" ${tunnel.id === selectedTunnel ? 'selected' : ''}>${tunnel.name}</option>`;
    }).join('');
}

/**
 * Получить HTML-код списка туннелей для балансировки нагрузки
 * @param {Array} tunnels - Список всех туннелей
 * @param {Array} balancedTunnels - Список выбранных для балансировки туннелей
 * @returns {string} HTML-код списка
 */
function getBalancedTunnelsList(tunnels, balancedTunnels) {
    if (!tunnels || tunnels.length === 0) {
        return '<div class="empty-row">Нет доступных туннелей</div>';
    }
    
    if (!balancedTunnels || balancedTunnels.length === 0) {
        return '<div class="empty-row">Нет выбранных туннелей для балансировки</div>';
    }
    
    return balancedTunnels.map(balancedTunnel => {
        const tunnel = tunnels.find(t => t.id === balancedTunnel.id);
        if (!tunnel) return '';
        
        return `
            <div class="list-item" data-id="${tunnel.id}">
                <div class="item-details">
                    ${tunnel.name} 
                    <span class="text-muted">(Вес: ${balancedTunnel.weight || 1})</span>
                </div>
                <div class="item-actions">
                    <span class="remove-btn" data-action="remove-balanced-tunnel" data-id="${tunnel.id}">
                        <span data-icon="trash-2"></span>
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Получить HTML-код списка правил маршрутизации по странам
 * @param {Array} rules - Список правил маршрутизации по странам
 * @returns {string} HTML-код списка
 */
function getGeoRoutingList(rules) {
    if (!rules || rules.length === 0) {
        return '<div class="empty-row">Нет правил маршрутизации по странам</div>';
    }
    
    return rules.map(rule => {
        return `
            <div class="list-item" data-id="${rule.id}">
                <div class="item-details">
                    ${rule.country_name || rule.country_code} → Туннель: ${rule.tunnel_name || rule.tunnel_id}
                </div>
                <div class="item-actions">
                    <span class="remove-btn" data-action="remove-geo-rule" data-id="${rule.id}">
                        <span data-icon="trash-2"></span>
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Получить HTML-код списка правил маршрутизации по IP-адресам
 * @param {Array} rules - Список правил маршрутизации по IP-адресам
 * @returns {string} HTML-код списка
 */
function getIpRoutingList(rules) {
    if (!rules || rules.length === 0) {
        return '<div class="empty-row">Нет правил маршрутизации по IP-адресам</div>';
    }
    
    return rules.map(rule => {
        return `
            <div class="list-item" data-id="${rule.id}">
                <div class="item-details">
                    ${rule.ip_range} → Туннель: ${rule.tunnel_name || rule.tunnel_id}
                </div>
                <div class="item-actions">
                    <span class="remove-btn" data-action="remove-ip-rule" data-id="${rule.id}">
                        <span data-icon="trash-2"></span>
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Получить HTML-код списка правил маршрутизации по доменам
 * @param {Array} rules - Список правил маршрутизации по доменам
 * @returns {string} HTML-код списка
 */
function getDomainRoutingList(rules) {
    if (!rules || rules.length === 0) {
        return '<div class="empty-row">Нет правил маршрутизации по доменам</div>';
    }
    
    return rules.map(rule => {
        return `
            <div class="list-item" data-id="${rule.id}">
                <div class="item-details">
                    ${rule.domain_pattern} → Туннель: ${rule.tunnel_name || rule.tunnel_id}
                </div>
                <div class="item-actions">
                    <span class="remove-btn" data-action="remove-domain-rule" data-id="${rule.id}">
                        <span data-icon="trash-2"></span>
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Настроить обработчики событий для общих настроек
 * @param {Object} config - Конфигурация туннелей
 */
function setupGeneralSettingsEvents(config) {
    // Обработчик для переключателя туннелей
    const tunnelToggle = document.querySelector('input[name="tunnel.enabled"]');
    if (tunnelToggle) {
        tunnelToggle.addEventListener('change', function() {
            const toggleLabel = document.querySelector('#tunnel-routing-toggle .toggle-label');
            if (toggleLabel) {
                toggleLabel.textContent = this.checked ? 'Включено' : 'Отключено';
            }
        });
    }
    
    // Обработчик изменения режима маршрутизации
    const routingModeSelect = document.querySelector('select[name="tunnel.routing_mode"]');
    if (routingModeSelect) {
        routingModeSelect.addEventListener('change', function() {
            const routingModePanel = document.getElementById('routing-mode-panel');
            if (routingModePanel) {
                routingModePanel.innerHTML = getRoutingModePanel(this.value, config);
                IconsLoader.init(routingModePanel);
            }
        });
    }
    
    // Обработчик для кнопки сохранения настроек
    const saveBtn = document.getElementById('save-general-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveGeneralSettings();
        });
    }
    
    // Обработчик для кнопки перезапуска службы туннелей
    const restartBtn = document.getElementById('restart-tunnel-service-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            restartTunnelService();
        });
    }
}

/**
 * Сохранить общие настройки туннелей
 */
function saveGeneralSettings() {
    // Сбор данных формы
    const generalConfig = {
        enabled: document.querySelector('input[name="tunnel.enabled"]').checked,
        routing_mode: document.querySelector('select[name="tunnel.routing_mode"]').value
    };
    
    // Дополнительные данные в зависимости от режима маршрутизации
    switch (generalConfig.routing_mode) {
        case 'all':
            generalConfig.primary_tunnel = document.querySelector('select[name="tunnel.primary_tunnel"]').value;
            generalConfig.backup_tunnel = document.querySelector('select[name="tunnel.backup_tunnel"]').value;
            break;
        case 'balanced':
            // Добавить логику сбора данных о балансировке
            break;
        case 'geo':
            // Добавить логику сбора данных о геомаршрутизации
            break;
        case 'ip':
            // Добавить логику сбора данных о IP-маршрутизации
            break;
        case 'domain':
            // Добавить логику сбора данных о доменной маршрутизации
            break;
    }
    
    // Отправка данных на сервер
    showNotification('Сохранение настроек...', 'info');
    
    API.post('/api/tunnel/config', { tunnel: generalConfig })
        .then(response => {
            console.log('Настройки туннелей сохранены:', response);
            showNotification('Настройки туннелей успешно сохранены', 'success');
        })
        .catch(error => {
            console.error('Ошибка сохранения настроек туннелей:', error);
            showNotification('Не удалось сохранить настройки туннелей', 'error');
        });
}

/**
 * Перезапустить службу туннелей
 */
function restartTunnelService() {
    showNotification('Перезапуск службы туннелей...', 'info');
    
    API.post('/api/tunnel/restart')
        .then(response => {
            console.log('Служба туннелей перезапущена:', response);
            showNotification('Служба туннелей успешно перезапущена', 'success');
        })
        .catch(error => {
            console.error('Ошибка перезапуска службы туннелей:', error);
            showNotification('Не удалось перезапустить службу туннелей', 'error');
        });
}

/**
 * Отобразить список туннелей
 * @param {Object} config - Конфигурация туннелей
 */
function renderTunnelList(config) {
    const tunnelManager = document.getElementById('tunnel-manager');
    
    // Если нет контейнера для списка туннелей, выходим
    if (!tunnelManager) return;
    
    // Если нет туннелей или массив пуст
    if (!config.tunnel.tunnels || config.tunnel.tunnels.length === 0) {
        tunnelManager.innerHTML = `
            <div class="empty-state">
                <span data-icon="key"></span>
                <h3 class="empty-state-title">Нет настроенных туннелей</h3>
                <p class="empty-state-desc">Нажмите кнопку "Добавить туннель" для создания нового защищенного соединения</p>
            </div>
        `;
        
        // Инициализация иконок внутри созданных элементов
        IconsLoader.init(tunnelManager);
        
        return;
    }
    
    // Создаем HTML для списка туннелей
    const tunnelListHtml = config.tunnel.tunnels.map(tunnel => {
        return `
            <div class="tunnel-card" data-id="${tunnel.id}">
                <div class="tunnel-header">
                    <div class="tunnel-title">
                        <div class="tunnel-type-icon">
                            <span data-icon="${getTunnelTypeIcon(tunnel.type)}"></span>
                        </div>
                        ${tunnel.name}
                    </div>
                    <div class="tunnel-status">
                        <span class="status-badge ${tunnel.enabled ? 'status-enabled' : 'status-disabled'}">
                            <span data-icon="${tunnel.enabled ? 'power' : 'power-off'}"></span>
                            ${tunnel.enabled ? 'Активен' : 'Отключен'}
                        </span>
                        <div class="dropdown">
                            <button type="button" class="btn btn-icon btn-sm" data-action="tunnel-menu">
                                <span data-icon="more-vertical"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="tunnel-content">
                    <div class="tunnel-info">
                        <div class="info-row">
                            <span class="info-label">Тип:</span>
                            <span class="info-value">${getTunnelTypeName(tunnel.type)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Сервер:</span>
                            <span class="info-value">${tunnel.server || 'Не указан'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Статус:</span>
                            <span class="info-value status-text ${tunnel.status === 'connected' ? 'text-success' : 'text-danger'}">
                                ${getTunnelStatusText(tunnel.status)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="tunnel-actions">
                    <button type="button" class="btn btn-sm ${tunnel.enabled ? 'btn-danger' : 'btn-success'}" data-action="${tunnel.enabled ? 'disable-tunnel' : 'enable-tunnel'}" data-id="${tunnel.id}">
                        <span data-icon="${tunnel.enabled ? 'power-off' : 'power'}"></span>
                        ${tunnel.enabled ? 'Отключить' : 'Включить'}
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-action="edit-tunnel" data-id="${tunnel.id}">
                        <span data-icon="edit-2"></span>
                        Редактировать
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-action="delete-tunnel" data-id="${tunnel.id}">
                        <span data-icon="trash-2"></span>
                        Удалить
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Заменяем содержимое контейнера
    tunnelManager.innerHTML = tunnelListHtml;
    
    // Инициализация иконок внутри созданных элементов
    IconsLoader.init(tunnelManager);
    
    // Настройка обработчиков событий для действий с туннелями
    setupTunnelActionHandlers();
}

/**
 * Получить иконку для типа туннеля
 * @param {string} type - Тип туннеля
 * @returns {string} Имя иконки
 */
function getTunnelTypeIcon(type) {
    switch (type) {
        case 'wireguard': return 'shield';
        case 'openvpn': return 'shield';
        case 'shadowsocks': return 'key';
        case 'vless': return 'key';
        case 'trojan': return 'key';
        case 'ssh': return 'terminal';
        default: return 'key';
    }
}

/**
 * Получить название типа туннеля
 * @param {string} type - Тип туннеля
 * @returns {string} Название типа
 */
function getTunnelTypeName(type) {
    switch (type) {
        case 'wireguard': return 'WireGuard';
        case 'openvpn': return 'OpenVPN';
        case 'shadowsocks': return 'ShadowSocks';
        case 'vless': return 'VLESS';
        case 'trojan': return 'Trojan';
        case 'ssh': return 'SSH Tunnel';
        default: return type;
    }
}

/**
 * Получить текстовый статус туннеля
 * @param {string} status - Статус туннеля
 * @returns {string} Текстовый статус
 */
function getTunnelStatusText(status) {
    switch (status) {
        case 'connected': return 'Подключен';
        case 'disconnected': return 'Отключен';
        case 'connecting': return 'Подключение...';
        case 'failed': return 'Ошибка подключения';
        default: return 'Неизвестно';
    }
}

/**
 * Настроить обработчики событий для действий с туннелями
 */
function setupTunnelActionHandlers() {
    // Обработчики для кнопок включения/отключения туннеля
    document.querySelectorAll('[data-action="enable-tunnel"], [data-action="disable-tunnel"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tunnelId = this.getAttribute('data-id');
            const action = this.getAttribute('data-action');
            
            toggleTunnelStatus(tunnelId, action === 'enable-tunnel');
        });
    });
    
    // Обработчики для кнопок редактирования туннеля
    document.querySelectorAll('[data-action="edit-tunnel"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tunnelId = this.getAttribute('data-id');
            showEditTunnelModal(tunnelId);
        });
    });
    
    // Обработчики для кнопок удаления туннеля
    document.querySelectorAll('[data-action="delete-tunnel"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tunnelId = this.getAttribute('data-id');
            showDeleteTunnelConfirmation(tunnelId);
        });
    });
}

/**
 * Изменить статус туннеля (включить/отключить)
 * @param {string} tunnelId - ID туннеля
 * @param {boolean} enable - true для включения, false для отключения
 */
function toggleTunnelStatus(tunnelId, enable) {
    showNotification(`${enable ? 'Включение' : 'Отключение'} туннеля...`, 'info');
    
    API.post('/api/tunnel/config', {
        tunnel: {
            action: enable ? 'enable_tunnel' : 'disable_tunnel',
            tunnel_id: tunnelId
        }
    })
    .then(response => {
        console.log(`Туннель ${enable ? 'включен' : 'отключен'}:`, response);
        showNotification(`Туннель успешно ${enable ? 'включен' : 'отключен'}`, 'success');
        loadTunnelConfig(); // Перезагрузка конфигурации
    })
    .catch(error => {
        console.error(`Ошибка ${enable ? 'включения' : 'отключения'} туннеля:`, error);
        showNotification(`Не удалось ${enable ? 'включить' : 'отключить'} туннель`, 'error');
    });
}

// Функция showAddTunnelModal теперь определена в tunnel-modal.js
// Функция showEditTunnelModal теперь определена в tunnel-modal.js
// Функция showDeleteTunnelConfirmation теперь определена в tunnel-modal.js

/**
 * Отобразить настройки Tor
 * @param {Object} config - Конфигурация туннелей
 */
function renderTorSettings(config) {
    // Настройка Tor будет добавлена позже
}

/**
 * Настроить обработчики событий для страницы туннелей
 */
function setupEventHandlers() {
    // Обработчик для кнопки добавления туннеля
    const addTunnelBtn = document.getElementById('add-tunnel-btn');
    if (addTunnelBtn) {
        addTunnelBtn.addEventListener('click', function() {
            if (window.TunnelModal && typeof window.TunnelModal.showAddTunnelModal === 'function') {
                window.TunnelModal.showAddTunnelModal();
            } else {
                console.error('Функция TunnelModal.showAddTunnelModal не определена');
            }
        });
    }
}

/**
 * Загрузить менеджер туннелей
 */
function loadTunnelManager() {
    // Инициализация страницы туннелей
    initTunnelsPage();
}

// Глобальная функция для отображения уведомлений
function showNotification(message, type = 'info') {
    // Проверка, есть ли глобальная функция уведомлений
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}]: ${message}`);
    }
}