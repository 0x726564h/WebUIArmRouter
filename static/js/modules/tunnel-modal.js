/**
 * Модуль для работы с модальными окнами туннелей
 */

// Глобальная функция для отображения уведомлений
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]: ${message}`);
}

/**
 * Показать модальное окно добавления туннеля
 */
function showAddTunnelModal() {
    // Создаем модальное окно
    const modal = createTunnelModal('add');
    document.body.appendChild(modal);

    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Настраиваем обработчики событий для модального окна
    setupTunnelModalEvents(modal);
}

/**
 * Показать модальное окно редактирования туннеля
 * @param {string} tunnelId - ID туннеля
 */
function showEditTunnelModal(tunnelId) {
    // Получаем конфигурацию туннеля
    API.get('/api/tunnel/config')
        .then(response => {
            // Находим туннель по ID
            const tunnel = response.tunnel.tunnels.find(t => t.id === tunnelId);
            if (!tunnel) {
                showNotification('Туннель не найден', 'error');
                return;
            }

            // Создаем модальное окно
            const modal = createTunnelModal('edit', tunnel);
            document.body.appendChild(modal);

            // Показываем модальное окно
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            // Настраиваем обработчики событий для модального окна
            setupTunnelModalEvents(modal, tunnel);
        })
        .catch(error => {
            console.error('Ошибка получения конфигурации туннелей:', error);
            showNotification('Не удалось загрузить информацию о туннеле', 'error');
        });
}

/**
 * Создать модальное окно для туннеля
 * @param {string} mode - Режим отображения (add - добавление, edit - редактирование)
 * @param {Object} tunnel - Настройки туннеля (для режима edit)
 * @returns {HTMLElement} Модальное окно
 */
function createTunnelModal(mode = 'add', tunnel = null) {
    // Заголовок модального окна
    const modalTitle = mode === 'add' ? 'Добавить туннель' : 'Редактировать туннель';
    
    // ID для модального окна
    const modalId = mode === 'add' ? 'add-tunnel-modal' : `edit-tunnel-modal-${tunnel?.id}`;
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = modalId;
    
    // Заполняем HTML модального окна
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-large">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${modalTitle}</h3>
                    <button type="button" class="modal-close" data-dismiss="modal" aria-label="Закрыть">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="tunnel-form">
                        <!-- Основные настройки туннеля -->
                        <div class="form-group">
                            <label class="form-label">Название туннеля</label>
                            <input type="text" class="form-input" name="name" value="${tunnel?.name || ''}" placeholder="Например: Рабочий VPN">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Тип туннеля</label>
                            <select class="form-input form-select" name="type" id="tunnel-type-select">
                                <option value="">Выберите тип туннеля</option>
                                <option value="wireguard" ${tunnel?.type === 'wireguard' ? 'selected' : ''}>WireGuard</option>
                                <option value="openvpn" ${tunnel?.type === 'openvpn' ? 'selected' : ''}>OpenVPN</option>
                                <option value="shadowsocks" ${tunnel?.type === 'shadowsocks' ? 'selected' : ''}>ShadowSocks</option>
                                <option value="vless" ${tunnel?.type === 'vless' ? 'selected' : ''}>VLESS</option>
                                <option value="trojan" ${tunnel?.type === 'trojan' ? 'selected' : ''}>Trojan</option>
                                <option value="ssh" ${tunnel?.type === 'ssh' ? 'selected' : ''}>SSH Tunnel</option>
                            </select>
                        </div>
                        
                        <!-- Контейнер для настроек выбранного типа туннеля -->
                        <div id="tunnel-type-settings" class="mt-3">
                            <div class="placeholder-message text-center py-4">
                                <span data-icon="info"></span>
                                <p>Выберите тип туннеля, чтобы увидеть настройки</p>
                            </div>
                        </div>
                        
                        <!-- Дополнительные настройки туннеля -->
                        <div class="form-group">
                            <label class="form-label">Включить туннель</label>
                            <div class="toggle-group">
                                <label class="toggle-switch">
                                    <input type="checkbox" name="enabled" ${tunnel?.enabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Автоматически подключаться при запуске</label>
                            <div class="toggle-group">
                                <label class="toggle-switch">
                                    <input type="checkbox" name="auto_connect" ${tunnel?.auto_connect ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Примечание</label>
                            <textarea class="form-input" name="description" rows="3" placeholder="Дополнительная информация о туннеле">${tunnel?.description || ''}</textarea>
                        </div>
                    </form>
                    
                    <!-- Tabs для настроек импорта и дополнительных опций -->
                    <ul class="nav-tabs my-3">
                        <li class="nav-item">
                            <a class="nav-link active" data-toggle="tab" href="#import-tab">
                                <span data-icon="download"></span> Импорт конфигурации
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-toggle="tab" href="#advanced-tab">
                                <span data-icon="settings"></span> Дополнительные настройки
                            </a>
                        </li>
                    </ul>
                    
                    <div class="tab-content">
                        <!-- Вкладка импорта конфигурации -->
                        <div id="import-tab" class="tab-pane active">
                            <div class="import-methods">
                                <div class="form-group">
                                    <label class="form-label">Текст конфигурации</label>
                                    <textarea class="form-input" name="config_text" rows="5" placeholder="Вставьте текст конфигурации туннеля"></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">QR-код или URL</label>
                                    <div class="import-options d-flex">
                                        <button type="button" class="btn btn-outline mr-2" id="scan-qr-btn">
                                            <span data-icon="camera"></span> Сканировать QR-код
                                        </button>
                                        <input type="text" class="form-input" name="config_url" placeholder="vless://... или другой URL">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Файл конфигурации</label>
                                    <div class="file-input-wrapper">
                                        <input type="file" name="config_file" id="config-file-input" class="file-input">
                                        <label for="config-file-input" class="btn btn-outline">
                                            <span data-icon="file"></span> Выбрать файл конфигурации
                                        </label>
                                        <span class="file-name">Файл не выбран</span>
                                    </div>
                                </div>
                                
                                <div class="form-actions mt-3">
                                    <button type="button" class="btn btn-primary" id="import-config-btn">
                                        <span data-icon="upload"></span> Импортировать
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Вкладка дополнительных настроек -->
                        <div id="advanced-tab" class="tab-pane">
                            <div class="form-group">
                                <label class="form-label">Реализация</label>
                                <select class="form-input form-select" name="implementation">
                                    <option value="auto">Автоопределение</option>
                                    <option value="remnawave">Remnawave</option>
                                    <option value="xtlsray">x[TLS]Ray</option>
                                    <option value="v2ray">v2Ray</option>
                                    <option value="hiddify">Hiddify</option>
                                    <option value="marzban">Marzban</option>
                                    <option value="hysteria">Hysteria</option>
                                </select>
                                <div class="form-help">Выберите реализацию или "Автоопределение" для автоматического выбора на основе конфигурации</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">DNS для туннеля</label>
                                <input type="text" class="form-input" name="dns_servers" placeholder="8.8.8.8, 1.1.1.1">
                                <div class="form-help">DNS-серверы для использования с туннелем (через запятую)</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Маршрутизация</label>
                                <select class="form-input form-select" name="routing_mode">
                                    <option value="all">Весь трафик через туннель</option>
                                    <option value="selective">Выборочная маршрутизация</option>
                                    <option value="split">Split Tunneling</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Приоритет</label>
                                <input type="number" class="form-input" name="priority" value="50" min="1" max="100">
                                <div class="form-help">Приоритет туннеля при балансировке нагрузки (1-100)</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" data-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" id="save-tunnel-btn">
                        <span data-icon="save"></span> ${mode === 'add' ? 'Добавить' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Инициализируем иконки внутри модального окна
    setTimeout(() => {
        if (window.IconsLoader && typeof window.IconsLoader.init === 'function') {
            window.IconsLoader.init(modal);
        }
    }, 10);
    
    return modal;
}

/**
 * Настроить обработчики событий для модального окна туннеля
 * @param {HTMLElement} modal - Модальное окно
 * @param {Object} tunnel - Настройки туннеля (для режима edit)
 */
function setupTunnelModalEvents(modal, tunnel = null) {
    // Обработчик закрытия модального окна
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    // Обработчики для кнопок закрытия
    modal.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Обработчик клика вне модального окна для закрытия
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Табы внутри модального окна
    modal.querySelectorAll('.nav-tabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('href').substring(1);
            
            // Деактивировать все вкладки и панели
            modal.querySelectorAll('.nav-tabs .nav-link').forEach(t => {
                t.classList.remove('active');
            });
            modal.querySelectorAll('.tab-pane').forEach(p => {
                p.classList.remove('active');
            });
            
            // Активировать выбранную вкладку и панель
            this.classList.add('active');
            modal.querySelector(`#${tabId}`).classList.add('active');
        });
    });
    
    // Обработчик изменения типа туннеля
    const tunnelTypeSelect = modal.querySelector('#tunnel-type-select');
    if (tunnelTypeSelect) {
        tunnelTypeSelect.addEventListener('change', function() {
            const tunnelType = this.value;
            const settingsContainer = modal.querySelector('#tunnel-type-settings');
            
            if (!tunnelType) {
                settingsContainer.innerHTML = `
                    <div class="placeholder-message text-center py-4">
                        <span data-icon="info"></span>
                        <p>Выберите тип туннеля, чтобы увидеть настройки</p>
                    </div>
                `;
                return;
            }
            
            // Заполняем настройки в зависимости от типа туннеля
            settingsContainer.innerHTML = getTunnelTypeSettingsHtml(tunnelType, tunnel);
            
            // Инициализируем иконки внутри новых настроек
            if (window.IconsLoader && typeof window.IconsLoader.init === 'function') {
                window.IconsLoader.init(settingsContainer);
            }
        });
        
        // Если уже выбран тип туннеля, заполняем настройки
        if (tunnelTypeSelect.value) {
            tunnelTypeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Обработчик выбора файла конфигурации
    const fileInput = modal.querySelector('#config-file-input');
    const fileNameLabel = modal.querySelector('.file-name');
    if (fileInput && fileNameLabel) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileNameLabel.textContent = this.files[0].name;
            } else {
                fileNameLabel.textContent = 'Файл не выбран';
            }
        });
    }
    
    // Обработчик кнопки импорта конфигурации
    const importBtn = modal.querySelector('#import-config-btn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            // Заглушка для демонстрации функционала
            const configText = modal.querySelector('textarea[name="config_text"]').value;
            const configUrl = modal.querySelector('input[name="config_url"]').value;
            
            if (!configText && !configUrl && (!fileInput || fileInput.files.length === 0)) {
                showNotification('Укажите конфигурацию для импорта', 'warning');
                return;
            }
            
            showNotification('Импорт конфигурации...', 'info');
            
            // Имитация импорта (в реальном приложении здесь будет обработка)
            setTimeout(() => {
                // Заполняем поля формы автоматически
                if (configText || configUrl) {
                    // Предполагаем, что это VLESS конфигурация для примера
                    const tunnelTypeSelect = modal.querySelector('#tunnel-type-select');
                    if (tunnelTypeSelect) {
                        tunnelTypeSelect.value = 'vless';
                        tunnelTypeSelect.dispatchEvent(new Event('change'));
                        
                        // Заполняем некоторые поля
                        modal.querySelector('input[name="name"]').value = 'Импортированный VLESS';
                        
                        // Активируем вкладку с настройками
                        const advancedTab = modal.querySelector('a[href="#advanced-tab"]');
                        if (advancedTab) {
                            advancedTab.click();
                        }
                    }
                }
                
                showNotification('Конфигурация успешно импортирована', 'success');
            }, 1000);
        });
    }
    
    // Обработчик кнопки сканирования QR-кода
    const scanQrBtn = modal.querySelector('#scan-qr-btn');
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', function() {
            showNotification('Функция сканирования QR-кода будет реализована позже', 'info');
        });
    }
    
    // Обработчик кнопки сохранения туннеля
    const saveBtn = modal.querySelector('#save-tunnel-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Заглушка для демонстрации функционала
            showNotification('Сохранение настроек туннеля...', 'info');
            
            // Имитация сохранения (в реальном приложении здесь будет отправка данных на сервер)
            setTimeout(() => {
                showNotification('Настройки туннеля успешно сохранены', 'success');
                closeModal();
                
                // Перезагружаем список туннелей
                if (typeof loadTunnelConfig === 'function') {
                    loadTunnelConfig();
                }
            }, 1000);
        });
    }
}

