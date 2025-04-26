/**
 * Module Manager
 * Handles module management (install, remove, enable/disable)
 */

/**
 * Load the module manager
 */
function loadModuleManagerModule() {
    // Get the module manager container
    const moduleContainer = document.getElementById('module-manager-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><i data-feather="loader"></i></div>';
    feather.replace();
    
    // Load modules
    api.get('/modules')
        .then(modules => {
            // Create module content
            moduleContainer.innerHTML = createModuleManagerContent(modules);
            
            // Setup event handlers
            setupModuleManagerHandlers();
            
            // Initialize feather icons
            feather.replace();
        })
        .catch(error => {
            console.error('Error loading modules:', error);
            moduleContainer.innerHTML = createErrorState('Failed to load modules', error.message);
            feather.replace();
        });
}

/**
 * Create module manager content
 * @param {object} modules - Available modules
 * @returns {string} - HTML content
 */
function createModuleManagerContent(modules) {
    if (!modules || Object.keys(modules).length === 0) {
        return createErrorState('No modules found');
    }
    
    let moduleCards = '';
    
    for (const [moduleId, moduleInfo] of Object.entries(modules)) {
        moduleCards += createModuleCard(moduleId, moduleInfo);
    }
    
    return `
        <section class="card">
            <div class="card-header">
                <h2>Module Manager</h2>
                <button type="button" id="check-updates-btn" class="btn btn-outline">
                    <i data-feather="refresh-cw"></i> Check for Updates
                </button>
            </div>
            <div class="card-content">
                <p class="info-text">
                    Enable or disable modules to customize the functionality of your router.
                    Core modules cannot be disabled as they provide essential functionality.
                </p>
                
                <div class="module-grid">
                    ${moduleCards}
                </div>
            </div>
        </section>
        
        <section class="card">
            <div class="card-header">
                <h2>Available Modules</h2>
                <button type="button" id="refresh-available-btn" class="btn btn-outline">
                    <i data-feather="refresh-cw"></i> Refresh
                </button>
            </div>
            <div class="card-content">
                <div id="available-modules-container">
                    <div class="loading-spinner">
                        <i data-feather="loader"></i>
                    </div>
                </div>
            </div>
        </section>
    `;
}

/**
 * Create a module card
 * @param {string} moduleId - Module identifier
 * @param {object} moduleInfo - Module information
 * @returns {string} - HTML content for module card
 */
function createModuleCard(moduleId, moduleInfo) {
    const iconMap = {
        dashboard: 'home',
        network: 'globe',
        wifi: 'wifi',
        firewall: 'shield',
        tunnel: 'key',
        routing: 'shuffle',
        settings: 'settings',
        'module-manager': 'package'
    };
    
    const icon = iconMap[moduleId] || 'box';
    
    return `
        <div class="module-card" data-module-id="${moduleId}">
            <div class="module-icon">
                <i data-feather="${icon}"></i>
            </div>
            <div class="module-details">
                <div class="module-name">
                    ${moduleInfo.name}
                    ${moduleInfo.core ? '<span class="module-core-badge">Core</span>' : ''}
                </div>
                <div class="module-description">${moduleInfo.description}</div>
                <div class="module-actions">
                    <label class="toggle-switch">
                        <input type="checkbox" class="module-toggle" data-module-id="${moduleId}" 
                            ${moduleInfo.enabled ? 'checked' : ''} 
                            ${moduleInfo.core ? 'disabled' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    ${!moduleInfo.core ? 
                        `<button type="button" class="btn btn-outline btn-sm module-remove-btn" data-module-id="${moduleId}">
                            <i data-feather="trash-2"></i> Remove
                        </button>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup module manager event handlers
 */
function setupModuleManagerHandlers() {
    // Module toggle switches
    const toggles = document.querySelectorAll('.module-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const moduleId = toggle.getAttribute('data-module-id');
            updateModuleStatus(moduleId, toggle.checked);
        });
    });
    
    // Module remove buttons
    const removeButtons = document.querySelectorAll('.module-remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const moduleId = button.getAttribute('data-module-id');
            confirmModuleRemoval(moduleId);
        });
    });
    
    // Check for updates button
    const checkUpdatesBtn = document.getElementById('check-updates-btn');
    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener('click', checkForUpdates);
    }
    
    // Refresh available modules button
    const refreshAvailableBtn = document.getElementById('refresh-available-btn');
    if (refreshAvailableBtn) {
        refreshAvailableBtn.addEventListener('click', loadAvailableModules);
    }
    
    // Load available modules initially
    loadAvailableModules();
}

