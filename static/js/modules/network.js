/**
 * Network Module
 * Управление сетевыми настройками и интерфейсами
 */

// Глобальные переменные модуля
let networkConfig = null;
let networkInterfaces = null;
let selectedInterface = null;

/**
 * Save general network configuration
 * @param {HTMLFormElement} form - General network configuration form
 */
function saveGeneralNetworkConfig(form) {
    console.log('Сохранение общих настроек сети');
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
    }
    
    // Получаем данные формы
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (key === 'dns_servers') {
            // Преобразуем строку DNS-серверов в массив
            data[key] = value.split(',').map(server => server.trim()).filter(server => server);
        } else {
            data[key] = value;
        }
    }
    
    // Отправляем запрос на сервер
    api.put('/api/network/config', data)
        .then(response => {
            console.log('Общая конфигурация сети обновлена:', response);
            
            // Показываем уведомление об успехе
            showNotification('Успех', 'Общие настройки сети успешно обновлены', 'success');
            
            // Обновляем конфигурацию
            if (response.config) {
                networkConfig = response.config;
            }
        })
        .catch(error => {
            console.error('Ошибка обновления общей конфигурации сети:', error);
            
            // Показываем уведомление об ошибке
            showNotification('Ошибка', `Не удалось обновить общие настройки сети: ${error.message}`, 'error');
        })
        .finally(() => {
            // Скрываем индикатор загрузки
            if (submitBtn) {
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
            }
        });
}

/**
 * Save WAN configuration
 * @param {HTMLFormElement} form - WAN configuration form
 */
function saveWANConfig(form) {
    console.log('Сохранение настроек WAN');
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
    }
    
    // Получаем данные формы
    const formData = new FormData(form);
    const data = {
        wan_interface: formData.get('wan_interface'),
        interfaces: {}
    };
    
    const wanInterface = formData.get('wan_interface');
    const method = formData.get('wan_method');
    
    if (!wanInterface) {
        showNotification('Ошибка', 'Не выбран интерфейс WAN', 'error');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        return;
    }
    
    // Копируем текущую конфигурацию интерфейса
    data.interfaces[wanInterface] = networkConfig.interfaces[wanInterface] || {};
    data.interfaces[wanInterface].method = method;
    data.interfaces[wanInterface].role = 'wan';
    
    // Добавляем дополнительные поля в зависимости от выбранного метода
    if (method === 'static') {
        data.interfaces[wanInterface].ip_address = formData.get('wan_ip_address');
        data.interfaces[wanInterface].netmask = formData.get('wan_netmask');
        data.interfaces[wanInterface].gateway = formData.get('wan_gateway');
        
        // Преобразуем строку DNS-серверов в массив
        const dns = formData.get('wan_dns_servers');
        data.interfaces[wanInterface].dns_servers = dns.split(',').map(server => server.trim()).filter(server => server);
    } else if (method === 'pppoe') {
        data.interfaces[wanInterface].pppoe_username = formData.get('wan_pppoe_username');
        data.interfaces[wanInterface].pppoe_password = formData.get('wan_pppoe_password');
    }
    
    // Отправляем запрос на сервер
    api.put('/api/network/config', data)
        .then(response => {
            console.log('Конфигурация WAN обновлена:', response);
            
            // Показываем уведомление об успехе
            showNotification('Успех', 'Настройки WAN успешно обновлены', 'success');
            
            // Обновляем конфигурацию
            if (response.config) {
                networkConfig = response.config;
            }
        })
        .catch(error => {
            console.error('Ошибка обновления конфигурации WAN:', error);
            
            // Показываем уведомление об ошибке
            showNotification('Ошибка', `Не удалось обновить настройки WAN: ${error.message}`, 'error');
        })
        .finally(() => {
            // Скрываем индикатор загрузки
            if (submitBtn) {
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
            }
        });
}

/**
 * Save LAN configuration
 * @param {HTMLFormElement} form - LAN configuration form
 */
function saveLANConfig(form) {
    console.log('Сохранение настроек LAN');
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
    }
    
    // Получаем данные формы
    const formData = new FormData(form);
    const data = {
        lan_interface: formData.get('lan_interface'),
        interfaces: {},
        dhcp_server: {
            enabled: formData.get('lan_dhcp_enabled') === 'on',
            start_ip: formData.get('lan_dhcp_start'),
            end_ip: formData.get('lan_dhcp_end'),
            lease_time: formData.get('lan_dhcp_lease_time')
        }
    };
    
    const lanInterface = formData.get('lan_interface');
    
    if (!lanInterface) {
        showNotification('Ошибка', 'Не выбран интерфейс LAN', 'error');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        return;
    }
    
    // Копируем текущую конфигурацию интерфейса
    data.interfaces[lanInterface] = networkConfig.interfaces[lanInterface] || {};
    data.interfaces[lanInterface].method = 'static';
    data.interfaces[lanInterface].role = 'lan';
    
    // Получаем статические настройки
    data.interfaces[lanInterface].ip_address = formData.get('lan_ip_address');
    data.interfaces[lanInterface].netmask = formData.get('lan_netmask');
    
    // Отправляем запрос на сервер
    api.put('/api/network/config', data)
        .then(response => {
            console.log('Конфигурация LAN обновлена:', response);
            
            // Показываем уведомление об успехе
            showNotification('Успех', 'Настройки LAN успешно обновлены', 'success');
            
            // Обновляем конфигурацию
            if (response.config) {
                networkConfig = response.config;
            }
        })
        .catch(error => {
            console.error('Ошибка обновления конфигурации LAN:', error);
            
            // Показываем уведомление об ошибке
            showNotification('Ошибка', `Не удалось обновить настройки LAN: ${error.message}`, 'error');
        })
        .finally(() => {
            // Скрываем индикатор загрузки
            if (submitBtn) {
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
            }
        });
}