/**
 * Получить HTML для настроек выбранного типа туннеля
 * @param {string} tunnelType - Тип туннеля
 * @param {Object} tunnel - Настройки туннеля (для режима edit)
 * @returns {string} HTML для настроек
 */
function getTunnelTypeSettingsHtml(tunnelType, tunnel = null) {
    switch (tunnelType) {
        case 'wireguard':
            return getWireGuardSettingsHtml(tunnel);
        case 'openvpn':
            return getOpenVpnSettingsHtml(tunnel);
        case 'shadowsocks':
            return getShadowsocksSettingsHtml(tunnel);
        case 'vless':
            return getVlessSettingsHtml(tunnel);
        case 'trojan':
            return getTrojanSettingsHtml(tunnel);
        case 'ssh':
            return getSshTunnelSettingsHtml(tunnel);
        default:
            return `
                <div class="alert alert-warning">
                    <span data-icon="alert-triangle"></span>
                    <p>Настройки для типа туннеля "${tunnelType}" не реализованы</p>
                </div>
            `;
    }
}

/**
 * Получить HTML для настроек WireGuard
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getWireGuardSettingsHtml(tunnel = null) {
    return `
        <div class="wireguard-settings">
            <div class="form-group">
                <label class="form-label">Публичный ключ сервера</label>
                <input type="text" class="form-input" name="wireguard.public_key" value="${tunnel?.wireguard?.public_key || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Приватный ключ клиента</label>
                <input type="password" class="form-input" name="wireguard.private_key" value="${tunnel?.wireguard?.private_key || ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="wireguard.server" value="${tunnel?.wireguard?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="wireguard.port" value="${tunnel?.wireguard?.port || '51820'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">IP-адрес клиента</label>
                <input type="text" class="form-input" name="wireguard.client_ip" value="${tunnel?.wireguard?.client_ip || ''}">
                <div class="form-help">IP-адрес клиента в сети WireGuard, например 10.0.0.2/24</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">DNS-серверы</label>
                <input type="text" class="form-input" name="wireguard.dns" value="${tunnel?.wireguard?.dns || ''}">
                <div class="form-help">DNS-серверы через запятую</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">AllowedIPs</label>
                <input type="text" class="form-input" name="wireguard.allowed_ips" value="${tunnel?.wireguard?.allowed_ips || '0.0.0.0/0'}">
                <div class="form-help">IP-адреса и подсети, которые будут маршрутизироваться через туннель</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">PersistentKeepalive</label>
                <input type="number" class="form-input" name="wireguard.keepalive" value="${tunnel?.wireguard?.keepalive || '25'}">
                <div class="form-help">Интервал отправки keepalive-пакетов в секундах</div>
            </div>
        </div>
    `;
}

/**
 * Получить HTML для настроек OpenVPN
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getOpenVpnSettingsHtml(tunnel = null) {
    return `
        <div class="openvpn-settings">
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="openvpn.server" value="${tunnel?.openvpn?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="openvpn.port" value="${tunnel?.openvpn?.port || '1194'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Протокол</label>
                <select class="form-input form-select" name="openvpn.protocol">
                    <option value="udp" ${tunnel?.openvpn?.protocol === 'udp' ? 'selected' : ''}>UDP</option>
                    <option value="tcp" ${tunnel?.openvpn?.protocol === 'tcp' ? 'selected' : ''}>TCP</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Метод шифрования</label>
                <select class="form-input form-select" name="openvpn.cipher">
                    <option value="AES-256-GCM" ${tunnel?.openvpn?.cipher === 'AES-256-GCM' ? 'selected' : ''}>AES-256-GCM</option>
                    <option value="AES-128-GCM" ${tunnel?.openvpn?.cipher === 'AES-128-GCM' ? 'selected' : ''}>AES-128-GCM</option>
                    <option value="AES-256-CBC" ${tunnel?.openvpn?.cipher === 'AES-256-CBC' ? 'selected' : ''}>AES-256-CBC</option>
                    <option value="AES-128-CBC" ${tunnel?.openvpn?.cipher === 'AES-128-CBC' ? 'selected' : ''}>AES-128-CBC</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Метод аутентификации</label>
                <select class="form-input form-select" name="openvpn.auth_method">
                    <option value="certificate" ${tunnel?.openvpn?.auth_method === 'certificate' ? 'selected' : ''}>Сертификат</option>
                    <option value="username_password" ${tunnel?.openvpn?.auth_method === 'username_password' ? 'selected' : ''}>Имя пользователя/пароль</option>
                    <option value="both" ${tunnel?.openvpn?.auth_method === 'both' ? 'selected' : ''}>Оба метода</option>
                </select>
            </div>
            
            <div class="auth-settings certificate-auth">
                <div class="form-group">
                    <label class="form-label">Сертификат CA</label>
                    <textarea class="form-input" name="openvpn.ca_cert" rows="3">${tunnel?.openvpn?.ca_cert || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Сертификат клиента</label>
                    <textarea class="form-input" name="openvpn.client_cert" rows="3">${tunnel?.openvpn?.client_cert || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Ключ клиента</label>
                    <textarea class="form-input" name="openvpn.client_key" rows="3">${tunnel?.openvpn?.client_key || ''}</textarea>
                </div>
            </div>
            
            <div class="auth-settings username-password-auth" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Имя пользователя</label>
                    <input type="text" class="form-input" name="openvpn.username" value="${tunnel?.openvpn?.username || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Пароль</label>
                    <input type="password" class="form-input" name="openvpn.password" value="${tunnel?.openvpn?.password || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Дополнительные опции</label>
                <textarea class="form-input" name="openvpn.extra_options" rows="3" placeholder="Каждая опция с новой строки">${tunnel?.openvpn?.extra_options || ''}</textarea>
            </div>
        </div>
    `;
}

/**
 * Получить HTML для настроек ShadowSocks
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getShadowsocksSettingsHtml(tunnel = null) {
    return `
        <div class="shadowsocks-settings">
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="shadowsocks.server" value="${tunnel?.shadowsocks?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="shadowsocks.port" value="${tunnel?.shadowsocks?.port || '8388'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="password" class="form-input" name="shadowsocks.password" value="${tunnel?.shadowsocks?.password || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Метод шифрования</label>
                <select class="form-input form-select" name="shadowsocks.method">
                    <option value="aes-256-gcm" ${tunnel?.shadowsocks?.method === 'aes-256-gcm' ? 'selected' : ''}>aes-256-gcm</option>
                    <option value="aes-128-gcm" ${tunnel?.shadowsocks?.method === 'aes-128-gcm' ? 'selected' : ''}>aes-128-gcm</option>
                    <option value="chacha20-ietf-poly1305" ${tunnel?.shadowsocks?.method === 'chacha20-ietf-poly1305' ? 'selected' : ''}>chacha20-ietf-poly1305</option>
                    <option value="aes-256-cfb" ${tunnel?.shadowsocks?.method === 'aes-256-cfb' ? 'selected' : ''}>aes-256-cfb</option>
                    <option value="aes-128-cfb" ${tunnel?.shadowsocks?.method === 'aes-128-cfb' ? 'selected' : ''}>aes-128-cfb</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Plugin</label>
                <select class="form-input form-select" name="shadowsocks.plugin">
                    <option value="none" ${tunnel?.shadowsocks?.plugin === 'none' ? 'selected' : ''}>Не использовать</option>
                    <option value="obfs-local" ${tunnel?.shadowsocks?.plugin === 'obfs-local' ? 'selected' : ''}>simple-obfs</option>
                    <option value="v2ray-plugin" ${tunnel?.shadowsocks?.plugin === 'v2ray-plugin' ? 'selected' : ''}>v2ray-plugin</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Plugin Options</label>
                <input type="text" class="form-input" name="shadowsocks.plugin_opts" value="${tunnel?.shadowsocks?.plugin_opts || ''}">
                <div class="form-help">Опции для плагина, например "obfs=http;obfs-host=www.example.com"</div>
            </div>
        </div>
    `;
}

/**
 * Получить HTML для настроек VLESS
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getVlessSettingsHtml(tunnel = null) {
    return `
        <div class="vless-settings">
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="vless.server" value="${tunnel?.vless?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="vless.port" value="${tunnel?.vless?.port || '443'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">UUID</label>
                <input type="text" class="form-input" name="vless.uuid" value="${tunnel?.vless?.uuid || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Безопасность</label>
                <select class="form-input form-select" name="vless.security">
                    <option value="reality" ${tunnel?.vless?.security === 'reality' ? 'selected' : ''}>REALITY</option>
                    <option value="tls" ${tunnel?.vless?.security === 'tls' ? 'selected' : ''}>TLS</option>
                    <option value="xtls" ${tunnel?.vless?.security === 'xtls' ? 'selected' : ''}>XTLS</option>
                    <option value="none" ${tunnel?.vless?.security === 'none' ? 'selected' : ''}>Без шифрования</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сеть</label>
                <select class="form-input form-select" name="vless.network">
                    <option value="tcp" ${tunnel?.vless?.network === 'tcp' ? 'selected' : ''}>TCP</option>
                    <option value="http" ${tunnel?.vless?.network === 'http' ? 'selected' : ''}>HTTP</option>
                    <option value="ws" ${tunnel?.vless?.network === 'ws' ? 'selected' : ''}>WebSocket</option>
                    <option value="h2" ${tunnel?.vless?.network === 'h2' ? 'selected' : ''}>HTTP/2</option>
                    <option value="grpc" ${tunnel?.vless?.network === 'grpc' ? 'selected' : ''}>gRPC</option>
                    <option value="quic" ${tunnel?.vless?.network === 'quic' ? 'selected' : ''}>QUIC</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Flow</label>
                <select class="form-input form-select" name="vless.flow">
                    <option value="" ${tunnel?.vless?.flow === '' ? 'selected' : ''}>Не использовать</option>
                    <option value="xtls-rprx-vision" ${tunnel?.vless?.flow === 'xtls-rprx-vision' ? 'selected' : ''}>xtls-rprx-vision</option>
                    <option value="xtls-rprx-direct" ${tunnel?.vless?.flow === 'xtls-rprx-direct' ? 'selected' : ''}>xtls-rprx-direct</option>
                    <option value="xtls-rprx-splice" ${tunnel?.vless?.flow === 'xtls-rprx-splice' ? 'selected' : ''}>xtls-rprx-splice</option>
                </select>
            </div>
            
            <!-- Настройки для REALITY -->
            <div class="security-settings reality-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Public Key</label>
                    <input type="text" class="form-input" name="vless.reality.public_key" value="${tunnel?.vless?.reality?.public_key || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Short ID</label>
                    <input type="text" class="form-input" name="vless.reality.short_id" value="${tunnel?.vless?.reality?.short_id || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Server Names (SNI)</label>
                    <input type="text" class="form-input" name="vless.reality.server_names" value="${tunnel?.vless?.reality?.server_names || ''}">
                    <div class="form-help">Список доменов через запятую</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">SpiderX</label>
                    <input type="text" class="form-input" name="vless.reality.spiderx" value="${tunnel?.vless?.reality?.spiderx || ''}">
                </div>
            </div>
            
            <!-- Настройки для TLS -->
            <div class="security-settings tls-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Server Name (SNI)</label>
                    <input type="text" class="form-input" name="vless.tls.server_name" value="${tunnel?.vless?.tls?.server_name || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Allow Insecure</label>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="vless.tls.allow_insecure" ${tunnel?.vless?.tls?.allow_insecure ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-help">Разрешить непроверенные сертификаты</div>
                </div>
            </div>
            
            <!-- Настройки для WebSocket -->
            <div class="network-settings ws-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">WebSocket Path</label>
                    <input type="text" class="form-input" name="vless.ws.path" value="${tunnel?.vless?.ws?.path || '/'}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">WebSocket Host</label>
                    <input type="text" class="form-input" name="vless.ws.host" value="${tunnel?.vless?.ws?.host || ''}">
                </div>
            </div>
            
            <!-- Настройки для HTTP -->
            <div class="network-settings http-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">HTTP Host</label>
                    <input type="text" class="form-input" name="vless.http.host" value="${tunnel?.vless?.http?.host || ''}">
                    <div class="form-help">Список хостов через запятую</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">HTTP Path</label>
                    <input type="text" class="form-input" name="vless.http.path" value="${tunnel?.vless?.http?.path || '/'}">
                </div>
            </div>
            
            <!-- Настройки для gRPC -->
            <div class="network-settings grpc-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Service Name</label>
                    <input type="text" class="form-input" name="vless.grpc.service_name" value="${tunnel?.vless?.grpc?.service_name || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mode</label>
                    <select class="form-input form-select" name="vless.grpc.mode">
                        <option value="gun" ${tunnel?.vless?.grpc?.mode === 'gun' ? 'selected' : ''}>gun</option>
                        <option value="multi" ${tunnel?.vless?.grpc?.mode === 'multi' ? 'selected' : ''}>multi</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

/**
 * Получить HTML для настроек Trojan
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getTrojanSettingsHtml(tunnel = null) {
    return `
        <div class="trojan-settings">
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="trojan.server" value="${tunnel?.trojan?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="trojan.port" value="${tunnel?.trojan?.port || '443'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="password" class="form-input" name="trojan.password" value="${tunnel?.trojan?.password || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Server Name (SNI)</label>
                <input type="text" class="form-input" name="trojan.sni" value="${tunnel?.trojan?.sni || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип подключения</label>
                <select class="form-input form-select" name="trojan.type">
                    <option value="original" ${tunnel?.trojan?.type === 'original' ? 'selected' : ''}>Оригинальный</option>
                    <option value="trojan-go" ${tunnel?.trojan?.type === 'trojan-go' ? 'selected' : ''}>Trojan-Go</option>
                </select>
            </div>
            
            <div class="type-settings trojan-go-settings" style="display: none;">
                <div class="form-group">
                    <label class="form-label">WebSocket</label>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="trojan.trojan_go.websocket.enabled" ${tunnel?.trojan?.trojan_go?.websocket?.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">WebSocket Path</label>
                    <input type="text" class="form-input" name="trojan.trojan_go.websocket.path" value="${tunnel?.trojan?.trojan_go?.websocket?.path || '/'}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">WebSocket Host</label>
                    <input type="text" class="form-input" name="trojan.trojan_go.websocket.host" value="${tunnel?.trojan?.trojan_go?.websocket?.host || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Allow Insecure</label>
                <div class="toggle-group">
                    <label class="toggle-switch">
                        <input type="checkbox" name="trojan.allow_insecure" ${tunnel?.trojan?.allow_insecure ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="form-help">Разрешить непроверенные сертификаты</div>
            </div>
        </div>
    `;
}

/**
 * Получить HTML для настроек SSH Tunnel
 * @param {Object} tunnel - Настройки туннеля
 * @returns {string} HTML для настроек
 */
