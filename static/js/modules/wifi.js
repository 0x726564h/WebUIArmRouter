/**
 * WiFi Module
 * Handles WiFi configuration and scanning
 * Supports multiple WiFi adapters with independent configurations
 */

let wifiConfig = null;
let activeAdapter = null;
let scanningAdapter = null;

/**
 * Load the WiFi module
 */
function loadWifiModule() {
    // Get the WiFi module container
    const moduleContainer = document.getElementById('wifi-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><span data-icon="loader"></span> Загрузка...</div>';
    if (window.IconsLoader) window.IconsLoader.init();
    
    // Load WiFi configuration
    api.get('/api/wifi/config')
        .then(data => {
            // Store configuration globally
            wifiConfig = data.wifi;
            
            // Process configuration to ensure it has proper structure for multi-adapter support
            processWifiConfig();
            
            // Create module content
            moduleContainer.innerHTML = createWifiContent(wifiConfig);
            
            // Set active adapter (first one by default)
            if (wifiConfig.adapters && Object.keys(wifiConfig.adapters).length > 0) {
                activeAdapter = Object.keys(wifiConfig.adapters)[0];
            }
            
            // Set up form submission handler and attach event listeners
            setupWifiEventHandlers();
            
            // Initialize icons
            if (window.IconsLoader) window.IconsLoader.init();
        })
        .catch(error => {
            console.error('Error loading WiFi configuration:', error);
            moduleContainer.innerHTML = createErrorState('Failed to load WiFi configuration', error.message);
            if (window.IconsLoader) window.IconsLoader.init();
        });
}

/**
 * Process WiFi configuration to ensure it's compatible with multi-adapter support
 */
function processWifiConfig() {
    // Ensure we have a configuration object
    if (!wifiConfig) {
        wifiConfig = {};
    }
    
    // Check if the configuration already has an 'adapters' property
    if (!wifiConfig.adapters) {
        // Convert old single-adapter format to new multi-adapter format
        let adapters = {};
        
        // If an interface is specified, use it as the adapter name
        const adapterName = wifiConfig.interface || 'wlan0';
        
        // Create adapter entry with existing settings
        adapters[adapterName] = {
            enabled: wifiConfig.enabled !== undefined ? wifiConfig.enabled : true,
            mode: wifiConfig.mode || 'client',
            client: wifiConfig.client || { ssid: '', password: '', encryption: 'wpa2' },
            ap: wifiConfig.ap || { ssid: 'ArmRouter', password: '', encryption: 'wpa2', channel: 6 }
        };
        
        // Replace single adapter config with multi-adapter format
        wifiConfig.adapters = adapters;
    }
    
    // Ensure each adapter has all required fields
    Object.keys(wifiConfig.adapters).forEach(adapter => {
        const adapterConfig = wifiConfig.adapters[adapter];
        
        // Set default values if not present
        adapterConfig.enabled = adapterConfig.enabled !== undefined ? adapterConfig.enabled : true;
        adapterConfig.mode = adapterConfig.mode || 'client';
        adapterConfig.client = adapterConfig.client || { ssid: '', password: '', encryption: 'wpa2' };
        adapterConfig.ap = adapterConfig.ap || { ssid: 'ArmRouter', password: '', encryption: 'wpa2', channel: 6 };
    });
}

/**
 * Create WiFi module content with multi-adapter support
 * @param {object} config - WiFi configuration
 * @returns {string} - HTML content
 */
function createWifiContent(config) {
    if (!config) {
        return createErrorState('Конфигурация WiFi не найдена');
    }
    
    // Проверяем наличие WiFi адаптеров
    if (!config.available || (config.error && config.error.length > 0)) {
        // Отображаем сообщение об ошибке, если нет доступных адаптеров
        let errorMessage = config.error || 'Адаптеры WiFi не найдены. Подключите WiFi адаптер к устройству и перезагрузите страницу.';
        return `
            <div class="card">
                <div class="card-content">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <span data-icon="wifi-off" style="width: 48px; height: 48px;"></span>
                        </div>
                        <h3>WiFi недоступен</h3>
                        <p>${errorMessage}</p>
                        <button class="btn btn-primary" id="refreshWiFiBtn">
                            <span data-icon="refresh-cw"></span> Проверить снова
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Проверяем наличие адаптеров в конфигурации
    if (!config.adapters || Object.keys(config.adapters).length === 0) {
        return createErrorState('Адаптеры WiFi не настроены', 'Для начала работы добавьте WiFi адаптер.');
    }
    
    // Create adapter tabs
    const adapterTabs = createAdapterTabs(config);
    
    // Generate adapter forms for each adapter
    const adapterForms = createAdapterForms(config);
    
    return `
        <div class="card" id="wifi-adapters-container">
            <div class="card-header">
                <h2>Настройки WiFi</h2>
                <button type="button" id="scan-all-btn" class="btn btn-outline">
                    <span data-icon="search"></span> Сканировать сети
                </button>
            </div>
            <div class="card-content">
                <div class="wifi-adapters-tabs" id="adapter-tabs">
                    ${adapterTabs}
                </div>
                
                <div id="adapter-forms">
                    ${adapterForms}
                </div>
                
                <div class="add-adapter-btn" id="add-adapter-btn">
                    <span data-icon="plus-circle"></span> Добавить новый адаптер
                </div>
            </div>
        </div>
        
        <div id="wifi-scan-results" style="display: none;">
            <section class="card">
                <div class="card-header">
                    <h2>Доступные WiFi сети</h2>
                    <div>
                        <span id="scanning-adapter-label"></span>
                        <button type="button" id="refresh-scan-btn" class="btn btn-outline">
                            <span data-icon="refresh-cw"></span> Обновить
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div id="scan-results-container">
                        <div class="loading-spinner">
                            <span data-icon="loader"></span> Сканирование...
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

/**
 * Create tabs for each WiFi adapter
 * @param {object} config - WiFi configuration
 * @returns {string} - HTML content for adapter tabs
 */
function createAdapterTabs(config) {
    if (!config.adapters || Object.keys(config.adapters).length === 0) {
        return '';
    }
    
    let tabs = '';
    
    // Create a tab for each adapter
    Object.keys(config.adapters).forEach((adapter, index) => {
        const adapterConfig = config.adapters[adapter];
        const isActive = index === 0; // First adapter is active by default
        
        // Determine the mode badge
        let modeBadge = '';
        if (adapterConfig.enabled) {
            if (adapterConfig.mode === 'client') {
                modeBadge = '<span class="adapter-mode-badge client">Клиент</span>';
            } else if (adapterConfig.mode === 'ap') {
                modeBadge = '<span class="adapter-mode-badge ap">Точка доступа</span>';
            }
        } else {
            modeBadge = '<span class="adapter-mode-badge disabled">Отключен</span>';
        }
        
        tabs += `
            <div class="wifi-adapter-tab ${isActive ? 'active' : ''}" data-adapter="${adapter}">
                <div class="wifi-adapter-icon">
                    <span data-icon="wifi"></span>
                </div>
                <span>${adapter}</span>
                ${modeBadge}
            </div>
        `;
    });
    
    return tabs;
}

/**
 * Create form sections for each WiFi adapter
 * @param {object} config - WiFi configuration
 * @returns {string} - HTML content for adapter forms
 */
function createAdapterForms(config) {
    if (!config.adapters || Object.keys(config.adapters).length === 0) {
        return '';
    }
    
    let forms = '';
    
    // Create a form for each adapter
    Object.keys(config.adapters).forEach((adapter, index) => {
        const adapterConfig = config.adapters[adapter];
        const isVisible = index === 0; // First adapter is visible by default
        
        forms += `
            <div class="adapter-form" id="adapter-form-${adapter}" style="${isVisible ? '' : 'display: none;'}">
                <div class="adapter-card-header">
                    <div class="adapter-title">
                        <span data-icon="wifi"></span>
                        ${adapter}
                    </div>
                    <div class="adapter-actions">
                        <button type="button" class="btn btn-sm btn-outline scan-adapter-btn" data-adapter="${adapter}">
                            <span data-icon="search"></span> Сканировать
                        </button>
                        <button type="button" class="btn btn-sm btn-outline remove-adapter-btn" data-adapter="${adapter}">
                            <span data-icon="trash-2"></span>
                        </button>
                    </div>
                </div>
                
                <form class="wifi-adapter-form" data-adapter="${adapter}">
                    <div class="form-group">
                        <label class="form-label">Статус</label>
                        <div class="toggle-group">
                            <label class="toggle-switch">
                                <input type="checkbox" name="enabled" ${adapterConfig.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="toggle-label">${adapterConfig.enabled ? 'Включен' : 'Отключен'}</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Режим работы</label>
                        <select name="mode" class="form-input form-select wifi-mode-select">
                            <option value="client" ${adapterConfig.mode === 'client' ? 'selected' : ''}>Клиент (подключаться к сети)</option>
                            <option value="ap" ${adapterConfig.mode === 'ap' ? 'selected' : ''}>Точка доступа (создать сеть)</option>
                        </select>
                    </div>
                    
                    <div class="wifi-client-fields" style="${adapterConfig.mode === 'client' ? '' : 'display: none;'}">
                        <div class="form-group">
                            <label class="form-label">Имя сети (SSID)</label>
                            <div class="input-group">
                                <input type="text" name="client.ssid" class="form-input" value="${adapterConfig.client?.ssid || ''}">
                                <button type="button" class="btn btn-outline scan-wifi-btn" data-adapter="${adapter}">
                                    <span data-icon="search"></span> Сканировать
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Пароль</label>
                            <input type="password" name="client.password" class="form-input" value="${adapterConfig.client?.password || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Шифрование</label>
                            <select name="client.encryption" class="form-input form-select">
                                <option value="wpa2" ${adapterConfig.client?.encryption === 'wpa2' ? 'selected' : ''}>WPA2-PSK</option>
                                <option value="wpa" ${adapterConfig.client?.encryption === 'wpa' ? 'selected' : ''}>WPA-PSK</option>
                                <option value="wep" ${adapterConfig.client?.encryption === 'wep' ? 'selected' : ''}>WEP</option>
                                <option value="none" ${adapterConfig.client?.encryption === 'none' ? 'selected' : ''}>Нет (открытая сеть)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="wifi-ap-fields" style="${adapterConfig.mode === 'ap' ? '' : 'display: none;'}">
                        <div class="form-group">
                            <label class="form-label">Имя сети (SSID)</label>
                            <input type="text" name="ap.ssid" class="form-input" value="${adapterConfig.ap?.ssid || 'ArmRouter'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Пароль</label>
                            <input type="password" name="ap.password" class="form-input" value="${adapterConfig.ap?.password || ''}">
                            <div class="form-help">Рекомендуется не менее 8 символов</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Шифрование</label>
                            <select name="ap.encryption" class="form-input form-select">
                                <option value="wpa2" ${adapterConfig.ap?.encryption === 'wpa2' ? 'selected' : ''}>WPA2-PSK</option>
                                <option value="wpa" ${adapterConfig.ap?.encryption === 'wpa' ? 'selected' : ''}>WPA-PSK</option>
                                <option value="wep" ${adapterConfig.ap?.encryption === 'wep' ? 'selected' : ''}>WEP</option>
                                <option value="none" ${adapterConfig.ap?.encryption === 'none' ? 'selected' : ''}>Нет (открытая сеть)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Канал</label>
                            <select name="ap.channel" class="form-input form-select">
                                ${createChannelOptions(adapterConfig.ap?.channel || 6)}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Сохранить настройки</button>
                        <button type="button" class="btn btn-outline reset-adapter-btn" data-adapter="${adapter}">Сбросить</button>
                    </div>
                </form>
            </div>
        `;
    });
    
    return forms;
}

/**
 * Create options for WiFi channels
 * @param {number} selectedChannel - Currently selected channel
 * @returns {string} - HTML options
 */
function createChannelOptions(selectedChannel) {
    let options = '';
    
    // 2.4 GHz channels
    for (let i = 1; i <= 13; i++) {
        options += `<option value="${i}" ${i === selectedChannel ? 'selected' : ''}>Канал ${i} (2.4 GHz)</option>`;
    }
    
    // 5 GHz channels
    const fiveGhzChannels = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
    
    fiveGhzChannels.forEach(channel => {
        options += `<option value="${channel}" ${channel === selectedChannel ? 'selected' : ''}>Канал ${channel} (5 GHz)</option>`;
    });
    
    return options;
}

/**
 * Set up all event handlers for WiFi module
 */
function setupWifiEventHandlers() {
    // Setup adapter tabs
    setupAdapterTabs();
    
    // Setup mode selects
    setupModeSelects();
    
    // Setup enabled toggles
    setupEnabledToggles();
    
    // Setup scan buttons
    setupScanButtons();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup reset buttons
    setupResetButtons();
    
    // Setup add adapter button
    setupAddAdapterButton();
    
    // Setup remove adapter buttons
    setupRemoveAdapterButtons();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refreshWiFiBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadWifiModule();
        });
    }
}

