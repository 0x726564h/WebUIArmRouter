/**
 * Tunnel Module
 * Handles VPN, Tor, and other tunneling options
 */

/**
 * Load the tunnel module
 */
function loadTunnelModule() {
    // Get the tunnel module container
    const moduleContainer = document.getElementById('tunnel-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><i data-feather="loader"></i></div>';
    feather.replace();
    
    // Load tunnel configuration
    api.get('/tunnel/config')
        .then(data => {
            // Create module content
            moduleContainer.innerHTML = createTunnelContent(data.tunnel);
            
            // Set up form submission handler
            setupTunnelForm();
            
            // Initialize feather icons
            feather.replace();
        })
        .catch(error => {
            console.error('Error loading tunnel configuration:', error);
            moduleContainer.innerHTML = createErrorState('Failed to load tunnel configuration', error.message);
            feather.replace();
        });
}

/**
 * Create tunnel module content
 * @param {object} config - Tunnel configuration
 * @returns {string} - HTML content
 */
function createTunnelContent(config) {
    if (!config) {
        return createErrorState('No tunnel configuration found');
    }
    
    return `
        <section class="card">
            <div class="card-header">
                <h2>Tunnel Manager</h2>
                <button type="button" id="tunnel-restart-btn" class="btn btn-primary">
                    <i data-feather="refresh-cw"></i> Restart Tunnel
                </button>
            </div>
            <div class="card-content">
                <form id="tunnel-form">
                    <div class="form-group">
                        <label class="form-label">Tunnel Status</label>
                        <div class="toggle-group">
                            <label class="toggle-switch">
                                <input type="checkbox" name="enabled" ${config.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="toggle-label">${config.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Tunnel Type</label>
                        <select name="type" class="form-input form-select" id="tunnel-type-select">
                            <option value="none" ${config.type === 'none' ? 'selected' : ''}>None</option>
                            <option value="tor" ${config.type === 'tor' ? 'selected' : ''}>Tor</option>
                            <option value="vpn" ${config.type === 'vpn' ? 'selected' : ''}>VPN</option>
                            <option value="v2ray" ${config.type === 'v2ray' ? 'selected' : ''}>V2Ray</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Traffic Routing Mode</label>
                        <select name="mode" class="form-input form-select">
                            <option value="all" ${config.mode === 'all' ? 'selected' : ''}>All Traffic</option>
                            <option value="geo" ${config.mode === 'geo' ? 'selected' : ''}>Geo-Based</option>
                            <option value="ip" ${config.mode === 'ip' ? 'selected' : ''}>IP-Based</option>
                            <option value="domain" ${config.mode === 'domain' ? 'selected' : ''}>Domain-Based</option>
                        </select>
                        <div class="form-help">Determines which traffic is routed through the tunnel</div>
                    </div>
                    
                    <!-- Tor Settings -->
                    <div id="tor-settings" class="tunnel-settings" style="${config.type === 'tor' ? '' : 'display: none;'}">
                        <div class="panel">
                            <div class="panel-header">
                                <h3>Tor Settings</h3>
                            </div>
                            <div class="panel-body">
                                <div class="form-group">
                                    <label class="form-label">Transparent Proxy</label>
                                    <div class="toggle-group">
                                        <label class="toggle-switch">
                                            <input type="checkbox" name="tor.transparent" ${config.tor?.transparent ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div class="form-help">Route all traffic through Tor automatically</div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Hidden Services</label>
                                    <div class="table-container">
                                        <table class="table" id="tor-services-table">
                                            <thead>
                                                <tr>
                                                    <th>Virtual Port</th>
                                                    <th>Target IP</th>
                                                    <th>Target Port</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tor-services-body">
                                                ${createTorServicesTableRows(config.tor?.hidden_services || [])}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" id="add-tor-service-btn" class="btn btn-outline btn-sm">
                                        <i data-feather="plus"></i> Add Hidden Service
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- VPN Settings -->
                    <div id="vpn-settings" class="tunnel-settings" style="${config.type === 'vpn' ? '' : 'display: none;'}">
                        <div class="panel">
                            <div class="panel-header">
                                <h3>VPN Settings</h3>
                            </div>
                            <div class="panel-body">
                                <div class="form-group">
                                    <label class="form-label">VPN Provider</label>
                                    <select name="vpn.provider" class="form-input form-select">
                                        <option value="openvpn" ${config.vpn?.provider === 'openvpn' ? 'selected' : ''}>OpenVPN</option>
                                        <option value="wireguard" ${config.vpn?.provider === 'wireguard' ? 'selected' : ''}>WireGuard</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Config File</label>
                                    <input type="text" name="vpn.config_file" class="form-input" value="${config.vpn?.config_file || ''}">
                                    <div class="form-help">Path to VPN configuration file</div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Auth Username</label>
                                    <input type="text" name="vpn.auth.username" class="form-input" value="${config.vpn?.auth?.username || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Auth Password</label>
                                    <input type="password" name="vpn.auth.password" class="form-input" value="${config.vpn?.auth?.password || ''}">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- V2Ray Settings -->
                    <div id="v2ray-settings" class="tunnel-settings" style="${config.type === 'v2ray' ? '' : 'display: none;'}">
                        <div class="panel">
                            <div class="panel-header">
                                <h3>V2Ray Settings</h3>
                            </div>
                            <div class="panel-body">
                                <div class="form-group">
                                    <label class="form-label">Config File</label>
                                    <input type="text" name="v2ray.config_file" class="form-input" value="${config.v2ray?.config_file || ''}">
                                    <div class="form-help">Path to V2Ray configuration file</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" id="tunnel-reset-btn" class="btn btn-outline">Reset</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

/**
 * Create table rows for Tor hidden services
 * @param {Array} services - Array of Tor hidden service objects
 * @returns {string} - HTML content for table rows
 */
function createTorServicesTableRows(services) {
    if (!services || services.length === 0) {
        return `<tr><td colspan="4" class="empty-row">No hidden services configured</td></tr>`;
    }
    
    return services.map((service, index) => `
        <tr data-index="${index}">
            <td>
                <input type="number" name="tor.hidden_services[${index}].virtual_port" class="form-input" value="${service.virtual_port || 80}" min="1" max="65535">
            </td>
            <td>
                <input type="text" name="tor.hidden_services[${index}].target_ip" class="form-input" value="${service.target_ip || '127.0.0.1'}">
            </td>
            <td>
                <input type="number" name="tor.hidden_services[${index}].target_port" class="form-input" value="${service.target_port || 80}" min="1" max="65535">
            </td>
            <td>
                <button type="button" class="btn btn-icon btn-danger delete-tor-service-btn" data-index="${index}">
                    <i data-feather="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Set up tunnel form handlers
 */
function setupTunnelForm() {
    // Tunnel enabled toggle
    const enabledToggle = document.querySelector('input[name="enabled"]');
    if (enabledToggle) {
        enabledToggle.addEventListener('change', () => {
            const toggleLabel = document.querySelector('.toggle-label');
            toggleLabel.textContent = enabledToggle.checked ? 'Enabled' : 'Disabled';
        });
    }
    
    // Tunnel type selector
    const typeSelect = document.getElementById('tunnel-type-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            // Hide all settings
            document.querySelectorAll('.tunnel-settings').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show selected settings
            const selectedType = typeSelect.value;
            if (selectedType !== 'none') {
                document.getElementById(`${selectedType}-settings`).style.display = '';
            }
        });
    }
    
    // Add Tor service button
    const addTorServiceBtn = document.getElementById('add-tor-service-btn');
    if (addTorServiceBtn) {
        addTorServiceBtn.addEventListener('click', addTorServiceRow);
    }
    
    // Delete Tor service buttons
    setupDeleteTorServiceButtons();
    
    // Tunnel restart button
    const restartBtn = document.getElementById('tunnel-restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartTunnel);
    }
    
    // Form submit handler
    const form = document.getElementById('tunnel-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            saveTunnelConfig(form);
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('tunnel-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            loadTunnelModule();
        });
    }
}