function getSshTunnelSettingsHtml(tunnel = null) {
    return `
        <div class="ssh-settings">
            <div class="form-row">
                <div class="form-group col-md-8">
                    <label class="form-label">Адрес сервера</label>
                    <input type="text" class="form-input" name="ssh.server" value="${tunnel?.ssh?.server || ''}">
                </div>
                
                <div class="form-group col-md-4">
                    <label class="form-label">Порт</label>
                    <input type="number" class="form-input" name="ssh.port" value="${tunnel?.ssh?.port || '22'}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Имя пользователя</label>
                <input type="text" class="form-input" name="ssh.username" value="${tunnel?.ssh?.username || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Метод аутентификации</label>
                <select class="form-input form-select" name="ssh.auth_method">
                    <option value="password" ${tunnel?.ssh?.auth_method === 'password' ? 'selected' : ''}>Пароль</option>
                    <option value="key" ${tunnel?.ssh?.auth_method === 'key' ? 'selected' : ''}>Ключ</option>
                </select>
            </div>
            
            <div class="auth-settings ssh-password-auth">
                <div class="form-group">
                    <label class="form-label">Пароль</label>
                    <input type="password" class="form-input" name="ssh.password" value="${tunnel?.ssh?.password || ''}">
                </div>
            </div>
            
            <div class="auth-settings ssh-key-auth" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Приватный ключ</label>
                    <textarea class="form-input" name="ssh.private_key" rows="3">${tunnel?.ssh?.private_key || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Парольная фраза</label>
                    <input type="password" class="form-input" name="ssh.key_passphrase" value="${tunnel?.ssh?.key_passphrase || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Локальный порт SOCKS5</label>
                <input type="number" class="form-input" name="ssh.local_port" value="${tunnel?.ssh?.local_port || '1080'}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Параметры Dynamic Forward</label>
                <input type="text" class="form-input" name="ssh.dynamic_forward" value="${tunnel?.ssh?.dynamic_forward || ''}">
                <div class="form-help">Например: 127.0.0.1:1080</div>
            </div>
        </div>
    `;
}