/**
 * Загрузить модуль сети
 */
function loadNetworkModule() {
    console.log('Запуск функции loadNetworkModule()');
    
    // Получаем контейнер модуля сети
    const moduleContainer = document.getElementById('network-module');
    
    // Очищаем предыдущее содержимое и показываем загрузку
    moduleContainer.innerHTML = '<div class="loading-spinner"><span data-icon="refresh" data-icon-size="24" class="rotating"></span></div>';
    
    if (window.Icons && typeof window.Icons.replaceAll === 'function') {
        window.Icons.replaceAll();
    }
    
    // Создаем базовую структуру модуля без ожидания загрузки конфигурации
    moduleContainer.innerHTML = createNetworkStructure();
    
    // Загружаем сетевую конфигурацию
    console.log('Загрузка сетевой конфигурации...');
    api.get('/network/config')
        .then(data => {
            console.log('Сетевая конфигурация получена:', data);
            networkConfig = data.network;
            
            // Загружаем список интерфейсов
            loadInterfacesList();
            
            // Устанавливаем обработчики событий
            setupNetworkEventHandlers();
            
            // Применяем иконки
            if (window.Icons && typeof window.Icons.replaceAll === 'function') {
                window.Icons.replaceAll();
            } else if (window.feather && typeof window.feather.replace === 'function') {
                window.feather.replace();
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки конфигурации сети (стандартный путь):', error);
            console.log('Пробую альтернативный путь к API');
            
            // Создаем резервную конфигурацию на основе файла config/network.yaml
            const backupConfig = {
                dns_servers: ['8.8.8.8', '8.8.4.4'],
                hostname: 'armrouter',
                interfaces: {}
            };
            
            // Загружаем список интерфейсов в любом случае
            loadInterfacesList();
            
            // Устанавливаем обработчики событий
            setupNetworkEventHandlers();
            
            // Применяем иконки
            if (window.Icons && typeof window.Icons.replaceAll === 'function') {
                window.Icons.replaceAll();
            } else if (window.feather && typeof window.feather.replace === 'function') {
                window.feather.replace();
            }
            
            // Используем API запрос для получения только информации о интерфейсах
            api.get('/api/network/interfaces')
                .then(interfaces => {
                    console.log('Получен список интерфейсов:', interfaces);
                    if (interfaces && Object.keys(interfaces).length > 0) {
                        // Добавляем интерфейсы в резервную конфигурацию
                        backupConfig.interfaces = interfaces;
                    }
                    
                    // Устанавливаем резервную конфигурацию
                    networkConfig = backupConfig;
                    
                    // Обновляем отображение интерфейсов
                    if (document.getElementById('interface-list-container')) {
                        loadInterfacesList();
                    }
                })
                .catch(interfaceError => {
                    console.error('Ошибка загрузки списка интерфейсов:', interfaceError);
                    // Используем пустой список интерфейсов
                    networkConfig = backupConfig;
                });
        });
}

/**
 * Создать базовую структуру модуля сети
 * @returns {string} - HTML-контент
 */
function createNetworkStructure() {
    return `
        <ul class="tab-nav">
            <li><a href="#interfaces" class="tab-link active" data-tab="interfaces">Интерфейсы</a></li>
            <li><a href="#wan" class="tab-link" data-tab="wan">WAN</a></li>
            <li><a href="#lan" class="tab-link" data-tab="lan">LAN</a></li>
            <li><a href="#general" class="tab-link" data-tab="general">Общие настройки</a></li>
        </ul>
        
        <div class="tab-content active" data-tab="interfaces">
            <div class="network-settings">
                <div class="interface-list">
                    <div class="interface-list-header">
                        <span>Интерфейсы</span>
                        <button id="refresh-interfaces-btn" class="btn btn-icon btn-sm" title="Обновить список интерфейсов">
                            <span data-icon="refresh" data-icon-size="16"></span>
                        </button>
                    </div>
                    <div id="network-interface-list">
                        <div class="loading-spinner">
                            <span data-icon="refresh" data-icon-size="24" class="rotating"></span>
                        </div>
                    </div>
                </div>
                
                <div class="interface-details card">
                    <div class="card-header">
                        <h2 id="interface-title">Выберите интерфейс</h2>
                        <div class="card-actions">
                            <button type="button" id="restart-interface-btn" class="btn btn-primary btn-gradient" disabled>
                                <span data-icon="refresh" data-icon-size="16"></span> Перезагрузить
                            </button>
                        </div>
                    </div>
                    <div class="card-content">
                        <div id="interface-details-content">
                            <div class="empty-state">
                                <span data-icon="ethernet" data-icon-size="48"></span>
                                <p>Выберите интерфейс из списка слева для просмотра и настройки</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="tab-content" data-tab="wan">
            <div class="card">
                <div class="card-header">
                    <h2>Настройки WAN подключения</h2>
                    <div class="card-actions">
                        <button type="button" id="wan-restart-btn" class="btn btn-primary btn-gradient">
                            <span data-icon="refresh" data-icon-size="16"></span> Перезапустить WAN
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <form id="wan-network-form">
                        <div class="form-group">
                            <label class="form-label">Интерфейс WAN</label>
                            <select name="wan_interface" id="wan-interface-select" class="form-select">
                                <option value="">Выберите интерфейс</option>
                                ${createInterfaceOptions(networkConfig?.wan_interface || '')}
                            </select>
                            <div class="form-help">Выберите интерфейс, который будет использоваться для подключения к интернету</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Метод получения IP-адреса</label>
                            <select name="wan_method" id="wan-method-select" class="form-select">
                                <option value="dhcp" ${getSelectedInterface()?.method === 'dhcp' ? 'selected' : ''}>DHCP (автоматически)</option>
                                <option value="static" ${getSelectedInterface()?.method === 'static' ? 'selected' : ''}>Статический IP</option>
                                <option value="pppoe" ${getSelectedInterface()?.method === 'pppoe' ? 'selected' : ''}>PPPoE</option>
                            </select>
                        </div>
                        
                        <div id="wan-static-fields" style="${getSelectedInterface()?.method === 'static' ? '' : 'display: none;'}">
                            <div class="form-group">
                                <label class="form-label">IP-адрес</label>
                                <input type="text" name="wan_ip_address" class="form-input" value="${getSelectedInterface()?.ip_address || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Маска подсети</label>
                                <input type="text" name="wan_netmask" class="form-input" value="${getSelectedInterface()?.netmask || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Шлюз</label>
                                <input type="text" name="wan_gateway" class="form-input" value="${getSelectedInterface()?.gateway || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">DNS-серверы</label>
                                <input type="text" name="wan_dns_servers" class="form-input" value="${typeof getSelectedInterface()?.dns_servers === 'string' ? getSelectedInterface()?.dns_servers : (Array.isArray(getSelectedInterface()?.dns_servers) ? getSelectedInterface()?.dns_servers.join(', ') : '')}">
                                <div class="form-help">Укажите через запятую, например: 8.8.8.8, 8.8.4.4</div>
                            </div>
                        </div>
                        
                        <div id="wan-pppoe-fields" style="${getSelectedInterface()?.method === 'pppoe' ? '' : 'display: none;'}">
                            <div class="form-group">
                                <label class="form-label">Имя пользователя</label>
                                <input type="text" name="wan_pppoe_username" class="form-input" value="${getSelectedInterface()?.pppoe_username || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Пароль</label>
                                <input type="password" name="wan_pppoe_password" class="form-input" value="${getSelectedInterface()?.pppoe_password || ''}">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-gradient">Сохранить настройки WAN</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <div class="tab-content" data-tab="lan">
            <div class="card">
                <div class="card-header">
                    <h2>Настройки LAN</h2>
                    <div class="card-actions">
                        <button type="button" id="lan-restart-btn" class="btn btn-primary btn-gradient">
                            <span data-icon="refresh" data-icon-size="16"></span> Перезапустить LAN
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <form id="lan-network-form">
                        <div class="form-group">
                            <label class="form-label">Интерфейс LAN</label>
                            <select name="lan_interface" id="lan-interface-select" class="form-select">
                                <option value="">Выберите интерфейс</option>
                                ${createInterfaceOptions(networkConfig?.lan_interface || '')}
                            </select>
                            <div class="form-help">Выберите интерфейс, который будет использоваться для локальной сети</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">IP-адрес</label>
                            <input type="text" name="lan_ip_address" class="form-input" value="${getLanInterfaceProperty('ip_address') || '192.168.1.1'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Маска подсети</label>
                            <input type="text" name="lan_netmask" class="form-input" value="${getLanInterfaceProperty('netmask') || '255.255.255.0'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">DHCP-сервер</label>
                            <div class="switch-container">
                                <label class="switch">
                                    <input type="checkbox" name="lan_dhcp_enabled" ${networkConfig?.dhcp_server?.enabled ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                                <span class="switch-label">Включить DHCP-сервер</span>
                            </div>
                        </div>
                        
                        <div id="lan-dhcp-fields" style="${networkConfig?.dhcp_server?.enabled ? '' : 'display: none;'}">
                            <div class="form-group">
                                <label class="form-label">Начальный IP-адрес</label>
                                <input type="text" name="lan_dhcp_start" class="form-input" value="${networkConfig?.dhcp_server?.start_ip || '192.168.1.100'}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Конечный IP-адрес</label>
                                <input type="text" name="lan_dhcp_end" class="form-input" value="${networkConfig?.dhcp_server?.end_ip || '192.168.1.200'}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Время аренды (часы)</label>
                                <input type="number" name="lan_dhcp_lease_time" class="form-input" value="${networkConfig?.dhcp_server?.lease_time || '24'}">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-gradient">Сохранить настройки LAN</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <div class="tab-content" data-tab="general">
            <div class="card">
                <div class="card-header">
                    <h2>Общие настройки сети</h2>
                    <div class="card-actions">
                        <button type="button" id="network-restart-btn" class="btn btn-primary btn-gradient">
                            <span data-icon="refresh" data-icon-size="16"></span> Перезапустить сеть
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <form id="general-network-form">
                        <div class="form-group">
                            <label class="form-label">Имя хоста</label>
                            <input type="text" name="hostname" class="form-input" value="${networkConfig?.hostname || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">DNS-серверы</label>
                            <input type="text" name="dns_servers" class="form-input" value="${typeof networkConfig?.dns_servers === 'string' ? networkConfig?.dns_servers : (Array.isArray(networkConfig?.dns_servers) ? networkConfig?.dns_servers.join(', ') : '')}">
                            <div class="form-help">Укажите через запятую, например: 8.8.8.8, 8.8.4.4</div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-gradient">Сохранить общие настройки</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

/**
 * Получить выбранный интерфейс WAN из конфигурации
 * @returns {object|null} - Объект с данными интерфейса или null
 */
function getSelectedInterface() {
    if (!networkConfig || !networkConfig.interfaces) {
        return null;
    }
    
    const wanInterface = networkConfig.wan_interface;
    if (!wanInterface || !networkConfig.interfaces[wanInterface]) {
        return null;
    }
    
    return networkConfig.interfaces[wanInterface];
}

/**
 * Получить свойство интерфейса LAN
 * @param {string} property - Имя свойства
 * @returns {*} - Значение свойства или undefined
 */
function getLanInterfaceProperty(property) {
    if (!networkConfig || !networkConfig.interfaces) {
        return undefined;
    }
    
    const lanInterface = networkConfig.lan_interface;
    if (!lanInterface || !networkConfig.interfaces[lanInterface]) {
        return undefined;
    }
    
    return networkConfig.interfaces[lanInterface][property];
}

/**
 * Создать HTML-опции для выбора интерфейса
 * @param {string} selectedValue - Выбранное значение
 * @returns {string} - HTML с опциями
 */
function createInterfaceOptions(selectedValue) {
    if (!networkInterfaces) {
        return '';
    }
    
    let options = '';
    Object.entries(networkInterfaces).forEach(([ifName, ifData]) => {
        // Пропускаем loopback интерфейс
        if (ifName === 'lo' || ifName.startsWith('lo')) {
            return;
        }
        
        // Определяем тип интерфейса
        let ifType = 'Ethernet';
        if (ifName.startsWith('wlan') || ifName.startsWith('wlp')) {
            ifType = 'WiFi';
        } else if (ifName.startsWith('tun') || ifName.startsWith('tap')) {
            ifType = 'Tunnel';
        } else if (ifName.startsWith('br')) {
            ifType = 'Bridge';
        }
        
        // Определяем, выбран ли этот интерфейс
        const selected = ifName === selectedValue ? 'selected' : '';
        
        options += `<option value="${ifName}" ${selected}>${ifName} (${ifType})</option>`;
    });
    
    return options;
}

/**
 * Setup network event handlers
 */
function setupNetworkEventHandlers() {
    // Set up tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons and contents
            tabLinks.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            link.classList.add('active');
            const tab = link.dataset.tab;
            document.querySelector(`.tab-content[data-tab="${tab}"]`).classList.add('active');
        });
    });
    
    // WAN method change handler
    const wanMethodSelect = document.getElementById('wan-method-select');
    if (wanMethodSelect) {
        wanMethodSelect.addEventListener('change', () => {
            updateWANFieldsVisibility(wanMethodSelect.value);
        });
    }
    
    // LAN DHCP toggle handler
    const dhcpToggle = document.querySelector('input[name="lan_dhcp_enabled"]');
    if (dhcpToggle) {
        dhcpToggle.addEventListener('change', () => {
            const dhcpFields = document.getElementById('lan-dhcp-fields');
            if (dhcpFields) {
                dhcpFields.style.display = dhcpToggle.checked ? '' : 'none';
            }
        });
    }
    
    // Form submit handlers
    const wanForm = document.getElementById('wan-network-form');
    if (wanForm) {
        wanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveWANConfig(wanForm);
        });
    }
    
    const lanForm = document.getElementById('lan-network-form');
    if (lanForm) {
        lanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveLANConfig(lanForm);
        });
    }
    
    const generalForm = document.getElementById('general-network-form');
    if (generalForm) {
        generalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveGeneralNetworkConfig(generalForm);
        });
    }
    
    // Button click handlers
    const restartNetworkBtn = document.getElementById('network-restart-btn');
    if (restartNetworkBtn) {
        restartNetworkBtn.addEventListener('click', () => {
            restartNetwork();
        });
    }
    
    const restartWanBtn = document.getElementById('wan-restart-btn');
    if (restartWanBtn) {
        restartWanBtn.addEventListener('click', () => {
            restartWAN();
        });
    }
    
    const restartLanBtn = document.getElementById('lan-restart-btn');
    if (restartLanBtn) {
        restartLanBtn.addEventListener('click', () => {
            restartLAN();
        });
    }
    
    const restartInterfaceBtn = document.getElementById('restart-interface-btn');
    if (restartInterfaceBtn) {
        restartInterfaceBtn.addEventListener('click', () => {
            if (!selectedInterface) {
                showNotification('Ошибка', 'Интерфейс не выбран', 'error');
                return;
            }
            
            // Ask for confirmation
            if (confirm(`Вы уверены, что хотите перезапустить интерфейс ${selectedInterface}?`)) {
                // Call the API
                restartSelectedInterface();
            }
        });
    }
    
    // Refresh interfaces button
    const refreshBtn = document.getElementById('refresh-interfaces-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadInterfacesList();
        });
    }
}

/**
 * Загружает и отображает список сетевых интерфейсов
 */
function loadInterfacesList() {
    const container = document.getElementById('network-interface-list');
    if (!container) return;
    
    // Показываем индикатор загрузки
    container.innerHTML = '<div class="loading-spinner"><span data-icon="refresh" data-icon-size="24" class="rotating"></span></div>';
    
    // Применяем иконки
    if (window.Icons && typeof window.Icons.replaceAll === 'function') {
        window.Icons.replaceAll();
    } else if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
    }
    
    // Загружаем список интерфейсов через API
    api.get('/api/network/interfaces')
        .then(data => {
            console.log('Загружен список интерфейсов:', data);
            
            // Сохраняем данные об интерфейсах
            networkInterfaces = data;
            
            // Создаем HTML-разметку для списка интерфейсов
            let html = '<div class="network-interface-list">';
            
            Object.entries(data).forEach(([ifName, ifData]) => {
                // Пропускаем loopback интерфейс
                if (ifName === 'lo' || ifName.startsWith('lo')) {
                    return;
                }
                
                // Определяем тип интерфейса и иконку
                let iconName = 'ethernet';
                let ifType = 'Ethernet';
                if (ifName.startsWith('wlan') || ifName.startsWith('wlp')) {
                    iconName = 'wifi';
                    ifType = 'WiFi';
                } else if (ifName.startsWith('tun') || ifName.startsWith('tap')) {
                    iconName = 'vpn';
                    ifType = 'Tunnel';
                } else if (ifName.startsWith('br')) {
                    iconName = 'link';
                    ifType = 'Bridge';
                }
                
                // Определяем статус интерфейса
                const isUp = ifData.stats && ifData.stats.isup;
                
                // Проверяем, является ли интерфейс WAN или LAN
                let roleHtml = '';
                if (networkConfig && networkConfig.wan_interface === ifName) {
                    roleHtml = '<span class="interface-role wan">WAN</span>';
                } else if (networkConfig && networkConfig.lan_interface === ifName) {
                    roleHtml = '<span class="interface-role lan">LAN</span>';
                }
                
                // Получаем IP-адрес интерфейса
                let ipAddress = 'Нет IP-адреса';
                if (ifData.addresses && ifData.addresses.length > 0) {
                    for (const addr of ifData.addresses) {
                        if (addr.family === 'inet') {
                            ipAddress = addr.address;
                            break;
                        }
                    }
                }
                
                // Создаем HTML-разметку для элемента списка
                html += `
                    <div class="interface-item" data-interface="${ifName}">
                        <div class="interface-icon">
                            <span data-icon="${iconName}" data-icon-size="18"></span>
                        </div>
                        <div class="interface-info">
                            <div class="interface-name">${ifName} ${roleHtml}</div>
                            <div class="interface-details">
                                <span>${ifType}</span>
                                <span class="interface-status ${isUp ? 'up' : ''}">${isUp ? 'Активен' : 'Неактивен'}</span>
                            </div>
                            <div class="interface-ip">${ipAddress}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Отображаем список интерфейсов
            container.innerHTML = html;
            
            // Обновляем опции в выпадающих списках WAN и LAN
            const wanSelect = document.getElementById('wan-interface-select');
            const lanSelect = document.getElementById('lan-interface-select');
            
            if (wanSelect) {
                wanSelect.innerHTML = `<option value="">Выберите интерфейс</option>${createInterfaceOptions(networkConfig?.wan_interface || '')}`;
            }
            
            if (lanSelect) {
                lanSelect.innerHTML = `<option value="">Выберите интерфейс</option>${createInterfaceOptions(networkConfig?.lan_interface || '')}`;
            }
            
            // Добавляем обработчики событий для элементов списка
            const interfaceItems = document.querySelectorAll('.interface-item');
            interfaceItems.forEach(item => {
                item.addEventListener('click', () => {
                    interfaceItems.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    const ifName = item.dataset.interface;
                    selectedInterface = ifName;
                    
                    showInterfaceDetails(ifName, networkInterfaces[ifName]);
                });
            });
            
            // Применяем иконки
            if (window.Icons && typeof window.Icons.replaceAll === 'function') {
                window.Icons.replaceAll();
            } else if (window.feather && typeof window.feather.replace === 'function') {
                window.feather.replace();
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки списка интерфейсов:', error);
            
            // Отображаем сообщение об ошибке
            container.innerHTML = createErrorState(
                'Ошибка загрузки интерфейсов',
                'Не удалось загрузить список сетевых интерфейсов. Проверьте соединение и попробуйте снова.'
            );
        });
}