/**
 * Set up adapter tab switching
 */
function setupAdapterTabs() {
    const tabs = document.querySelectorAll('.wifi-adapter-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Get adapter name
            const adapterName = tab.getAttribute('data-adapter');
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all adapter forms
            document.querySelectorAll('.adapter-form').forEach(form => {
                form.style.display = 'none';
            });
            
            // Show the form for this adapter
            const adapterForm = document.getElementById(`adapter-form-${adapterName}`);
            if (adapterForm) {
                adapterForm.style.display = '';
            }
            
            // Set active adapter
            activeAdapter = adapterName;
        });
    });
}

/**
 * Set up mode selects for each adapter
 */
function setupModeSelects() {
    const modeSelects = document.querySelectorAll('.wifi-mode-select');
    
    modeSelects.forEach(select => {
        select.addEventListener('change', () => {
            const form = select.closest('form');
            const clientFields = form.querySelector('.wifi-client-fields');
            const apFields = form.querySelector('.wifi-ap-fields');
            
            if (select.value === 'client') {
                clientFields.style.display = '';
                apFields.style.display = 'none';
            } else {
                clientFields.style.display = 'none';
                apFields.style.display = '';
            }
        });
    });
}

/**
 * Set up enabled toggles for each adapter
 */
function setupEnabledToggles() {
    const toggles = document.querySelectorAll('input[name="enabled"]');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const label = toggle.closest('.toggle-group').querySelector('.toggle-label');
            label.textContent = toggle.checked ? 'Включен' : 'Отключен';
        });
    });
}

