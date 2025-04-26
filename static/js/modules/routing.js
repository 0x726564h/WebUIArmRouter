/**
 * Routing Module
 * Handles network routing configuration
 */

/**
 * Load the routing module
 */
function loadRoutingModule() {
    // Get the routing module container
    const moduleContainer = document.getElementById('routing-module');
    
    // Clear previous content and show loading
    moduleContainer.innerHTML = '<div class="loading-spinner"><i data-feather="loader"></i></div>';
    feather.replace();
    
    // Load routing configuration and routing table
    Promise.all([
        api.get('/routing/config'),
        api.get('/routing/table')
    ])
    .then(([configData, tableData]) => {
        // Create module content
        moduleContainer.innerHTML = createRoutingContent(configData.routing, tableData);
        
        // Set up form submission handler
        setupRoutingForm();
        
        // Initialize feather icons
        feather.replace();
    })
    .catch(error => {
        console.error('Error loading routing information:', error);
        moduleContainer.innerHTML = createErrorState('Failed to load routing information', error.message);
        feather.replace();
    });
}

/**
 * Create routing module content
 * @param {object} config - Routing configuration
 * @param {Array} routingTable - Current routing table
 * @returns {string} - HTML content
 */
function createRoutingContent(config, routingTable) {
    if (!config) {
        config = { static_routes: [] };
    }
    
    return `
        <section class="card">
            <div class="card-header">
                <h2>Routing Table</h2>
                <button type="button" id="refresh-routes-btn" class="btn btn-outline">
                    <i data-feather="refresh-cw"></i> Refresh
                </button>
            </div>
            <div class="card-content">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Destination</th>
                                <th>Gateway</th>
                                <th>Interface</th>
                                <th>Flags</th>
                            </tr>
                        </thead>
                        <tbody id="routing-table-body">
                            ${createRoutingTableRows(routingTable)}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        
        <section class="card">
            <div class="card-header">
                <h2>Static Routes</h2>
            </div>
            <div class="card-content">
                <form id="routing-form">
                    <div class="panel">
                        <div class="panel-header">
                            <h3>Static Route Configuration</h3>
                            <button type="button" id="add-route-btn" class="btn btn-outline btn-sm">
                                <i data-feather="plus"></i> Add Route
                            </button>
                        </div>
                        <div class="panel-body">
                            <div class="table-container">
                                <table class="table" id="static-routes-table">
                                    <thead>
                                        <tr>
                                            <th>Destination</th>
                                            <th>Netmask</th>
                                            <th>Gateway</th>
                                            <th>Interface</th>
                                            <th>Metric</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="static-routes-body">
                                        ${createStaticRoutesTableRows(config.static_routes || [])}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" id="routing-reset-btn" class="btn btn-outline">Reset</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

/**
 * Create table rows for the routing table
 * @param {Array} routes - Current routing table entries
 * @returns {string} - HTML content for table rows
 */
function createRoutingTableRows(routes) {
    if (!routes || routes.length === 0) {
        return `<tr><td colspan="4" class="empty-row">No routes found</td></tr>`;
    }
    
    return routes.map(route => `
        <tr>
            <td>${route.destination || ''}</td>
            <td>${route.gateway || '*'}</td>
            <td>${route.interface || ''}</td>
            <td>${route.flags || ''}</td>
        </tr>
    `).join('');
}

/**
 * Create table rows for static routes
 * @param {Array} routes - Static route objects
 * @returns {string} - HTML content for table rows
 */
function createStaticRoutesTableRows(routes) {
    if (!routes || routes.length === 0) {
        return `<tr><td colspan="6" class="empty-row">No static routes configured</td></tr>`;
    }
    
    return routes.map((route, index) => `
        <tr data-index="${index}">
            <td>
                <input type="text" name="static_routes[${index}].destination" class="form-input" value="${route.destination || ''}">
            </td>
            <td>
                <input type="text" name="static_routes[${index}].netmask" class="form-input" value="${route.netmask || '255.255.255.0'}">
            </td>
            <td>
                <input type="text" name="static_routes[${index}].gateway" class="form-input" value="${route.gateway || ''}">
            </td>
            <td>
                <input type="text" name="static_routes[${index}].interface" class="form-input" value="${route.interface || ''}">
            </td>
            <td>
                <input type="number" name="static_routes[${index}].metric" class="form-input" value="${route.metric || 0}" min="0">
            </td>
            <td>
                <button type="button" class="btn btn-icon btn-danger delete-route-btn" data-index="${index}">
                    <i data-feather="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Set up routing form handlers
 */
function setupRoutingForm() {
    // Add route button
    const addRouteBtn = document.getElementById('add-route-btn');
    if (addRouteBtn) {
        addRouteBtn.addEventListener('click', addRouteRow);
    }
    
    // Delete route buttons
    setupDeleteRouteButtons();
    
    // Refresh routes button
    const refreshBtn = document.getElementById('refresh-routes-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshRoutingTable);
    }
    
    // Form submit handler
    const form = document.getElementById('routing-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            saveRoutingConfig(form);
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('routing-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            loadRoutingModule();
        });
    }
}

/**
 * Set up delete route buttons
 */
function setupDeleteRouteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-route-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                row.remove();
                
                // If no routes left, add empty row
                const routeRows = document.querySelectorAll('#static-routes-body tr');
                if (routeRows.length === 0) {
                    document.getElementById('static-routes-body').innerHTML = 
                        `<tr><td colspan="6" class="empty-row">No static routes configured</td></tr>`;
                }
                
                // Reindex rows
                reindexRouteRows();
            }
        });
    });
}

/**
 * Add new route row
 */
function addRouteRow() {
    // Remove empty row if present
    const emptyRow = document.querySelector('#static-routes-body .empty-row');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }
    
    // Get current row count
    const rows = document.querySelectorAll('#static-routes-body tr');
    const newIndex = rows.length;
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-index', newIndex);
    
    newRow.innerHTML = `
        <td>
            <input type="text" name="static_routes[${newIndex}].destination" class="form-input" placeholder="192.168.2.0">
        </td>
        <td>
            <input type="text" name="static_routes[${newIndex}].netmask" class="form-input" value="255.255.255.0">
        </td>
        <td>
            <input type="text" name="static_routes[${newIndex}].gateway" class="form-input" placeholder="192.168.1.1">
        </td>
        <td>
            <input type="text" name="static_routes[${newIndex}].interface" class="form-input" placeholder="eth0">
        </td>
        <td>
            <input type="number" name="static_routes[${newIndex}].metric" class="form-input" value="0" min="0">
        </td>
        <td>
            <button type="button" class="btn btn-icon btn-danger delete-route-btn" data-index="${newIndex}">
                <i data-feather="trash-2"></i>
            </button>
        </td>
    `;
    
    // Add to table
    document.getElementById('static-routes-body').appendChild(newRow);
    
    // Initialize feather icons
    feather.replace();
    
    // Set up delete button
    setupDeleteRouteButtons();
    
    // Focus on first input
    newRow.querySelector('input').focus();
}

/**
 * Reindex route rows after deletion
 */
function reindexRouteRows() {
    const rows = document.querySelectorAll('#static-routes-body tr');
    
    rows.forEach((row, index) => {
        row.setAttribute('data-index', index);
        
        // Update input names
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            const name = input.getAttribute('name');
            if (name) {
                const newName = name.replace(/static_routes\[\d+\]/, `static_routes[${index}]`);
                input.setAttribute('name', newName);
            }
        });
        
        // Update delete button index
        const deleteBtn = row.querySelector('.delete-route-btn');
        if (deleteBtn) {
            deleteBtn.setAttribute('data-index', index);
        }
    });
}

/**
 * Refresh the routing table
 */
function refreshRoutingTable() {
    const tableBody = document.getElementById('routing-table-body');
    
    // Show loading spinner
    tableBody.innerHTML = `
        <tr>
            <td colspan="4">
                <div class="loading-spinner" style="padding: 1rem;">
                    <i data-feather="loader"></i>
                </div>
            </td>
        </tr>
    `;
    feather.replace();
    
    // Fetch routing table
    api.get('/routing/table')
        .then(routes => {
            tableBody.innerHTML = createRoutingTableRows(routes);
        })
        .catch(error => {
            console.error('Error refreshing routing table:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-row">
                        Error refreshing routing table: ${error.message || 'Unknown error'}
                    </td>
                </tr>
            `;
        });
}

/**
 * Save routing configuration
 * @param {HTMLFormElement} form - Routing configuration form
 */
function saveRoutingConfig(form) {
    // Create config object
    const config = {
        static_routes: []
    };
    
    // Get static routes
    const routeRows = document.querySelectorAll('#static-routes-body tr');
    const emptyRow = document.querySelector('#static-routes-body .empty-row');
    
    if (routeRows.length > 0 && !emptyRow) {
        routeRows.forEach(row => {
            const index = row.getAttribute('data-index');
            
            const destination = form.elements[`static_routes[${index}].destination`].value;
            const netmask = form.elements[`static_routes[${index}].netmask`].value;
            const gateway = form.elements[`static_routes[${index}].gateway`].value;
            const interface_ = form.elements[`static_routes[${index}].interface`].value;
            const metric = parseInt(form.elements[`static_routes[${index}].metric`].value, 10);
            
            // Only add route if destination is specified
            if (destination) {
                config.static_routes.push({
                    destination: destination,
                    netmask: netmask,
                    gateway: gateway,
                    interface: interface_,
                    metric: isNaN(metric) ? 0 : metric
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
    submitBtn.innerHTML = '<i data-feather="loader" class="loader-spinner"></i> Saving...';
    feather.replace();
    
    // Save config
    api.put('/routing/config', config)
        .then(response => {
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show success message
            showNotification('success', 'Routing Configuration', 'Routing configuration saved successfully');
            
            // Refresh routing table
            refreshRoutingTable();
        })
        .catch(error => {
            console.error('Error saving routing configuration:', error);
            
            // Re-enable form inputs
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Reset button text
            submitBtn.innerHTML = originalBtnText;
            feather.replace();
            
            // Show error message
            showNotification('error', 'Routing Configuration Error', error.message || 'Failed to save routing configuration');
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
            <button type="button" class="btn btn-primary" onclick="loadRoutingModule()">
                <i data-feather="refresh-cw"></i> Try Again
            </button>
        </div>
    `;
}
