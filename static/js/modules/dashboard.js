/**
 * Dashboard Module
 * Handles dashboard functionality including system information and statistics
 */

// Dashboard update interval in milliseconds
const DASHBOARD_UPDATE_INTERVAL = 5000;

// Dashboard update timer
let dashboardUpdateTimer = null;

/**
 * Load the dashboard module
 */
function loadDashboardModule() {
    // Cancel any existing update timer
    if (dashboardUpdateTimer) {
        clearInterval(dashboardUpdateTimer);
    }
    
    // Load initial data
    loadSystemInfo();
    loadSystemStatistics();
    
    // Set up regular updates
    dashboardUpdateTimer = setInterval(() => {
        loadSystemStatistics();
    }, DASHBOARD_UPDATE_INTERVAL);
}

/**
 * Load system information
 */
function loadSystemInfo() {
    api.get('/api/dashboard/system-info')
        .then(info => {
            console.log("Получены данные о системе:", info);
            // Update hostname
            document.getElementById('hostname').textContent = info.hostname || 'Unknown';
            
            // Update platform
            document.getElementById('platform').textContent = 
                `${info.platform || 'Unknown'} ${info.platform_version || ''}`;
            
            // Update architecture
            document.getElementById('architecture').textContent = info.architecture || 'Unknown';
            
            // Calculate uptime from timestamp
            const currentTime = Math.floor(Date.now() / 1000);
            const uptimeSeconds = currentTime - info.uptime_seconds;
            
            // Update uptime
            document.getElementById('uptime').textContent = formatUptime(uptimeSeconds);
        })
        .catch(error => {
            console.error('Error loading system info:', error);
            showNotification('error', 'System Information Error', 'Failed to load system information');
            
            // Update fields with error state
            document.getElementById('hostname').textContent = 'Error loading';
            document.getElementById('platform').textContent = 'Error loading';
            document.getElementById('architecture').textContent = 'Error loading';
            document.getElementById('uptime').textContent = 'Error loading';
        });
}

/**
 * Load system statistics (CPU, memory, disk, network)
 */
function loadSystemStatistics() {
    api.get('/api/dashboard/statistics')
        .then(stats => {
            console.log("Получены статистические данные:", stats);
            // Update CPU statistics
            updateCpuStats(stats.cpu);
            
            // Update memory statistics
            updateMemoryStats(stats.memory);
            
            // Update disk usage
            updateDiskUsage(stats.disk);
            
            // Update network interfaces (handled separately)
            loadNetworkInterfaces();
        })
        .catch(error => {
            console.error('Error loading system statistics:', error);
            showNotification('error', 'System Statistics Error', 'Failed to load system statistics');
        });
}

/**
 * Update CPU statistics
 */
function updateCpuStats(cpu) {
    if (!cpu || cpu.error) {
        console.error('CPU stats error:', cpu ? cpu.error : 'No CPU data');
        return;
    }
    
    // Update CPU usage percentage
    const cpuPercent = cpu.avg_percent || 0;
    document.getElementById('cpu-usage').textContent = `${Math.round(cpuPercent)}%`;
    
    // Update CPU usage circle
    const circle = document.getElementById('cpu-circle');
    const circumference = 339.292; // 2 * π * 54 (radius)
    const offset = circumference - (cpuPercent / 100 * circumference);
    circle.style.strokeDashoffset = offset;
    
    // Update CPU cores
    document.getElementById('cpu-cores').textContent = cpu.count || '-';
    
    // Update CPU frequency
    let freqText = '-';
    if (cpu.freq_current) {
        freqText = `${(cpu.freq_current / 1000).toFixed(2)} GHz`;
    }
    document.getElementById('cpu-freq').textContent = freqText;
}

/**
 * Update memory statistics
 */
function updateMemoryStats(memory) {
    if (!memory || memory.error) {
        console.error('Memory stats error:', memory ? memory.error : 'No memory data');
        return;
    }
    
    // Update memory usage percentage
    const memoryPercent = memory.percent || 0;
    document.getElementById('memory-usage').textContent = `${Math.round(memoryPercent)}%`;
    
    // Update memory usage circle
    const circle = document.getElementById('memory-circle');
    const circumference = 339.292; // 2 * π * 54 (radius)
    const offset = circumference - (memoryPercent / 100 * circumference);
    circle.style.strokeDashoffset = offset;
    
    // Update memory total
    let totalText = '-';
    if (memory.total) {
        totalText = formatBytes(memory.total);
    }
    document.getElementById('memory-total').textContent = totalText;
    
    // Update memory used
    let usedText = '-';
    if (memory.used) {
        usedText = formatBytes(memory.used);
    }
    document.getElementById('memory-used').textContent = usedText;
}