/**
 * Set up scan buttons
 */
function setupScanButtons() {
    // Adapter-specific scan buttons
    const scanButtons = document.querySelectorAll('.scan-adapter-btn, .scan-wifi-btn');
    
    scanButtons.forEach(button => {
        button.addEventListener('click', () => {
            const adapterName = button.getAttribute('data-adapter');
            
            if (adapterName) {
                scanningAdapter = adapterName;
                scanWifiNetworks(adapterName);
            }
        });
    });
    
    // General scan button (uses active adapter)
    const scanAllBtn = document.getElementById('scan-all-btn');
    if (scanAllBtn) {
        scanAllBtn.addEventListener('click', () => {
            if (activeAdapter) {
                scanningAdapter = activeAdapter;
                scanWifiNetworks(activeAdapter);
            }
        });
    }
    
    // Refresh scan button
    const refreshScanBtn = document.getElementById('refresh-scan-btn');
    if (refreshScanBtn) {
        refreshScanBtn.addEventListener('click', () => {
            if (scanningAdapter) {
                scanWifiNetworks(scanningAdapter);
            }
        });
    }
}

/**
 * Set up form handlers
 */
function setupFormHandlers() {
    const forms = document.querySelectorAll('.wifi-adapter-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // Get adapter name
            const adapterName = form.getAttribute('data-adapter');
            
            // Create config object from form
            const adapterConfig = {
                enabled: form.elements['enabled'].checked,
                mode: form.elements['mode'].value
            };
            
            // Client mode config
            if (adapterConfig.mode === 'client') {
                adapterConfig.client = {
                    ssid: form.elements['client.ssid'].value,
                    password: form.elements['client.password'].value,
                    encryption: form.elements['client.encryption'].value
                };
            }
            
            // AP mode config
            if (adapterConfig.mode === 'ap') {
                adapterConfig.ap = {
                    ssid: form.elements['ap.ssid'].value,
                    password: form.elements['ap.password'].value,
                    encryption: form.elements['ap.encryption'].value,
                    channel: parseInt(form.elements['ap.channel'].value, 10)
                };
            }
            
            // Save config
            saveWifiConfig(form, adapterName, adapterConfig);
        });
    });
}