/**
 * Save network configuration
 * @param {HTMLFormElement} form - Network configuration form
 */
function saveNetworkConfig(form) {
    // Implementation for saving network config
}

/**
 * Restart network services
 */
function restartNetwork() {
    if (!confirm('Вы уверены, что хотите перезапустить все сетевые службы? Это может временно прервать ваше соединение.')) {
        return;
    }
    
    showNotification('info', 'Restarting Network', 'Restarting network services. This may cause a temporary connection loss.');
    
    api.post('/api/network/restart')
        .then(response => {
            if (response.success) {
                showNotification('success', 'Network Restarted', 'Network services have been successfully restarted');
                
                // Reload interfaces list after 3 seconds
                setTimeout(() => {
                    loadInterfacesList();
                }, 3000);
            } else {
                showNotification('error', 'Network Restart Failed', response.message || 'Failed to restart network services');
            }
        })
        .catch(error => {
            console.error('Error restarting network:', error);
            showNotification('error', 'Network Restart Error', error.message || 'Failed to restart network services');
        });
}

/**
 * Restart WAN interface
 */
function restartWAN() {
    // Получаем выбранный WAN интерфейс
    const wanInterfaceSelect = document.getElementById('wan-interface-select');
    if (!wanInterfaceSelect || !wanInterfaceSelect.value) {
        showNotification('Ошибка', 'Не выбран WAN интерфейс для перезапуска', 'error');
        return;
    }
    
    const wanInterface = wanInterfaceSelect.value;
    
    // Спрашиваем подтверждение
    if (confirm(`Вы уверены, что хотите перезапустить WAN интерфейс ${wanInterface}? Это может временно прервать ваше соединение с интернетом.`)) {
        // Показываем уведомление
        showNotification('Перезапуск', `Перезапуск WAN интерфейса ${wanInterface}...`, 'info');
        
        // Вызываем API для перезапуска интерфейса
        api.post('/api/network/restart', { interface: wanInterface })
            .then(response => {
                showNotification('Успех', `WAN интерфейс ${wanInterface} успешно перезапущен`, 'success');
                
                // Перезагружаем информацию через 3 секунды
                setTimeout(() => {
                    loadInterfacesList();
                }, 3000);
            })
            .catch(error => {
                console.error('Ошибка перезапуска WAN интерфейса:', error);
                showNotification('Ошибка', `Не удалось перезапустить WAN интерфейс ${wanInterface}: ${error.message}`, 'error');
            });
    }
}