/**
 * Показать подтверждение удаления туннеля
 * @param {string} tunnelId - ID туннеля
 */
function showDeleteTunnelConfirmation(tunnelId) {
    // Создаем модальное окно подтверждения
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'delete-tunnel-confirmation';
    
    // Заполняем HTML модального окна
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-small">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Подтверждение удаления</h3>
                    <button type="button" class="modal-close" data-dismiss="modal" aria-label="Закрыть">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Вы действительно хотите удалить туннель?</p>
                    <p>Это действие нельзя отменить.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" data-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                        <span data-icon="trash-2"></span> Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно на страницу
    document.body.appendChild(modal);
    
    // Инициализируем иконки внутри модального окна
    if (window.IconsLoader && typeof window.IconsLoader.init === 'function') {
        window.IconsLoader.init(modal);
    }
    
    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Обработчик закрытия модального окна
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    // Обработчики для кнопок закрытия
    modal.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Обработчик клика вне модального окна для закрытия
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Обработчик кнопки подтверждения удаления
    const confirmBtn = modal.querySelector('#confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            // Заглушка для демонстрации функционала
            showNotification('Удаление туннеля...', 'info');
            
            // Имитация удаления (в реальном приложении здесь будет отправка данных на сервер)
            setTimeout(() => {
                showNotification('Туннель успешно удален', 'success');
                closeModal();
                
                // Перезагружаем список туннелей
                if (typeof loadTunnelConfig === 'function') {
                    loadTunnelConfig();
                }
            }, 1000);
        });
    }
}

// Экспорт объекта в глобальный scope после определения функций
window.TunnelModal = {
    showAddTunnelModal: showAddTunnelModal,
    showEditTunnelModal: showEditTunnelModal,
    showDeleteTunnelConfirmation: showDeleteTunnelConfirmation
};