/**
 * Set up reset buttons
 */
function setupResetButtons() {
    const resetButtons = document.querySelectorAll('.reset-adapter-btn');
    
    resetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const adapterName = button.getAttribute('data-adapter');
            
            if (confirm(`Сбросить настройки адаптера ${adapterName}?`)) {
                loadWifiModule();
            }
        });
    });
}

/**
 * Set up add adapter button
 */
function setupAddAdapterButton() {
    const addButton = document.getElementById('add-adapter-btn');
    
    if (addButton) {
        addButton.addEventListener('click', () => {
            showAddAdapterDialog();
        });
    }
}

/**
 * Show dialog to add a new adapter
 */
function showAddAdapterDialog() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить WiFi адаптер</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="add-adapter-form">
                        <div class="form-group">
                            <label class="form-label">Имя адаптера</label>
                            <input type="text" name="adapter-name" class="form-input" placeholder="wlan0" required>
                            <div class="form-help">Введите имя WiFi адаптера, например: wlan0, wlan1</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="add-adapter-form" class="btn btn-primary">Добавить</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modal);
    
    // Initialize icons
    if (window.IconsLoader) window.IconsLoader.init(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close button handler
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modal);
        });
    });
    
    // Form submit handler
    const form = modal.querySelector('#add-adapter-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get adapter name
        const adapterName = form.elements['adapter-name'].value;
        
        if (!adapterName) {
            alert('Введите имя адаптера');
            return;
        }
        
        // Check if adapter already exists
        if (wifiConfig.adapters && wifiConfig.adapters[adapterName]) {
            alert(`Адаптер ${adapterName} уже существует`);
            return;
        }
        
        // Add new adapter
        if (!wifiConfig.adapters) {
            wifiConfig.adapters = {};
        }
        
        wifiConfig.adapters[adapterName] = {
            enabled: true,
            mode: 'client',
            client: {
                ssid: '',
                password: '',
                encryption: 'wpa2'
            },
            ap: {
                ssid: `ArmRouter-${adapterName}`,
                password: '',
                encryption: 'wpa2',
                channel: 6
            }
        };
        
        // Save config
        api.put('/api/wifi/config', { wifi: wifiConfig })
            .then(response => {
                // Close modal
                closeModal(modal);
                
                // Reload WiFi module
                loadWifiModule();
                
                // Show success message
                showNotification('success', 'Адаптер добавлен', `Адаптер ${adapterName} успешно добавлен`);
            })
            .catch(error => {
                console.error('Ошибка добавления адаптера:', error);
                alert(`Ошибка добавления адаптера: ${error.message || 'Неизвестная ошибка'}`);
            });
    });
}