/**
 * Update module status (enable/disable)
 * @param {string} moduleId - Module identifier
 * @param {boolean} enabled - Whether to enable or disable the module
 */
function updateModuleStatus(moduleId, enabled) {
    // Get the toggle element
    const toggle = document.querySelector(`.module-toggle[data-module-id="${moduleId}"]`);
    
    // Disable toggle while updating
    if (toggle) {
        toggle.disabled = true;
    }
    
    // Update module status
    api.put(`/modules/${moduleId}`, { enabled: enabled })
        .then(response => {
            if (response.success) {
                showNotification('success', 'Module Status Updated', 
                    `Module ${response.module.name} has been ${enabled ? 'enabled' : 'disabled'}.`);
                
                // Re-enable toggle
                if (toggle) {
                    toggle.disabled = false;
                }
                
                // If the module is currently active in navigation, reload modules to update visibility
                if (moduleId === getCurrentModule()) {
                    // This will hide the module if it's disabled
                    loadModules();
                }
            } else {
                // Revert toggle state
                if (toggle) {
                    toggle.checked = !enabled;
                    toggle.disabled = false;
                }
                
                showNotification('error', 'Module Status Update Failed', 
                    response.message || 'Failed to update module status');
            }
        })
        .catch(error => {
            console.error('Error updating module status:', error);
            
            // Revert toggle state
            if (toggle) {
                toggle.checked = !enabled;
                toggle.disabled = false;
            }
            
            showNotification('error', 'Module Status Update Error', 
                error.message || 'Failed to update module status');
        });
}

/**
 * Confirm module removal
 * @param {string} moduleId - Module identifier
 */
function confirmModuleRemoval(moduleId) {
    // Get module name
    const moduleCard = document.querySelector(`.module-card[data-module-id="${moduleId}"]`);
    const moduleName = moduleCard ? moduleCard.querySelector('.module-name').textContent.trim() : moduleId;
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to remove the module "${moduleName}"? This action cannot be undone.`)) {
        removeModule(moduleId);
    }
}

/**
 * Remove a module
 * @param {string} moduleId - Module identifier
 */
function removeModule(moduleId) {
    // Get the module card
    const moduleCard = document.querySelector(`.module-card[data-module-id="${moduleId}"]`);
    
    // Add loading state to card
    if (moduleCard) {
        moduleCard.classList.add('loading');
        const removeBtn = moduleCard.querySelector('.module-remove-btn');
        if (removeBtn) {
            removeBtn.disabled = true;
            removeBtn.innerHTML = '<i data-feather="loader" class="loader-spinner"></i> Removing...';
            feather.replace();
        }
    }
    
    // Remove module
    api.delete(`/modules/${moduleId}`)
        .then(response => {
            if (response.success) {
                showNotification('success', 'Module Removed', 
                    response.message || 'Module has been removed successfully');
                
                // Remove card with animation
                if (moduleCard) {
                    moduleCard.style.opacity = '0';
                    setTimeout(() => {
                        moduleCard.remove();
                    }, 300);
                }
                
                // If the module is currently active in navigation, reload modules to update visibility
                if (moduleId === getCurrentModule()) {
                    // This will hide the module if it's removed
                    loadModules();
                }
            } else {
                // Remove loading state
                if (moduleCard) {
                    moduleCard.classList.remove('loading');
                    const removeBtn = moduleCard.querySelector('.module-remove-btn');
                    if (removeBtn) {
                        removeBtn.disabled = false;
                        removeBtn.innerHTML = '<i data-feather="trash-2"></i> Remove';
                        feather.replace();
                    }
                }
                
                showNotification('error', 'Module Removal Failed', 
                    response.message || 'Failed to remove module');
            }
        })
        .catch(error => {
            console.error('Error removing module:', error);
            
            // Remove loading state
            if (moduleCard) {
                moduleCard.classList.remove('loading');
                const removeBtn = moduleCard.querySelector('.module-remove-btn');
                if (removeBtn) {
                    removeBtn.disabled = false;
                    removeBtn.innerHTML = '<i data-feather="trash-2"></i> Remove';
                    feather.replace();
                }
            }
            
            showNotification('error', 'Module Removal Error', 
                error.message || 'Failed to remove module');
        });
}

/**
 * Check for module updates
 */
function checkForUpdates() {
    // Get the button
    const button = document.getElementById('check-updates-btn');
    
    // Add loading state
    if (button) {
        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i data-feather="loader" class="loader-spinner"></i> Checking...';
        feather.replace();
        
        // Simulate checking for updates (in a real implementation, this would be an API call)
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalHtml;
            feather.replace();
            
            // Show notification
            showNotification('info', 'Updates', 'All modules are up to date');
        }, 2000);
    }
}

/**
 * Load available modules
 */
function loadAvailableModules() {
    const container = document.getElementById('available-modules-container');
    
    // Show loading spinner
    if (container) {
        container.innerHTML = '<div class="loading-spinner"><i data-feather="loader"></i></div>';
        feather.replace();
        
        // Load available modules
        api.get('/modules/available')
            .then(modules => {
                if (!modules || Object.keys(modules).length === 0) {
                    container.innerHTML = '<div class="empty-state">No additional modules available</div>';
                    return;
                }
                
                // Filter out already installed modules
                const installedModules = document.querySelectorAll('.module-card');
                const installedIds = Array.from(installedModules).map(card => 
                    card.getAttribute('data-module-id')
                );
                
                // Find modules that aren't already installed
                const availableModules = Object.entries(modules)
                    .filter(([moduleId]) => !installedIds.includes(moduleId));
                
                if (availableModules.length === 0) {
                    container.innerHTML = '<div class="empty-state">All available modules are already installed</div>';
                    return;
                }
                
                // Create content
                let content = '<div class="available-modules-grid">';
                
                availableModules.forEach(([moduleId, moduleInfo]) => {
                    content += `
                        <div class="module-card" data-module-id="${moduleId}">
                            <div class="module-icon">
                                <i data-feather="box"></i>
                            </div>
                            <div class="module-details">
                                <div class="module-name">${moduleInfo.name}</div>
                                <div class="module-description">${moduleInfo.description}</div>
                                <div class="module-actions">
                                    <button type="button" class="btn btn-primary btn-sm module-install-btn" data-module-id="${moduleId}">
                                        <i data-feather="download"></i> Install
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                content += '</div>';
                container.innerHTML = content;
                
                // Setup install buttons
                const installButtons = container.querySelectorAll('.module-install-btn');
                installButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const moduleId = button.getAttribute('data-module-id');
                        installModule(moduleId, button);
                    });
                });
                
                // Initialize feather icons
                feather.replace();
            })
            .catch(error => {
                console.error('Error loading available modules:', error);
                container.innerHTML = `
                    <div class="error-state">
                        <i data-feather="alert-circle"></i>
                        <h3>Failed to load available modules</h3>
                        <p>${error.message || 'An error occurred'}</p>
                    </div>
                `;
                feather.replace();
            });
    }
}

