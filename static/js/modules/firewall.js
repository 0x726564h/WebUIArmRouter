/**
 * Firewall Module
 * Handles firewall configuration
 */

/**
 * Load the firewall module
 */
function loadFirewallModule() {
    // Get the firewall module container
    const moduleContainer = document.getElementById('firewall-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><span data-icon="loader"></span> Загрузка...</div>';
    if (window.IconsLoader) window.IconsLoader.init();
    
    // Load firewall configuration
    api.get('/api/firewall/config')
        .then(data => {
            console.log('Получены данные брандмауэра:', data);
            // Create module content
            moduleContainer.innerHTML = createFirewallContent(data.firewall);
            
            // Set up form submission handler
            setupFirewallForm();
            
            // Initialize icons
            if (window.IconsLoader) window.IconsLoader.init();
        })
        .catch(error => {
            console.error('Error loading firewall configuration:', error);
            moduleContainer.innerHTML = createErrorState('Ошибка загрузки конфигурации брандмауэра', error.message);
            if (window.IconsLoader) window.IconsLoader.init();
        });
}

/**
 * Create firewall module content
 * @param {object} config - Firewall configuration
 * @returns {string} - HTML content
 */
function createFirewallContent(config) {
    if (!config) {
        return createErrorState('Конфигурация брандмауэра не найдена');
    }
    
    return `
        <div class="tabs">
            <div class="tabs-header">
                <div class="tab-item active" data-tab="general">Общие настройки</div>
                <div class="tab-item" data-tab="tables">Таблицы</div>
                <div class="tab-item" data-tab="chains">Цепочки</div>
                <div class="tab-item" data-tab="custom-chains">Пользовательские цепочки</div>
            </div>
            <div class="tabs-content">
                <div class="tab-pane active" id="general-tab">
                    <section class="card">
                        <div class="card-header">
                            <h2>Настройки межсетевого экрана</h2>
                            <button type="button" id="firewall-restart-btn" class="btn btn-primary">
                                <span data-icon="refresh-cw"></span> Перезапустить межсетевой экран
                            </button>
                        </div>
                        <div class="card-content">
                            <form id="firewall-form">
                                <div class="form-group">
                                    <label class="form-label">Статус межсетевого экрана</label>
                                    <div class="toggle-group">
                                        <label class="toggle-switch">
                                            <input type="checkbox" name="enabled" ${config.enabled ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <span class="toggle-label">${config.enabled ? 'Включен' : 'Отключен'}</span>
                                    </div>
                                    <div class="form-help">Внимание: Отключение межсетевого экрана может подвергнуть вашу сеть рискам безопасности</div>
                                </div>
                                
                                <div class="panel">
                                    <div class="panel-header">
                                        <h3>Политики по умолчанию</h3>
                                    </div>
                                    <div class="panel-body">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label class="form-label">Входящий трафик</label>
                                                <select name="default_policy.input" class="form-input form-select">
                                                    <option value="DROP" ${config.default_policy?.input === 'DROP' ? 'selected' : ''}>DROP (Блокировать)</option>
                                                    <option value="ACCEPT" ${config.default_policy?.input === 'ACCEPT' ? 'selected' : ''}>ACCEPT (Разрешить)</option>
                                                    <option value="REJECT" ${config.default_policy?.input === 'REJECT' ? 'selected' : ''}>REJECT (Отклонять)</option>
                                                </select>
                                                <div class="form-help">Политика по умолчанию для входящего трафика</div>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="form-label">Исходящий трафик</label>
                                                <select name="default_policy.output" class="form-input form-select">
                                                    <option value="ACCEPT" ${config.default_policy?.output === 'ACCEPT' ? 'selected' : ''}>ACCEPT (Разрешить)</option>
                                                    <option value="DROP" ${config.default_policy?.output === 'DROP' ? 'selected' : ''}>DROP (Блокировать)</option>
                                                    <option value="REJECT" ${config.default_policy?.output === 'REJECT' ? 'selected' : ''}>REJECT (Отклонять)</option>
                                                </select>
                                                <div class="form-help">Политика по умолчанию для исходящего трафика</div>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="form-label">Перенаправление трафика</label>
                                                <select name="default_policy.forward" class="form-input form-select">
                                                    <option value="DROP" ${config.default_policy?.forward === 'DROP' ? 'selected' : ''}>DROP (Блокировать)</option>
                                                    <option value="ACCEPT" ${config.default_policy?.forward === 'ACCEPT' ? 'selected' : ''}>ACCEPT (Разрешить)</option>
                                                    <option value="REJECT" ${config.default_policy?.forward === 'REJECT' ? 'selected' : ''}>REJECT (Отклонять)</option>
                                                </select>
                                                <div class="form-help">Политика по умолчанию для перенаправляемого трафика</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="panel">
                                    <div class="panel-header">
                                        <h3>Основные настройки</h3>
                                    </div>
                                    <div class="panel-body">
                                        <div class="form-group">
                                            <label class="form-label">Разрешить ping</label>
                                            <div class="toggle-group">
                                                <label class="toggle-switch">
                                                    <input type="checkbox" name="allow_ping" ${config.allow_ping ? 'checked' : ''}>
                                                    <span class="toggle-slider"></span>
                                                </label>
                                            </div>
                                            <div class="form-help">Разрешить ICMP echo запросы (ping)</div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Разрешить установленные соединения</label>
                                            <div class="toggle-group">
                                                <label class="toggle-switch">
                                                    <input type="checkbox" name="allow_established" ${config.allow_established ? 'checked' : ''}>
                                                    <span class="toggle-slider"></span>
                                                </label>
                                            </div>
                                            <div class="form-help">Разрешить трафик для установленных соединений</div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Разрешить связанные соединения</label>
                                            <div class="toggle-group">
                                                <label class="toggle-switch">
                                                    <input type="checkbox" name="allow_related" ${config.allow_related ? 'checked' : ''}>
                                                    <span class="toggle-slider"></span>
                                                </label>
                                            </div>
                                            <div class="form-help">Разрешить трафик, связанный с установленными соединениями</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="panel">
                                    <div class="panel-header">
                                        <h3>Открытые порты</h3>
                                        <button type="button" id="add-port-btn" class="btn btn-outline btn-sm">
                                            <span data-icon="plus"></span> Добавить
                                        </button>
                                    </div>
                                    <div class="panel-body">
                                        <div class="table-container">
                                            <table class="table ports-table" id="ports-table">
                                                <thead>
                                                    <tr>
                                                        <th>Порт</th>
                                                        <th>Протокол</th>
                                                        <th>Описание</th>
                                                        <th>Действия</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="ports-body">
                                                    ${createPortsTableRows(config.open_ports || [])}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                                    <button type="button" id="firewall-reset-btn" class="btn btn-outline">Сбросить</button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
                
                <div class="tab-pane" id="tables-tab">
                    <section class="card">
                        <div class="card-header">
                            <h2>Таблицы межсетевого экрана</h2>
                        </div>
                        <div class="card-content">
                            <div class="table-container">
                                <table class="table" id="tables-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 20%">Название</th>
                                            <th style="width: 50%">Описание</th>
                                            <th style="width: 15%">Статус</th>
                                            <th style="width: 15%">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${createTablesRows(config.tables || {})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
                
                <div class="tab-pane" id="chains-tab">
                    <section class="card">
                        <div class="card-header">
                            <h2>Цепочки правил</h2>
                        </div>
                        <div class="card-content">
                            <div class="table-container">
                                <table class="table" id="chains-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 15%">Название</th>
                                            <th style="width: 15%">Таблица</th>
                                            <th style="width: 35%">Описание</th>
                                            <th style="width: 15%">Политика</th>
                                            <th style="width: 10%">Статус</th>
                                            <th style="width: 10%">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${createChainsRows(config.chains || {})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
                
                <div class="tab-pane" id="custom-chains-tab">
                    <section class="card">
                        <div class="card-header">
                            <h2>Пользовательские цепочки</h2>
                            <button type="button" id="add-chain-btn" class="btn btn-outline">
                                <span data-icon="plus"></span> Добавить цепочку
                            </button>
                        </div>
                        <div class="card-content">
                            <div class="table-container">
                                <table class="table" id="custom-chains-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 20%">Название</th>
                                            <th style="width: 15%">Таблица</th>
                                            <th style="width: 40%">Описание</th>
                                            <th style="width: 10%">Статус</th>
                                            <th style="width: 15%">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${createCustomChainsRows(config.custom_chains || {})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create table rows for firewall tables
 * @param {object} tables - Firewall tables
 * @returns {string} - HTML content for table rows
 */
function createTablesRows(tables) {
    if (!tables || Object.keys(tables).length === 0) {
        return `<tr><td colspan="4" class="empty-row">Нет настроенных таблиц</td></tr>`;
    }
    
    return Object.keys(tables).map(tableName => {
        const table = tables[tableName];
        
        return `
            <tr data-table="${tableName}">
                <td><strong>${tableName}</strong></td>
                <td>${table.description || ''}</td>
                <td>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="tables.${tableName}.enabled" ${table.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">${table.enabled ? 'Включена' : 'Отключена'}</span>
                    </div>
                </td>
                <td>
                    <button type="button" class="btn btn-icon btn-sm edit-table-btn" data-table="${tableName}">
                        <span data-icon="edit-2"></span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Create table rows for firewall chains
 * @param {object} chains - Firewall chains
 * @returns {string} - HTML content for table rows
 */
function createChainsRows(chains) {
    if (!chains || Object.keys(chains).length === 0) {
        return `<tr><td colspan="6" class="empty-row">Нет настроенных цепочек</td></tr>`;
    }
    
    return Object.keys(chains).map(chainName => {
        const chain = chains[chainName];
        
        return `
            <tr data-chain="${chainName}">
                <td><strong>${chainName}</strong></td>
                <td>${chain.table || 'filter'}</td>
                <td>${chain.description || ''}</td>
                <td>
                    <span class="policy-badge" data-policy="${chain.policy || 'ACCEPT'}">
                        ${chain.policy || 'ACCEPT'}
                    </span>
                </td>
                <td>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="chains.${chainName}.enabled" ${chain.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </td>
                <td>
                    <button type="button" class="btn btn-icon btn-sm edit-chain-btn" data-chain="${chainName}">
                        <span data-icon="edit-2"></span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Create table rows for custom chains
 * @param {object} customChains - Custom firewall chains
 * @returns {string} - HTML content for table rows
 */
function createCustomChainsRows(customChains) {
    if (!customChains || Object.keys(customChains).length === 0) {
        return `<tr><td colspan="5" class="empty-row">Нет пользовательских цепочек</td></tr>`;
    }
    
    return Object.keys(customChains).map(chainName => {
        const chain = customChains[chainName];
        
        return `
            <tr data-custom-chain="${chainName}">
                <td><strong>${chainName}</strong></td>
                <td>${chain.table || 'filter'}</td>
                <td>${chain.description || ''}</td>
                <td>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="custom_chains.${chainName}.enabled" ${chain.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </td>
                <td>
                    <div class="btn-group">
                        <button type="button" class="btn btn-icon btn-sm edit-custom-chain-btn" data-chain="${chainName}">
                            <span data-icon="edit-2"></span>
                        </button>
                        <button type="button" class="btn btn-icon btn-sm btn-danger delete-custom-chain-btn" data-chain="${chainName}">
                            <span data-icon="trash-2"></span>
                        </button>
                        <button type="button" class="btn btn-icon btn-sm view-rules-btn" data-chain="${chainName}">
                            <span data-icon="list"></span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Create table rows for open ports
 * @param {Array} ports - Array of open port objects
 * @returns {string} - HTML content for table rows
 */
function createPortsTableRows(ports) {
    if (!ports || ports.length === 0) {
        return `<tr><td colspan="4" class="empty-row">Нет настроенных открытых портов</td></tr>`;
    }
    
    // Преобразование в массив если был передан объект
    if (!Array.isArray(ports)) {
        console.log("Порты не являются массивом, преобразуем:", ports);
        // Если это объект, пробуем преобразовать его в массив
        if (typeof ports === 'object') {
            const portsArray = [];
            for (const key in ports) {
                if (ports.hasOwnProperty(key)) {
                    portsArray.push(ports[key]);
                }
            }
            ports = portsArray;
        } else {
            // Если не массив и не объект, возвращаем пустую строку
            return `<tr><td colspan="4" class="empty-row">Некорректная структура данных портов</td></tr>`;
        }
    }
    
    console.log("Преобразованные порты:", ports);
    
    return ports.map((port, index) => `
        <tr data-index="${index}">
            <td>
                <input type="number" name="open_ports[${index}].port" class="form-input" value="${port.port}" min="1" max="65535">
            </td>
            <td>
                <select name="open_ports[${index}].protocol" class="form-input form-select">
                    <option value="tcp" ${port.protocol === 'tcp' ? 'selected' : ''}>TCP</option>
                    <option value="udp" ${port.protocol === 'udp' ? 'selected' : ''}>UDP</option>
                    <option value="both" ${port.protocol === 'both' ? 'selected' : ''}>TCP & UDP</option>
                </select>
            </td>
            <td>
                <input type="text" name="open_ports[${index}].description" class="form-input" value="${port.description || ''}">
            </td>
            <td>
                <button type="button" class="btn btn-icon btn-danger delete-port-btn" data-index="${index}">
                    <span data-icon="trash-2"></span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Set up firewall form handlers
 */
function setupFirewallForm() {
    // Firewall enabled toggle
    const enabledToggle = document.querySelector('input[name="enabled"]');
    if (enabledToggle) {
        enabledToggle.addEventListener('change', () => {
            const toggleLabel = document.querySelector('.toggle-label');
            toggleLabel.textContent = enabledToggle.checked ? 'Включен' : 'Отключен';
        });
    }
    
    // Add port button
    const addPortBtn = document.getElementById('add-port-btn');
    if (addPortBtn) {
        addPortBtn.addEventListener('click', addPortRow);
    }
    
    // Delete port buttons
    setupDeletePortButtons();
    
    // Firewall restart button
    const restartBtn = document.getElementById('firewall-restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartFirewall);
    }
    
    // Form submit handler
    const form = document.getElementById('firewall-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            saveFirewallConfig(form);
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('firewall-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            loadFirewallModule();
        });
    }
    
    // Setup tabs
    setupTabs();
    
    // Add chain button
    const addChainBtn = document.getElementById('add-chain-btn');
    if (addChainBtn) {
        addChainBtn.addEventListener('click', () => {
            showAddChainDialog();
        });
    }
    
    // Setup table actions
    setupTableActions();
    
    // Setup chain actions
    setupChainActions();
    
    // Setup custom chain actions
    setupCustomChainActions();
}

/**
 * Setup tabs functionality
 */
function setupTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            item.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Show the corresponding tab pane
            const tabId = item.getAttribute('data-tab');
            const pane = document.getElementById(`${tabId}-tab`);
            if (pane) {
                pane.classList.add('active');
            }
        });
    });
}

/**
 * Setup table actions
 */
function setupTableActions() {
    const editButtons = document.querySelectorAll('.edit-table-btn');
    
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tableName = button.getAttribute('data-table');
            
            if (tableName) {
                showEditTableDialog(tableName);
            }
        });
    });
    
    // Setup toggle switches
    const toggles = document.querySelectorAll('input[name^="tables."]');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const label = toggle.closest('.toggle-group').querySelector('.toggle-label');
            if (label) {
                label.textContent = toggle.checked ? 'Включена' : 'Отключена';
            }
        });
    });
}

/**
 * Setup chain actions
 */
function setupChainActions() {
    const editButtons = document.querySelectorAll('.edit-chain-btn');
    
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chainName = button.getAttribute('data-chain');
            
            if (chainName) {
                showEditChainDialog(chainName);
            }
        });
    });
}

/**
 * Setup custom chain actions
 */
function setupCustomChainActions() {
    const editButtons = document.querySelectorAll('.edit-custom-chain-btn');
    const deleteButtons = document.querySelectorAll('.delete-custom-chain-btn');
    const viewRulesButtons = document.querySelectorAll('.view-rules-btn');
    
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chainName = button.getAttribute('data-chain');
            
            if (chainName) {
                showEditCustomChainDialog(chainName);
            }
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chainName = button.getAttribute('data-chain');
            
            if (chainName && confirm(`Вы уверены, что хотите удалить цепочку '${chainName}'?`)) {
                deleteCustomChain(chainName);
            }
        });
    });
    
    viewRulesButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chainName = button.getAttribute('data-chain');
            
            if (chainName) {
                showChainRules(chainName);
            }
        });
    });
}

/**
 * Show dialog to edit a table
 * @param {string} tableName - Name of the table to edit
 */
function showEditTableDialog(tableName) {
    // Get table data from the form
    const tableEnabled = document.querySelector(`input[name="tables.${tableName}.enabled"]`).checked;
    const tableDescription = document.querySelectorAll(`tr[data-table="${tableName}"] td`)[1].textContent;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактирование таблицы "${tableName}"</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="edit-table-form">
                        <div class="form-group">
                            <label class="form-label">Название</label>
                            <input type="text" name="name" class="form-input" value="${tableName}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Описание</label>
                            <input type="text" name="description" class="form-input" value="${tableDescription}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Статус</label>
                            <div class="toggle-group">
                                <label class="toggle-switch">
                                    <input type="checkbox" name="enabled" ${tableEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label">${tableEnabled ? 'Включена' : 'Отключена'}</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="edit-table-form" class="btn btn-primary">Сохранить</button>
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
    
    // Handle toggle change
    const toggle = modal.querySelector('input[name="enabled"]');
    const toggleLabel = modal.querySelector('.toggle-label');
    
    toggle.addEventListener('change', () => {
        toggleLabel.textContent = toggle.checked ? 'Включена' : 'Отключена';
    });
    
    // Close button handler
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modal);
        });
    });
    
    // Form submit handler
    const form = modal.querySelector('#edit-table-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get form data
        const description = form.elements['description'].value;
        const enabled = form.elements['enabled'].checked;
        
        // Update table data in the UI
        const tableRow = document.querySelector(`tr[data-table="${tableName}"]`);
        if (tableRow) {
            tableRow.querySelectorAll('td')[1].textContent = description;
            const tableToggle = document.querySelector(`input[name="tables.${tableName}.enabled"]`);
            if (tableToggle) {
                tableToggle.checked = enabled;
                tableToggle.dispatchEvent(new Event('change'));
            }
        }
        
        // TODO: Save table configuration to the server
        // This would be implemented in a real application
        
        // Close modal
        closeModal(modal);
        
        // Show notification
        showNotification('success', 'Таблица обновлена', `Настройки таблицы "${tableName}" обновлены`);
    });
}

/**
 * Show dialog to edit a chain
 * @param {string} chainName - Name of the chain to edit
 */
function showEditChainDialog(chainName) {
    // Get chain data from the form
    const row = document.querySelector(`tr[data-chain="${chainName}"]`);
    const chainTable = row.querySelectorAll('td')[1].textContent;
    const chainDescription = row.querySelectorAll('td')[2].textContent;
    const chainPolicy = row.querySelector('.policy-badge').getAttribute('data-policy');
    const chainEnabled = document.querySelector(`input[name="chains.${chainName}.enabled"]`).checked;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактирование цепочки "${chainName}"</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="edit-chain-form">
                        <div class="form-group">
                            <label class="form-label">Название</label>
                            <input type="text" name="name" class="form-input" value="${chainName}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Таблица</label>
                            <input type="text" name="table" class="form-input" value="${chainTable}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Описание</label>
                            <input type="text" name="description" class="form-input" value="${chainDescription}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Политика по умолчанию</label>
                            <select name="policy" class="form-input form-select">
                                <option value="ACCEPT" ${chainPolicy === 'ACCEPT' ? 'selected' : ''}>ACCEPT (Разрешить)</option>
                                <option value="DROP" ${chainPolicy === 'DROP' ? 'selected' : ''}>DROP (Блокировать)</option>
                                <option value="REJECT" ${chainPolicy === 'REJECT' ? 'selected' : ''}>REJECT (Отклонять)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Статус</label>
                            <div class="toggle-group">
                                <label class="toggle-switch">
                                    <input type="checkbox" name="enabled" ${chainEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label">${chainEnabled ? 'Включена' : 'Отключена'}</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="edit-chain-form" class="btn btn-primary">Сохранить</button>
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
    
    // Handle toggle change
    const toggle = modal.querySelector('input[name="enabled"]');
    const toggleLabel = modal.querySelector('.toggle-label');
    
    toggle.addEventListener('change', () => {
        toggleLabel.textContent = toggle.checked ? 'Включена' : 'Отключена';
    });
    
    // Close button handler
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modal);
        });
    });
    
    // Form submit handler
    const form = modal.querySelector('#edit-chain-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get form data
        const description = form.elements['description'].value;
        const policy = form.elements['policy'].value;
        const enabled = form.elements['enabled'].checked;
        
        // Update chain data in the UI
        const chainRow = document.querySelector(`tr[data-chain="${chainName}"]`);
        if (chainRow) {
            // Update description
            chainRow.querySelectorAll('td')[2].textContent = description;
            
            // Update policy badge
            const policyBadge = chainRow.querySelector('.policy-badge');
            policyBadge.setAttribute('data-policy', policy);
            policyBadge.textContent = policy;
            
            // Update enabled state
            const chainToggle = document.querySelector(`input[name="chains.${chainName}.enabled"]`);
            if (chainToggle) {
                chainToggle.checked = enabled;
            }
        }
        
        // TODO: Save chain configuration to the server
        // This would be implemented in a real application
        
        // Close modal
        closeModal(modal);
        
        // Show notification
        showNotification('success', 'Цепочка обновлена', `Настройки цепочки "${chainName}" обновлены`);
    });
}

/**
 * Show dialog to add a new custom chain
 */
function showAddChainDialog() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить пользовательскую цепочку</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="add-chain-form">
                        <div class="form-group">
                            <label class="form-label">Название</label>
                            <input type="text" name="name" class="form-input" placeholder="my_chain" required>
                            <div class="form-help">Используйте только латинские буквы, цифры и подчеркивания</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Таблица</label>
                            <select name="table" class="form-input form-select">
                                <option value="filter">filter</option>
                                <option value="nat">nat</option>
                                <option value="mangle">mangle</option>
                                <option value="raw">raw</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Описание</label>
                            <input type="text" name="description" class="form-input" placeholder="Опишите назначение цепочки">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="add-chain-form" class="btn btn-primary">Добавить</button>
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
    const form = modal.querySelector('#add-chain-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get form data
        const chainName = form.elements['name'].value;
        const table = form.elements['table'].value;
        const description = form.elements['description'].value;
        
        if (!chainName) {
            alert('Введите название цепочки');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(chainName)) {
            alert('Название цепочки может содержать только латинские буквы, цифры и подчеркивания');
            return;
        }
        
        // Check if chain already exists
        const existingChain = document.querySelector(`tr[data-custom-chain="${chainName}"]`);
        if (existingChain) {
            alert(`Цепочка с названием "${chainName}" уже существует`);
            return;
        }
        
        // Add new chain to the table
        const tbody = document.querySelector('#custom-chains-table tbody');
        const emptyRow = tbody.querySelector('.empty-row');
        
        if (emptyRow) {
            tbody.innerHTML = '';
        }
        
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-custom-chain', chainName);
        
        newRow.innerHTML = `
            <td><strong>${chainName}</strong></td>
            <td>${table}</td>
            <td>${description}</td>
            <td>
                <div class="toggle-group">
                    <label class="toggle-switch">
                        <input type="checkbox" name="custom_chains.${chainName}.enabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button type="button" class="btn btn-icon btn-sm edit-custom-chain-btn" data-chain="${chainName}">
                        <span data-icon="edit-2"></span>
                    </button>
                    <button type="button" class="btn btn-icon btn-sm btn-danger delete-custom-chain-btn" data-chain="${chainName}">
                        <span data-icon="trash-2"></span>
                    </button>
                    <button type="button" class="btn btn-icon btn-sm view-rules-btn" data-chain="${chainName}">
                        <span data-icon="list"></span>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(newRow);
        
        // Initialize icons
        if (window.IconsLoader) window.IconsLoader.init(newRow);
        
        // Setup new chain actions
        setupCustomChainActions();
        
        // TODO: Save chain configuration to the server
        // This would be implemented in a real application
        
        // Close modal
        closeModal(modal);
        
        // Show notification
        showNotification('success', 'Цепочка добавлена', `Пользовательская цепочка "${chainName}" добавлена`);
    });
}

/**
 * Show dialog to edit a custom chain
 * @param {string} chainName - Name of the custom chain to edit
 */
function showEditCustomChainDialog(chainName) {
    // Get chain data from the UI
    const row = document.querySelector(`tr[data-custom-chain="${chainName}"]`);
    const chainTable = row.querySelectorAll('td')[1].textContent;
    const chainDescription = row.querySelectorAll('td')[2].textContent;
    const chainEnabled = document.querySelector(`input[name="custom_chains.${chainName}.enabled"]`).checked;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактирование цепочки "${chainName}"</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="edit-custom-chain-form">
                        <div class="form-group">
                            <label class="form-label">Название</label>
                            <input type="text" name="name" class="form-input" value="${chainName}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Таблица</label>
                            <select name="table" class="form-input form-select">
                                <option value="filter" ${chainTable === 'filter' ? 'selected' : ''}>filter</option>
                                <option value="nat" ${chainTable === 'nat' ? 'selected' : ''}>nat</option>
                                <option value="mangle" ${chainTable === 'mangle' ? 'selected' : ''}>mangle</option>
                                <option value="raw" ${chainTable === 'raw' ? 'selected' : ''}>raw</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Описание</label>
                            <input type="text" name="description" class="form-input" value="${chainDescription}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Статус</label>
                            <div class="toggle-group">
                                <label class="toggle-switch">
                                    <input type="checkbox" name="enabled" ${chainEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label">${chainEnabled ? 'Включена' : 'Отключена'}</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="edit-custom-chain-form" class="btn btn-primary">Сохранить</button>
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
    
    // Handle toggle change
    const toggle = modal.querySelector('input[name="enabled"]');
    const toggleLabel = modal.querySelector('.toggle-label');
    
    toggle.addEventListener('change', () => {
        toggleLabel.textContent = toggle.checked ? 'Включена' : 'Отключена';
    });
    
    // Close button handler
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modal);
        });
    });
    
    // Form submit handler
    const form = modal.querySelector('#edit-custom-chain-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get form data
        const table = form.elements['table'].value;
        const description = form.elements['description'].value;
        const enabled = form.elements['enabled'].checked;
        
        // Update custom chain data in the UI
        const chainRow = document.querySelector(`tr[data-custom-chain="${chainName}"]`);
        if (chainRow) {
            // Update table and description
            chainRow.querySelectorAll('td')[1].textContent = table;
            chainRow.querySelectorAll('td')[2].textContent = description;
            
            // Update enabled state
            const chainToggle = document.querySelector(`input[name="custom_chains.${chainName}.enabled"]`);
            if (chainToggle) {
                chainToggle.checked = enabled;
            }
        }
        
        // TODO: Save chain configuration to the server
        // This would be implemented in a real application
        
        // Close modal
        closeModal(modal);
        
        // Show notification
        showNotification('success', 'Цепочка обновлена', `Настройки цепочки "${chainName}" обновлены`);
    });
}

/**
 * Delete a custom chain
 * @param {string} chainName - Name of the custom chain to delete
 */
function deleteCustomChain(chainName) {
    // Remove chain from the UI
    const chainRow = document.querySelector(`tr[data-custom-chain="${chainName}"]`);
    if (chainRow) {
        chainRow.remove();
        
        // Check if there are any chains left
        const customChains = document.querySelectorAll('tr[data-custom-chain]');
        if (customChains.length === 0) {
            // Add empty row
            const tbody = document.querySelector('#custom-chains-table tbody');
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Нет пользовательских цепочек</td></tr>`;
        }
    }
    
    // TODO: Delete chain from the server
    // This would be implemented in a real application
    
    // Show notification
    showNotification('success', 'Цепочка удалена', `Пользовательская цепочка "${chainName}" удалена`);
}

/**
 * Show rules for a specific chain
 * @param {string} chainName - Name of the chain to show rules for
 */
function showChainRules(chainName) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal modal-large';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Правила цепочки "${chainName}"</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="table-container">
                        <table class="table" id="chain-rules-table">
                            <thead>
                                <tr>
                                    <th style="width: 5%">№</th>
                                    <th style="width: 15%">Действие</th>
                                    <th style="width: 45%">Условие</th>
                                    <th style="width: 20%">Протокол</th>
                                    <th style="width: 15%">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="5" class="empty-row">Нет правил в цепочке</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" id="add-rule-btn">
                        <span data-icon="plus"></span> Добавить правило
                    </button>
                    <button type="button" class="btn btn-primary modal-close">Закрыть</button>
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
    
    // Add rule button handler
    const addRuleBtn = modal.querySelector('#add-rule-btn');
    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', () => {
            showAddRuleDialog(chainName);
        });
    }
    
    // TODO: Fetch rules from the server
    // This would be implemented in a real application
}

/**
 * Show dialog to add a new rule to a chain
 * @param {string} chainName - Name of the chain to add a rule to
 */
function showAddRuleDialog(chainName) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить правило в цепочку "${chainName}"</h3>
                    <button type="button" class="modal-close">
                        <span data-icon="x"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="add-rule-form">
                        <div class="form-group">
                            <label class="form-label">Действие</label>
                            <select name="action" class="form-input form-select">
                                <option value="ACCEPT">ACCEPT (Разрешить)</option>
                                <option value="DROP">DROP (Блокировать)</option>
                                <option value="REJECT">REJECT (Отклонить)</option>
                                <option value="LOG">LOG (Логировать)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Протокол</label>
                            <select name="protocol" class="form-input form-select">
                                <option value="all">Все</option>
                                <option value="tcp">TCP</option>
                                <option value="udp">UDP</option>
                                <option value="icmp">ICMP</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Исходный адрес</label>
                            <input type="text" name="source" class="form-input" placeholder="0.0.0.0/0">
                            <div class="form-help">Формат: IP или CIDR (например, 192.168.1.0/24)</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Целевой адрес</label>
                            <input type="text" name="destination" class="form-input" placeholder="0.0.0.0/0">
                            <div class="form-help">Формат: IP или CIDR (например, 192.168.1.0/24)</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Порт назначения</label>
                            <input type="text" name="destination_port" class="form-input" placeholder="22,80,443">
                            <div class="form-help">Укажите порт или список портов через запятую</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Комментарий</label>
                            <input type="text" name="comment" class="form-input" placeholder="Описание правила">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline modal-close">Отмена</button>
                    <button type="submit" form="add-rule-form" class="btn btn-primary">Добавить</button>
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
    const form = modal.querySelector('#add-rule-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        
        // Get form data
        const action = form.elements['action'].value;
        const protocol = form.elements['protocol'].value;
        const source = form.elements['source'].value;
        const destination = form.elements['destination'].value;
        const destinationPort = form.elements['destination_port'].value;
        const comment = form.elements['comment'].value;
        
        // TODO: Save rule to the server
        // This would be implemented in a real application
        
        // Close modal
        closeModal(modal);
        
        // Show notification
        showNotification('success', 'Правило добавлено', `Правило добавлено в цепочку "${chainName}"`);
    });
}

/**
 * Set up delete port buttons
 */
function setupDeletePortButtons() {
    const deleteButtons = document.querySelectorAll('.delete-port-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                row.remove();
                
                // If no ports left, add empty row
                const portRows = document.querySelectorAll('#ports-body tr');
                if (portRows.length === 0) {
                    document.getElementById('ports-body').innerHTML = 
                        `<tr><td colspan="4" class="empty-row">Нет настроенных открытых портов</td></tr>`;
                }
                
                // Reindex rows
                reindexPortRows();
            }
        });
    });
}

/**
 * Add new port row
 */
function addPortRow() {
    // Remove empty row if present
    const emptyRow = document.querySelector('#ports-body .empty-row');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }
    
    // Get current row count
    const rows = document.querySelectorAll('#ports-body tr');
    const newIndex = rows.length;
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-index', newIndex);
    
    newRow.innerHTML = `
        <td>
            <input type="number" name="open_ports[${newIndex}].port" class="form-input" value="22" min="1" max="65535">
        </td>
        <td>
            <select name="open_ports[${newIndex}].protocol" class="form-input form-select">
                <option value="tcp" selected>TCP</option>
                <option value="udp">UDP</option>
                <option value="both">TCP & UDP</option>
            </select>
        </td>
        <td>
            <input type="text" name="open_ports[${newIndex}].description" class="form-input" value="">
        </td>
        <td>
            <button type="button" class="btn btn-icon btn-danger delete-port-btn" data-index="${newIndex}">
                <span data-icon="trash-2"></span>
            </button>
        </td>
    `;
    
    // Add to table
    document.getElementById('ports-body').appendChild(newRow);
    
    // Initialize icons
    if (window.IconsLoader) window.IconsLoader.init(newRow);
    
    // Set up delete button
    setupDeletePortButtons();
    
    // Focus on port input
    newRow.querySelector('input[type="number"]').focus();
}

/**
 * Reindex port rows after deletion
 */
function reindexPortRows() {
    const rows = document.querySelectorAll('#ports-body tr');
    
    rows.forEach((row, index) => {
        // Skip empty row
        if (row.querySelector('.empty-row')) return;
        
        // Update row index
        row.setAttribute('data-index', index);
        
        // Update input names
        const portInput = row.querySelector('input[type="number"]');
        const protocolSelect = row.querySelector('select');
        const descriptionInput = row.querySelector('input[type="text"]');
        const deleteButton = row.querySelector('.delete-port-btn');
        
        if (portInput) portInput.name = `open_ports[${index}].port`;
        if (protocolSelect) protocolSelect.name = `open_ports[${index}].protocol`;
        if (descriptionInput) descriptionInput.name = `open_ports[${index}].description`;
        if (deleteButton) deleteButton.setAttribute('data-index', index);
    });
}

/**
 * Save firewall configuration
 * @param {HTMLFormElement} form - Firewall configuration form
 */
function saveFirewallConfig(form) {
    // Create config object from form
    const config = {
        enabled: form.elements['enabled'].checked,
        default_policy: {
            input: form.elements['default_policy.input'].value,
            output: form.elements['default_policy.output'].value,
            forward: form.elements['default_policy.forward'].value
        },
        allow_ping: form.elements['allow_ping'].checked,
        allow_established: form.elements['allow_established'].checked,
        allow_related: form.elements['allow_related'].checked,
        open_ports: []
    };
    
    // Get open ports
    const portRows = document.querySelectorAll('#ports-body tr');
    const emptyRow = document.querySelector('#ports-body .empty-row');
    
    if (portRows.length > 0 && !emptyRow) {
        portRows.forEach(row => {
            const index = row.getAttribute('data-index');
            
            const port = parseInt(form.elements[`open_ports[${index}].port`].value, 10);
            const protocol = form.elements[`open_ports[${index}].protocol`].value;
            const description = form.elements[`open_ports[${index}].description`].value;
            
            if (!isNaN(port) && port > 0 && port <= 65535) {
                config.open_ports.push({
                    port: port,
                    protocol: protocol,
                    description: description
                });
            }
        });
    }
    
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
    api.put('/api/firewall/config', config)
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            if (window.IconsLoader) window.IconsLoader.init(submitBtn);
            
            // Show success message
            showNotification('success', 'Настройки межсетевого экрана', 'Конфигурация успешно сохранена');
        })
        .catch(error => {
            console.error('Error saving firewall configuration:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            if (window.IconsLoader) window.IconsLoader.init(submitBtn);
            
            // Show error message
            showNotification('error', 'Ошибка настроек межсетевого экрана', error.message || 'Не удалось сохранить конфигурацию');
        });
}

/**
 * Restart firewall service
 */
function restartFirewall() {
    // Confirm restart
    if (!confirm('Вы уверены, что хотите перезапустить межсетевой экран? Это может временно прервать сетевые соединения.')) {
        return;
    }
    
    // Show loading notification
    showNotification('info', 'Перезапуск межсетевого экрана', 'Перезапуск службы...');
    
    // Call API to restart firewall
    api.post('/api/firewall/restart')
        .then(response => {
            if (response.success) {
                showNotification('success', 'Перезапуск межсетевого экрана', 'Служба успешно перезапущена');
            } else {
                showNotification('error', 'Ошибка перезапуска', response.message || 'Не удалось перезапустить службу');
            }
        })
        .catch(error => {
            console.error('Error restarting firewall:', error);
            showNotification('error', 'Ошибка перезапуска', error.message || 'Не удалось перезапустить службу');
        });
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
            <span data-icon="alert-circle"></span>
            <h3>${title}</h3>
            ${message ? `<p>${message}</p>` : ''}
            <button type="button" class="btn btn-primary" onclick="loadFirewallModule()">
                <span data-icon="refresh-cw"></span> Попробовать снова
            </button>
        </div>
    `;
}