/**
 * Close a modal dialog
 * @param {HTMLElement} modal - Modal element to close
 */
function closeModal(modal) {
    modal.classList.remove('show');
    
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

/**
 * Set up remove adapter buttons
 */
function setupRemoveAdapterButtons() {
    const removeButtons = document.querySelectorAll('.remove-adapter-btn');
    
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const adapterName = button.getAttribute('data-adapter');
            
            if (adapterName) {
                showRemoveAdapterConfirmation(adapterName);
            }
        });
    });
}

/**
 * Show dialog to confirm adapter removal
 * @param {string} adapterName - Name of adapter to remove
 */
function showRemoveAdapterConfirmation(adapterName) {
    if (confirm(`Вы уверены, что хотите удалить адаптер ${adapterName}?`)) {
        // Remove adapter from config
        if (wifiConfig.adapters && wifiConfig.adapters[adapterName]) {
            delete wifiConfig.adapters[adapterName];
            
            // Save config
            api.put('/api/wifi/config', { wifi: wifiConfig })
                .then(response => {
                    // Reload WiFi module
                    loadWifiModule();
                    
                    // Show success message
                    showNotification('success', 'Адаптер удален', `Адаптер ${adapterName} успешно удален`);
                })
                .catch(error => {
                    console.error('Ошибка удаления адаптера:', error);
                    alert(`Ошибка удаления адаптера: ${error.message || 'Неизвестная ошибка'}`);
                });
        }
    }
}

/**
 * Save WiFi configuration for a specific adapter
 * @param {HTMLFormElement} form - WiFi configuration form
 * @param {string} adapterName - Name of adapter
 * @param {object} adapterConfig - Adapter configuration
 */