/**
 * Install a module
 * @param {string} moduleId - Module identifier
 * @param {HTMLButtonElement} button - Install button element
 */
function installModule(moduleId, button) {
    // Add loading state
    if (button) {
        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i data-feather="loader" class="loader-spinner"></i> Installing...';
        feather.replace();
        
        // Install module
        api.post(`/modules/install/${moduleId}`)
            .then(response => {
                if (response.success) {
                    showNotification('success', 'Module Installed', 
                        `Module ${response.module.name} has been installed successfully`);
                    
                    // Remove from available modules and reload modules list
                    const moduleCard = button.closest('.module-card');
                    if (moduleCard) {
                        moduleCard.style.opacity = '0';
                        setTimeout(() => {
                            moduleCard.remove();
                            
                            // Check if no more available modules
                            const remainingCards = document.querySelectorAll('.available-modules-grid .module-card');
                            if (remainingCards.length === 0) {
                                document.getElementById('available-modules-container').innerHTML = 
                                    '<div class="empty-state">All available modules are already installed</div>';
                            }
                            
                            // Reload module manager to show the newly installed module
                            loadModuleManagerModule();
                        }, 300);
                    }
                } else {
                    // Reset button
                    button.disabled = false;
                    button.innerHTML = originalHtml;
                    feather.replace();
                    
                    showNotification('error', 'Module Installation Failed', 
                        response.message || 'Failed to install module');
                }
            })
            .catch(error => {
                console.error('Error installing module:', error);
                
                // Reset button
                button.disabled = false;
                button.innerHTML = originalHtml;
                feather.replace();
                
                showNotification('error', 'Module Installation Error', 
                    error.message || 'Failed to install module');
            });
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
        <div class="error-state">
            <i data-feather="alert-circle"></i>
            <h3>${title}</h3>
            ${message ? `<p>${message}</p>` : ''}
            <button type="button" class="btn btn-primary" onclick="loadModuleManagerModule()">
                <i data-feather="refresh-cw"></i> Try Again
            </button>
        </div>
    `;
}