/**
 * Restart LAN interface
 */
function restartLAN() {
    // Получаем выбранный LAN интерфейс
    const lanInterfaceSelect = document.getElementById('lan-interface-select');
    if (!lanInterfaceSelect || !lanInterfaceSelect.value) {
        showNotification('Ошибка', 'Не выбран LAN интерфейс для перезапуска', 'error');
        return;
    }
    
    const lanInterface = lanInterfaceSelect.value;
    
    // Спрашиваем подтверждение
    if (confirm(`Вы уверены, что хотите перезапустить LAN интерфейс ${lanInterface}? Это может временно прервать ваше локальное соединение.`)) {
        // Показываем уведомление
        showNotification('Перезапуск', `Перезапуск LAN интерфейса ${lanInterface}...`, 'info');
        
        // Вызываем API для перезапуска интерфейса
        api.post('/api/network/restart', { interface: lanInterface })
            .then(response => {
                showNotification('Успех', `LAN интерфейс ${lanInterface} успешно перезапущен`, 'success');
                
                // Перезагружаем информацию через 3 секунды
                setTimeout(() => {
                    loadInterfacesList();
                }, 3000);
            })
            .catch(error => {
                console.error('Ошибка перезапуска LAN интерфейса:', error);
                showNotification('Ошибка', `Не удалось перезапустить LAN интерфейс ${lanInterface}: ${error.message}`, 'error');
            });
    }
}