function saveWifiConfig(form, adapterName, adapterConfig) {
    if (!wifiConfig || !wifiConfig.adapters) {
        showNotification('error', 'Ошибка сохранения', 'Конфигурация WiFi не инициализирована');
        return;
    }
    
    // Update adapter config in the global configuration
    wifiConfig.adapters[adapterName] = { ...wifiConfig.adapters[adapterName], ...adapterConfig };
    
    // Disable form inputs during save
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Show saving state for submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span data-icon="loader" class="loader-spinner"></span> Сохранение...';
    if (window.IconsLoader) window.IconsLoader.init(submitBtn);
    
    // Save config
    api.put('/api/wifi/config', { wifi: wifiConfig })
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            if (window.IconsLoader) window.IconsLoader.init(submitBtn);
            
            // Show success message
            showNotification('success', 'Настройки WiFi', 'Конфигурация WiFi успешно сохранена');
            
            // Update adapter tab badge
            updateAdapterTabBadge(adapterName, adapterConfig);
        })
        .catch(error => {
            console.error('Ошибка сохранения конфигурации WiFi:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            if (window.IconsLoader) window.IconsLoader.init(submitBtn);
            
            // Show error message
            showNotification('error', 'Ошибка настроек WiFi', error.message || 'Не удалось сохранить конфигурацию WiFi');
        });
}

/**
 * Update badge on adapter tab to reflect current mode
 * @param {string} adapterName - Name of adapter
 * @param {object} adapterConfig - Adapter configuration
 */
function updateAdapterTabBadge(adapterName, adapterConfig) {
    const tab = document.querySelector(`.wifi-adapter-tab[data-adapter="${adapterName}"]`);
    if (!tab) return;
    
    // Determine the mode badge
    let modeBadge = '';
    if (adapterConfig.enabled) {
        if (adapterConfig.mode === 'client') {
            modeBadge = '<span class="adapter-mode-badge client">Клиент</span>';
        } else if (adapterConfig.mode === 'ap') {
            modeBadge = '<span class="adapter-mode-badge ap">Точка доступа</span>';
        }
    } else {
        modeBadge = '<span class="adapter-mode-badge disabled">Отключен</span>';
    }
    
    // Find existing badge and replace it
    const existingBadge = tab.querySelector('.adapter-mode-badge');
    if (existingBadge) {
        existingBadge.outerHTML = modeBadge;
    } else {
        // Append badge if it doesn't exist
        tab.innerHTML += modeBadge;
    }
}

/**
 * Scan for available WiFi networks using specified adapter
 * @param {string} adapterName - Name of adapter to use for scanning
 */
function scanWifiNetworks(adapterName) {
    // Show scan results section
    const scanResults = document.getElementById('wifi-scan-results');
    scanResults.style.display = '';
    
    // Show scanning adapter name
    const scanningLabel = document.getElementById('scanning-adapter-label');
    if (scanningLabel) {
        scanningLabel.textContent = `Адаптер: ${adapterName}`;
    }
    
    // Get container and show loading
    const container = document.getElementById('scan-results-container');
    container.innerHTML = '<div class="loading-spinner"><span data-icon="loader"></span> Сканирование...</div>';
    if (window.IconsLoader) window.IconsLoader.init(container);
    
    // Make API call to scan networks
    api.get(`/api/wifi/scan?adapter=${adapterName}`)
        .then(networks => {
            // Clear container
            container.innerHTML = '';
            
            if (!networks || networks.length === 0) {
                container.innerHTML = '<div class="empty-state">Не найдено WiFi сетей</div>';
                return;
            }
            
            // Create HTML for networks list
            container.innerHTML = createNetworkListHtml(networks);
            
            // Initialize icons
            if (window.IconsLoader) window.IconsLoader.init(container);
            
            // Setup network selection
            setupNetworkSelection();
        })
        .catch(error => {
            console.error('Ошибка сканирования WiFi сетей:', error);
            container.innerHTML = createErrorState('Ошибка сканирования WiFi сетей', error.message || '');
            if (window.IconsLoader) window.IconsLoader.init(container);
        });
}

/**
 * Create HTML for network list
 * @param {Array} networks - List of WiFi networks
 * @returns {string} - HTML content
 */
