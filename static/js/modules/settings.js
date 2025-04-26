/**
 * Settings Module
 * Handles general system settings
 */

/**
 * Load the settings module
 */
function loadSettingsModule() {
    // Get the settings module container
    const moduleContainer = document.getElementById('settings-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><i data-feather="loader"></i></div>';
    feather.replace();
    
    // Load system and access settings
    Promise.all([
        api.get('/settings/system'),
        api.get('/settings/access')
    ])
    .then(([systemData, accessData]) => {
        // Create module content
        moduleContainer.innerHTML = createSettingsContent(systemData.system, accessData.access);
        
        // Set up form submission handlers
        setupSettingsForms();
        
        // Initialize feather icons
        feather.replace();
    })
    .catch(error => {
        console.error('Error loading settings:', error);
        moduleContainer.innerHTML = createErrorState('Failed to load settings', error.message);
        feather.replace();
    });
}

/**
 * Create settings module content
 * @param {object} systemConfig - System configuration
 * @param {object} accessConfig - Access configuration
 * @returns {string} - HTML content
 */
function createSettingsContent(systemConfig, accessConfig) {
    if (!systemConfig) {
        systemConfig = {};
    }
    
    if (!accessConfig) {
        accessConfig = {
            ssh: { enabled: true, port: 22 },
            web: { enabled: true, port: 8000, https: false }
        };
    }
    
    return `
        <section class="card">
            <div class="card-header">
                <h2>System Settings</h2>
            </div>
            <div class="card-content">
                <form id="system-form">
                    <div class="form-group">
                        <label class="form-label">Hostname</label>
                        <input type="text" name="hostname" class="form-input" value="${systemConfig.hostname || 'armrouter'}">
                        <div class="form-help">System hostname (used for DHCP and DNS)</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Timezone</label>
                        <select name="timezone" class="form-input form-select">
                            ${createTimezoneOptions(systemConfig.timezone || 'UTC')}
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save System Settings</button>
                        <button type="button" id="system-reset-btn" class="btn btn-outline">Reset</button>
                    </div>
                </form>
            </div>
        </section>
        
        <section class="card">
            <div class="card-header">
                <h2>Access Settings</h2>
            </div>
            <div class="card-content">
                <form id="access-form">
                    <div class="panel">
                        <div class="panel-header">
                            <h3>SSH Access</h3>
                        </div>
                        <div class="panel-body">
                            <div class="form-group">
                                <label class="form-label">SSH Status</label>
                                <div class="toggle-group">
                                    <label class="toggle-switch">
                                        <input type="checkbox" name="ssh.enabled" ${accessConfig.ssh?.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">${accessConfig.ssh?.enabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">SSH Port</label>
                                <input type="number" name="ssh.port" class="form-input" value="${accessConfig.ssh?.port || 22}" min="1" max="65535">
                            </div>
                        </div>
                    </div>
                    
                    <div class="panel">
                        <div class="panel-header">
                            <h3>Web UI Access</h3>
                        </div>
                        <div class="panel-body">
                            <div class="form-group">
                                <label class="form-label">Web UI Status</label>
                                <div class="toggle-group">
                                    <label class="toggle-switch">
                                        <input type="checkbox" name="web.enabled" ${accessConfig.web?.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">${accessConfig.web?.enabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Web UI Port</label>
                                <input type="number" name="web.port" class="form-input" value="${accessConfig.web?.port || 8000}" min="1" max="65535">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">HTTPS</label>
                                <div class="toggle-group">
                                    <label class="toggle-switch">
                                        <input type="checkbox" name="web.https" ${accessConfig.web?.https ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="form-help">Enable HTTPS for secure web access</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Access Settings</button>
                        <button type="button" id="access-reset-btn" class="btn btn-outline">Reset</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

/**
 * Create timezone options for select element
 * @param {string} selectedTimezone - Currently selected timezone
 * @returns {string} - HTML options
 */
function createTimezoneOptions(selectedTimezone) {
    const timezones = [
        'UTC',
        'Africa/Cairo',
        'Africa/Johannesburg',
        'Africa/Lagos',
        'America/Argentina/Buenos_Aires',
        'America/Bogota',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Mexico_City',
        'America/New_York',
        'America/Phoenix',
        'America/Sao_Paulo',
        'America/Toronto',
        'Asia/Bangkok',
        'Asia/Dubai',
        'Asia/Hong_Kong',
        'Asia/Jakarta',
        'Asia/Kolkata',
        'Asia/Seoul',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Australia/Melbourne',
        'Australia/Sydney',
        'Europe/Amsterdam',
        'Europe/Berlin',
        'Europe/Dublin',
        'Europe/Istanbul',
        'Europe/London',
        'Europe/Madrid',
        'Europe/Moscow',
        'Europe/Paris',
        'Europe/Prague',
        'Europe/Rome',
        'Pacific/Auckland',
        'Pacific/Honolulu'
    ];
    
    return timezones.map(tz => 
        `<option value="${tz}" ${tz === selectedTimezone ? 'selected' : ''}>${tz.replace('_', ' ')}</option>`
    ).join('');
}

/**
 * Set up settings forms handlers
 */
function setupSettingsForms() {
    // SSH enabled toggle
    const sshToggle = document.querySelector('input[name="ssh.enabled"]');
    if (sshToggle) {
        sshToggle.addEventListener('change', () => {
            const toggleLabel = sshToggle.parentElement.nextElementSibling;
            toggleLabel.textContent = sshToggle.checked ? 'Enabled' : 'Disabled';
        });
    }
    
    // Web UI enabled toggle
    const webToggle = document.querySelector('input[name="web.enabled"]');
    if (webToggle) {
        webToggle.addEventListener('change', () => {
            const toggleLabel = webToggle.parentElement.nextElementSibling;
            toggleLabel.textContent = webToggle.checked ? 'Enabled' : 'Disabled';
        });
    }
    
    // System form submission
    const systemForm = document.getElementById('system-form');
    if (systemForm) {
        systemForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveSystemSettings(systemForm);
        });
    }
    
    // Access form submission
    const accessForm = document.getElementById('access-form');
    if (accessForm) {
        accessForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveAccessSettings(accessForm);
        });
    }
    
    // System reset button
    const systemResetBtn = document.getElementById('system-reset-btn');
    if (systemResetBtn) {
        systemResetBtn.addEventListener('click', () => {
            loadSettingsModule();
        });
    }
    
    // Access reset button
    const accessResetBtn = document.getElementById('access-reset-btn');
    if (accessResetBtn) {
        accessResetBtn.addEventListener('click', () => {
            loadSettingsModule();
        });
    }
}

/**
 * Save system settings
 * @param {HTMLFormElement} form - System settings form
 */
function saveSystemSettings(form) {
    // Create config object
    const config = {
        hostname: form.elements['hostname'].value,
        timezone: form.elements['timezone'].value
    };
    
    // Validate hostname
    if (!config.hostname) {
        showNotification('error', 'System Settings Error', 'Hostname cannot be empty');
        return;
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
    api.put('/settings/system', config)
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show success message
            showNotification('success', 'System Settings', 'System settings saved successfully');
        })
        .catch(error => {
            console.error('Error saving system settings:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show error message
            showNotification('error', 'System Settings Error', error.message || 'Failed to save system settings');
        });
}

/**
 * Save access settings
 * @param {HTMLFormElement} form - Access settings form
 */
function saveAccessSettings(form) {
    // Create config object
    const config = {
        ssh: {
            enabled: form.elements['ssh.enabled'].checked,
            port: parseInt(form.elements['ssh.port'].value, 10)
        },
        web: {
            enabled: form.elements['web.enabled'].checked,
            port: parseInt(form.elements['web.port'].value, 10),
            https: form.elements['web.https'].checked
        }
    };
    
    // Validate ports
    if (isNaN(config.ssh.port) || config.ssh.port < 1 || config.ssh.port > 65535) {
        showNotification('error', 'Access Settings Error', 'SSH port must be between 1 and 65535');
        return;
    }
    
    if (isNaN(config.web.port) || config.web.port < 1 || config.web.port > 65535) {
        showNotification('error', 'Access Settings Error', 'Web UI port must be between 1 and 65535');
        return;
    }
    
    // Check if ports are the same
    if (config.ssh.port === config.web.port) {
        showNotification('error', 'Access Settings Error', 'SSH and Web UI ports cannot be the same');
        return;
    }
    
    // Check if disabling Web UI
    if (!config.web.enabled) {
        if (!confirm('Warning: Disabling the Web UI will prevent you from accessing this interface. Are you sure you want to continue?')) {
            return;
        }
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
    api.put('/settings/access', config)
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show success message
            showNotification('success', 'Access Settings', 'Access settings saved successfully');
            
            // Show warning if web UI settings changed
            if (config.web.port !== 8000 || config.web.https) {
                const protocol = config.web.https ? 'https' : 'http';
                const port = config.web.port === 80 && !config.web.https || config.web.port === 443 && config.web.https ? '' : `:${config.web.port}`;
                
                showNotification(
                    'warning',
                    'Access Settings Changed',
                    `The Web UI will be available at ${protocol}://<router-ip>${port} after the service restarts.`,
                    10000
                );
            }
        })
        .catch(error => {
            console.error('Error saving access settings:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show error message
            showNotification('error', 'Access Settings Error', error.message || 'Failed to save access settings');
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
            <button type="button" class="btn btn-primary" onclick="loadSettingsModule()">
                <i data-feather="refresh-cw"></i> Try Again
            </button>
        </div>
    `;
}