/**
 * Load network interfaces
 */
function loadNetworkInterfaces() {
    api.get('/api/network/interfaces')
        .then(interfaces => {
            const interfacesContainer = document.getElementById('network-interfaces');
            
            // Clear loading spinner
            interfacesContainer.innerHTML = '';
            
            if (!interfaces || Object.keys(interfaces).length === 0) {
                interfacesContainer.innerHTML = '<div class="empty-state">No network interfaces found</div>';
                return;
            }
            
            // Handle error case
            if (interfaces.error) {
                interfacesContainer.innerHTML = `<div class="error-state">Error: ${interfaces.error}</div>`;
                return;
            }
            
            // Process each interface
            for (const [ifName, ifData] of Object.entries(interfaces)) {
                const interfaceCard = document.createElement('div');
                interfaceCard.className = 'network-interface-card';
                
                // Interface header with name and status
                const header = document.createElement('div');
                header.className = 'network-interface-header';
                
                const name = document.createElement('span');
                name.className = 'network-interface-name';
                name.textContent = ifName;
                
                const status = document.createElement('span');
                status.className = `network-interface-status ${ifData.stats && ifData.stats.isup ? 'up' : 'down'}`;
                status.textContent = ifData.stats && ifData.stats.isup ? 'UP' : 'DOWN';
                
                header.appendChild(name);
                header.appendChild(status);
                
                // Interface addresses
                const addresses = document.createElement('div');
                addresses.className = 'network-interface-addresses';
                
                if (ifData.addresses && ifData.addresses.length > 0) {
                    ifData.addresses.forEach(addr => {
                        if (addr.address) {
                            addresses.innerHTML += `${addr.address}<br>`;
                        }
                    });
                } else {
                    addresses.textContent = 'No addresses';
                }
                
                // Add elements to card
                interfaceCard.appendChild(header);
                interfaceCard.appendChild(addresses);
                
                // Add card to container
                interfacesContainer.appendChild(interfaceCard);
            }
        })
        .catch(error => {
            console.error('Error loading network interfaces:', error);
            
            const interfacesContainer = document.getElementById('network-interfaces');
            interfacesContainer.innerHTML = '<div class="error-state">Failed to load network interfaces</div>';
        });
}

/**
 * Update disk usage
 */
function updateDiskUsage(disk) {
    const diskContainer = document.getElementById('disk-usage');
    
    // Clear loading spinner
    diskContainer.innerHTML = '';
    
    if (!disk || Object.keys(disk).length === 0) {
        diskContainer.innerHTML = '<div class="empty-state">No storage information found</div>';
        return;
    }
    
    // Handle error case
    if (disk.error) {
        diskContainer.innerHTML = `<div class="error-state">Error: ${disk.error}</div>`;
        return;
    }
    
    // Process each mount point
    for (const [mount, data] of Object.entries(disk)) {
        const diskBar = document.createElement('div');
        diskBar.className = 'disk-usage-bar';
        
        // Mount point
        const mountPoint = document.createElement('div');
        mountPoint.className = 'disk-mount';
        mountPoint.textContent = mount;
        
        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressValue = document.createElement('div');
        progressValue.className = 'progress-value';
        progressValue.style.width = `${data.percent || 0}%`;
        
        progressBar.appendChild(progressValue);
        
        // Details
        const details = document.createElement('div');
        details.className = 'disk-details';
        
        const percentage = document.createElement('span');
        percentage.textContent = `${Math.round(data.percent || 0)}%`;
        
        const used = document.createElement('span');
        used.className = 'disk-used';
        used.textContent = `${formatBytes(data.used || 0)} / ${formatBytes(data.total || 0)}`;
        
        details.appendChild(percentage);
        details.appendChild(used);
        
        // Add elements to container
        diskBar.appendChild(mountPoint);
        diskBar.appendChild(progressBar);
        diskBar.appendChild(details);
        
        // Add to main container
        diskContainer.appendChild(diskBar);
    }
}