/**
 * Set up delete Tor service buttons
 */
function setupDeleteTorServiceButtons() {
    const deleteButtons = document.querySelectorAll('.delete-tor-service-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            const row = document.querySelector(`#tor-services-body tr[data-index="${index}"]`);
            if (row) {
                row.remove();
                
                // If no services left, add empty row
                const serviceRows = document.querySelectorAll('#tor-services-body tr');
                if (serviceRows.length === 0) {
                    document.getElementById('tor-services-body').innerHTML = 
                        `<tr><td colspan="4" class="empty-row">No hidden services configured</td></tr>`;
                }
                
                // Reindex rows
                reindexTorServiceRows();
            }
        });
    });
}

/**
 * Add new Tor service row
 */
function addTorServiceRow() {
    // Remove empty row if present
    const emptyRow = document.querySelector('#tor-services-body .empty-row');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }
    
    // Get current row count
    const rows = document.querySelectorAll('#tor-services-body tr');
    const newIndex = rows.length;
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-index', newIndex);
    
    newRow.innerHTML = `
        <td>
            <input type="number" name="tor.hidden_services[${newIndex}].virtual_port" class="form-input" value="80" min="1" max="65535">
        </td>
        <td>
            <input type="text" name="tor.hidden_services[${newIndex}].target_ip" class="form-input" value="127.0.0.1">
        </td>
        <td>
            <input type="number" name="tor.hidden_services[${newIndex}].target_port" class="form-input" value="80" min="1" max="65535">
        </td>
        <td>
            <button type="button" class="btn btn-icon btn-danger delete-tor-service-btn" data-index="${newIndex}">
                <i data-feather="trash-2"></i>
            </button>
        </td>
    `;
    
    // Add to table
    document.getElementById('tor-services-body').appendChild(newRow);
    
    // Initialize feather icons
    feather.replace();
    
    // Set up delete button
    setupDeleteTorServiceButtons();
    
    // Focus on first input
    newRow.querySelector('input').focus();
}