/**
 * Restart currently selected interface
 */
function restartSelectedInterface() {
    if (!selectedInterface) {
        showNotification('Ошибка', 'Интерфейс не выбран', 'error');
        return;
    }
    
    // Show notification
    showNotification('Перезапуск', `Перезапуск интерфейса ${selectedInterface}...`, 'info');
    
    // Call the API to restart the interface
    api.post('/api/network/restart', { interface: selectedInterface })
        .then(response => {
            showNotification('Успех', `Интерфейс ${selectedInterface} успешно перезапущен`, 'success');
            
            // Reload interfaces list after 3 seconds
            setTimeout(() => {
                loadInterfacesList();
            }, 3000);
        })
        .catch(error => {
            console.error('Ошибка перезапуска интерфейса:', error);
            showNotification('Ошибка', `Не удалось перезапустить интерфейс ${selectedInterface}: ${error.message}`, 'error');
        });
}

/**
 * Update WAN fields visibility based on selected method
 * @param {string} method - Selected WAN method (dhcp/static/pppoe)
 */
function updateWANFieldsVisibility(method) {
    const staticFields = document.getElementById('wan-static-fields');
    const pppoeFields = document.getElementById('wan-pppoe-fields');
    
    if (!staticFields || !pppoeFields) return;
    
    if (method === 'static') {
        staticFields.style.display = '';
        pppoeFields.style.display = 'none';
    } else if (method === 'pppoe') {
        staticFields.style.display = 'none';
        pppoeFields.style.display = '';
    } else {
        staticFields.style.display = 'none';
        pppoeFields.style.display = 'none';
    }
}