function createNetworkListHtml(networks) {
    let html = '<div class="wifi-networks-list">';
    
    networks.forEach(network => {
        const ssid = network.ssid || 'Скрытая сеть';
        const signalClass = getSignalClass(network.signal_strength || network.signal || 0);
        const security = network.security || (network.encryption === 'none' ? 'Открытая' : 'Защищенная');
        const frequency = network.frequency || '';
        const channel = network.channel ? `(Канал ${network.channel})` : '';
        
        html += `
            <div class="wifi-network-item" data-ssid="${ssid}" data-security="${security}">
                <div class="wifi-network-info">
                    <div class="wifi-network-name">${ssid}</div>
                    <div class="wifi-network-details">
                        <span class="wifi-signal ${signalClass}">
                            <div class="wifi-signal-strength">
                                <span></span><span></span><span></span><span></span>
                            </div>
                            ${network.signal || network.signal_strength || 0}%
                        </span>
                        <span class="wifi-security ${security === 'Открытая' ? 'wifi-open' : 'wifi-secured'}">
                            <span data-icon="${security === 'Открытая' ? 'unlock' : 'lock'}"></span> ${security}
                        </span>
                        <span class="wifi-frequency">
                            ${frequency} ${channel}
                        </span>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-primary select-network-btn">
                    <span data-icon="check"></span> Выбрать
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Get signal class based on signal strength
 * @param {number} signalStrength - Signal strength in dBm
 * @returns {string} - CSS class for signal strength
 */
function getSignalClass(signalStrength) {
    if (signalStrength >= 70) {
        return 'wifi-signal-excellent';
    } else if (signalStrength >= 50) {
        return 'wifi-signal-good';
    } else if (signalStrength >= 30) {
        return 'wifi-signal-medium';
    } else {
        return 'wifi-signal-weak';
    }
}

/**
 * Set up network selection buttons
 */
function setupNetworkSelection() {
    const selectButtons = document.querySelectorAll('.select-network-btn');
    
    selectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const networkItem = button.closest('.wifi-network-item');
            const ssid = networkItem.getAttribute('data-ssid');
            const security = networkItem.getAttribute('data-security');
            
            selectWifiNetwork({
                ssid: ssid,
                security: security
            });
        });
    });
}

/**
 * Select a WiFi network from scan results
 * @param {object} network - WiFi network details
 */
function selectWifiNetwork(network) {
    // Hide scan results
    document.getElementById('wifi-scan-results').style.display = 'none';
    
    // Find form for the adapter we're scanning with
    const adapterForm = document.querySelector(`.wifi-adapter-form[data-adapter="${scanningAdapter}"]`);
    
    if (!adapterForm) {
        showNotification('error', 'Ошибка', 'Не удалось найти форму для выбранного адаптера');
        return;
    }
    
    // Find SSID field
    const ssidField = adapterForm.querySelector('input[name="client.ssid"]');
    if (ssidField) {
        ssidField.value = network.ssid;
    }
    
    // Set encryption based on security type
    const encryptionField = adapterForm.querySelector('select[name="client.encryption"]');
    if (encryptionField) {
        // Map security type to encryption value
        const securityMap = {
            'WPA2': 'wpa2',
            'WPA': 'wpa',
            'WEP': 'wep',
            'Open': 'none',
            'Открытая': 'none'
        };
        
        const encryption = securityMap[network.security] || 'wpa2';
        encryptionField.value = encryption;
    }
    
    // Ensure mode is set to client
    const modeSelect = adapterForm.querySelector('select[name="mode"]');
    if (modeSelect) {
        modeSelect.value = 'client';
        modeSelect.dispatchEvent(new Event('change'));
    }
    
    // Focus on password field
    const passwordField = adapterForm.querySelector('input[name="client.password"]');
    if (passwordField) {
        passwordField.focus();
    }
    
    // Show notification
    showNotification('info', 'WiFi сеть выбрана', `Выбрана сеть: ${network.ssid}`);
    
    // Make sure adapter tab is active
    const adapterTab = document.querySelector(`.wifi-adapter-tab[data-adapter="${scanningAdapter}"]`);
    if (adapterTab) {
        adapterTab.click();
    }
}

/**
 * Create error state element
 * @param {string} title - Error title
 * @param {string} [message] - Error message
 * @returns {string} - HTML for error state
 */
function createErrorState(title, message) {
    return `
        <div class="card">
            <div class="card-header">
                <h2>Настройки WiFi</h2>
            </div>
            <div class="card-content">
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <span data-icon="wifi-off" style="width: 48px; height: 48px;"></span>
                    </div>
                    <h3>${title}</h3>
                    ${message ? `<p>${message}</p>` : ''}
                    <button class="btn btn-primary" onclick="loadWifiModule()">
                        <span data-icon="refresh-cw"></span> Проверить снова
                    </button>
                </div>
            </div>
        </div>
    `;
}