/**
 * Reindex Tor service rows after deletion
 */
function reindexTorServiceRows() {
    const rows = document.querySelectorAll('#tor-services-body tr');
    
    rows.forEach((row, index) => {
        row.setAttribute('data-index', index);
        
        // Update input names
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            const name = input.getAttribute('name');
            if (name) {
                const newName = name.replace(/tor\.hidden_services\[\d+\]/, `tor.hidden_services[${index}]`);
                input.setAttribute('name', newName);
            }
        });
        
        // Update delete button index
        const deleteBtn = row.querySelector('.delete-tor-service-btn');
        if (deleteBtn) {
            deleteBtn.setAttribute('data-index', index);
        }
    });
}

/**
 * Save tunnel configuration
 * @param {HTMLFormElement} form - Tunnel configuration form
 */
function saveTunnelConfig(form) {
    // Create config object from form
    const config = {
        enabled: form.elements['enabled'].checked,
        type: form.elements['type'].value,
        mode: form.elements['mode'].value
    };
    
    // Tor configuration
    if (config.type === 'tor') {
        config.tor = {
            transparent: form.elements['tor.transparent']?.checked || false,
            hidden_services: []
        };
        
        // Get hidden services
        const serviceRows = document.querySelectorAll('#tor-services-body tr');
        const emptyRow = document.querySelector('#tor-services-body .empty-row');
        
        if (serviceRows.length > 0 && !emptyRow) {
            serviceRows.forEach(row => {
                const index = row.getAttribute('data-index');
                
                const virtualPort = parseInt(form.elements[`tor.hidden_services[${index}].virtual_port`].value, 10);
                const targetIp = form.elements[`tor.hidden_services[${index}].target_ip`].value;
                const targetPort = parseInt(form.elements[`tor.hidden_services[${index}].target_port`].value, 10);
                
                if (!isNaN(virtualPort) && !isNaN(targetPort) && targetIp) {
                    config.tor.hidden_services.push({
                        virtual_port: virtualPort,
                        target_ip: targetIp,
                        target_port: targetPort
                    });
                }
            });
        }
    }
    
    // VPN configuration
    if (config.type === 'vpn') {
        config.vpn = {
            provider: form.elements['vpn.provider'].value,
            config_file: form.elements['vpn.config_file'].value,
            auth: {
                username: form.elements['vpn.auth.username'].value,
                password: form.elements['vpn.auth.password'].value
            }
        };
    }
    
    // V2Ray configuration
    if (config.type === 'v2ray') {
        config.v2ray = {
            config_file: form.elements['v2ray.config_file'].value
        };
    }
    
    // Disable form inputs during save
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Show saving state for submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-feather="loader" class="loader-spinner"></i> Saving...';
    feather.replace();
    
    // Save config
    api.put('/tunnel/config', config)
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show success message
            showNotification('success', 'Tunnel Settings', 'Tunnel configuration saved successfully');
        })
        .catch(error => {
            console.error('Error saving tunnel configuration:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show error message
            showNotification('error', 'Tunnel Settings Error', error.message || 'Failed to save tunnel configuration');
        });
}

/**
 * Restart tunnel service
 */
function restartTunnel() {
    // Confirm restart
    if (!confirm('Are you sure you want to restart the tunnel service?')) {
        return;
    }
    
    // Show loading notification
    showNotification('info', 'Tunnel Restart', 'Restarting tunnel service...');
    
    // Call API to restart tunnel
    api.post('/tunnel/restart')
        .then(response => {
            if (response.success) {
                showNotification('success', 'Tunnel Restart', 'Tunnel service restarted successfully');
            } else {
                showNotification('error', 'Tunnel Restart Failed', response.message || 'Failed to restart tunnel service');
            }
        })
        .catch(error => {
            console.error('Error restarting tunnel:', error);
            showNotification('error', 'Tunnel Restart Error', error.message || 'Failed to restart tunnel service');
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
            <i data-feather="alert-circle"></i>
            <h3>${title}</h3>
            ${message ? `<p>${message}</p>` : ''}
            <button type="button" class="btn btn-primary" onclick="loadTunnelModule()">
                <i data-feather="refresh-cw"></i> Try Again
            </button>
        </div>
    `;
}