/**
 * Показывает детали выбранного интерфейса
 * @param {string} ifName - Имя интерфейса
 * @param {Object} ifData - Данные интерфейса
 */
function showInterfaceDetails(ifName, ifData) {
    const container = document.getElementById('interface-details-content');
    const titleElem = document.getElementById('interface-title');
    const restartBtn = document.getElementById('restart-interface-btn');
    
    // Обновляем заголовок
    titleElem.textContent = `Интерфейс ${ifName}`;
    
    // Включаем кнопку перезапуска
    restartBtn.disabled = false;
    
    // Получаем тип интерфейса
    let ifType = 'Ethernet';
    if (ifName.startsWith('wlan') || ifName.startsWith('wlp')) {
        ifType = 'WiFi';
    } else if (ifName.startsWith('tun') || ifName.startsWith('tap')) {
        ifType = 'Tunnel';
    } else if (ifName.startsWith('br')) {
        ifType = 'Bridge';
    }
    
    // Ищем соответствующий интерфейс в конфигурации сети
    const configInterface = networkConfig && networkConfig.interfaces && networkConfig.interfaces[ifName];
    
    // Создаем форму с информацией об интерфейсе
    let content = `
        <form id="interface-form" class="form">
            <div class="form-group">
                <label class="form-label">Статус</label>
                <div class="form-value">
                    <span class="status-indicator ${ifData.stats && ifData.stats.isup ? 'active' : 'inactive'}"></span>
                    ${ifData.stats && ifData.stats.isup ? 'Активен' : 'Неактивен'}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип</label>
                <div class="form-value">${ifType}</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">MAC-адрес</label>
                <div class="form-value">${getMacAddress(ifData)}</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Метод настройки</label>
                <select name="method" class="form-select">
                    <option value="dhcp" ${configInterface && configInterface.method === 'dhcp' ? 'selected' : ''}>DHCP (автоматически)</option>
                    <option value="static" ${configInterface && configInterface.method === 'static' ? 'selected' : ''}>Статический IP</option>
                </select>
            </div>
            
            <div id="static-ip-config" class="static-ip-fields" style="${configInterface && configInterface.method === 'static' ? '' : 'display: none;'}">
                <div class="form-group">
                    <label class="form-label">IP-адрес</label>
                    <input type="text" name="ip_address" class="form-input" value="${configInterface ? configInterface.ip_address || '' : ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Маска подсети</label>
                    <input type="text" name="netmask" class="form-input" value="${configInterface ? configInterface.netmask || '' : ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Шлюз</label>
                    <input type="text" name="gateway" class="form-input" value="${configInterface ? configInterface.gateway || '' : ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">DNS-серверы</label>
                    <input type="text" name="dns_servers" class="form-input" value="${configInterface ? configInterface.dns_servers || '' : ''}">
                    <div class="form-help">Укажите через запятую, например: 8.8.8.8, 8.8.4.4</div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Активировать</label>
                <div class="toggle-switch">
                    <input type="checkbox" id="interface-enabled" name="is_up" ${configInterface && configInterface.is_up ? 'checked' : ''}>
                    <label for="interface-enabled"></label>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-gradient">Сохранить изменения</button>
            </div>
        </form>
        
        <div class="interface-stats">
            <h3>Статистика интерфейса</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Скорость</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.speed ? (ifData.stats.speed / 1000) + ' Gbps' : 'Н/Д'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">MTU</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.mtu ? ifData.stats.mtu : 'Н/Д'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Rx пакеты</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.rx_packets ? ifData.stats.rx_packets : '0'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Tx пакеты</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.tx_packets ? ifData.stats.tx_packets : '0'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Rx байты</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.rx_bytes ? formatBytes(ifData.stats.rx_bytes) : '0 B'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Tx байты</div>
                    <div class="stat-value">${ifData.stats && ifData.stats.tx_bytes ? formatBytes(ifData.stats.tx_bytes) : '0 B'}</div>
                </div>
            </div>
        </div>
        
        <div class="interface-addresses mt-4">
            <h3>IP адреса</h3>
            ${createAddressesList(ifData.addresses)}
        </div>
    `;
    
    // Обновляем содержимое
    container.innerHTML = content;
    
    // Добавляем обработчик события для формы
    const form = document.getElementById('interface-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveInterfaceConfig(ifName, form);
        });
        
        // Добавляем обработчик для изменения метода настройки
        const methodSelect = form.querySelector('select[name="method"]');
        if (methodSelect) {
            methodSelect.addEventListener('change', () => {
                const staticConfig = document.getElementById('static-ip-config');
                if (staticConfig) {
                    staticConfig.style.display = methodSelect.value === 'static' ? '' : 'none';
                }
            });
        }
    }
}

/**
 * Сохраняет конфигурацию интерфейса
 * @param {string} ifName - Имя интерфейса
 * @param {HTMLFormElement} form - Форма с данными
 */
function saveInterfaceConfig(ifName, form) {
    // Получаем данные формы
    const formData = new FormData(form);
    
    // Создаем данные для запроса
    const data = {
        interfaces: {}
    };
    
    // Заполняем данные интерфейса
    data.interfaces[ifName] = {
        method: formData.get('method'),
        is_up: formData.get('is_up') === 'on'
    };
    
    // Добавляем статические настройки, если метод static
    if (formData.get('method') === 'static') {
        data.interfaces[ifName].ip_address = formData.get('ip_address');
        data.interfaces[ifName].netmask = formData.get('netmask');
        data.interfaces[ifName].gateway = formData.get('gateway');
        
        // Преобразуем строку DNS-серверов в массив
        const dns = formData.get('dns_servers');
        if (dns) {
            data.interfaces[ifName].dns_servers = dns
                .split(',')
                .map(server => server.trim())
                .filter(server => server);
        }
    }
    
    // Блокируем форму на время сохранения
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Показываем уведомление
    showNotification('Сохранение', `Сохранение настроек интерфейса ${ifName}...`, 'info');
    
    // Отправляем запрос на сервер
    api.put('/api/network/config', data)
        .then(response => {
            console.log('Конфигурация интерфейса обновлена:', response);
            
            // Показываем уведомление об успехе
            showNotification('Успех', `Настройки интерфейса ${ifName} успешно обновлены`, 'success');
            
            // Обновляем конфигурацию
            if (response.config) {
                networkConfig = response.config;
            }
            
            // Обновляем отображение информации об интерфейсе
            loadInterfacesList();
        })
        .catch(error => {
            console.error('Ошибка обновления конфигурации интерфейса:', error);
            
            // Показываем уведомление об ошибке
            showNotification('Ошибка', `Не удалось обновить настройки интерфейса ${ifName}: ${error.message}`, 'error');
        })
        .finally(() => {
            // Разблокируем форму
            inputs.forEach(input => {
                input.disabled = false;
            });
        });
}

/**
 * Получает MAC-адрес из данных интерфейса
 * @param {Object} ifData - Данные интерфейса
 * @returns {string} - MAC-адрес или 'Н/Д'
 */
function getMacAddress(ifData) {
    if (ifData.address && ifData.address.toLowerCase() !== '00:00:00:00:00:00') {
        return ifData.address;
    }
    
    if (ifData.stats && ifData.stats.address && ifData.stats.address.toLowerCase() !== '00:00:00:00:00:00') {
        return ifData.stats.address;
    }
    
    return 'Н/Д';
}

/**
 * Форматирует байты в человекочитаемый формат
 * @param {number} bytes - Количество байт
 * @returns {string} - Отформатированный размер
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

/**
 * Создает HTML-список IP-адресов интерфейса
 * @param {Array} addresses - Массив адресов
 * @returns {string} - HTML-разметка
 */
function createAddressesList(addresses) {
    if (!addresses || addresses.length === 0) {
        return '<div class="empty-state small">Нет настроенных IP-адресов</div>';
    }
    
    let html = '<div class="ip-addresses-list">';
    
    addresses.forEach(addr => {
        html += `
            <div class="ip-address-item">
                <div class="ip-address-family">${addr.family}</div>
                <div class="ip-address-value">${addr.address}${addr.prefixlen ? '/' + addr.prefixlen : ''}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

/**
 * Create error state element
 * @param {string} title - Error title
 * @param {string} [message] - Error message
 * @returns {string} - HTML for error state
 */
function createErrorState(title, message) {
    return `
        <div class="error-state">
            <div class="error-icon">
                <span data-icon="alert-triangle" data-icon-size="32"></span>
            </div>
            <div class="error-content">
                <h3 class="error-title">${title}</h3>
                ${message ? `<p class="error-message">${message}</p>` : ''}
                <button id="retry-btn" class="btn btn-outline">Повторить</button>
            </div>
        </div>
    `;
}