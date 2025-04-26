/**
 * ArmRouter - Логика для страницы топологии сети
 */

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы на странице топологии
    if (!document.getElementById('networkVisualizer')) {
        return; // Если нет, выходим
    }
    
    // Элементы интерфейса
    const container = document.getElementById('networkVisualizer');
    const topologyLoader = document.getElementById('topologyLoader');
    const topologyError = document.getElementById('topologyError');
    const deviceDetails = document.getElementById('deviceDetails');
    
    // Кнопки управления
    const scanNetworkBtn = document.getElementById('scanNetworkBtn');
    const saveTopologyBtn = document.getElementById('saveTopologyBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
    // Модальное окно сканирования
    const scanNetworkModal = document.getElementById('scanNetworkModal');
    const closeScanModal = document.getElementById('closeScanModal');
    const cancelScanBtn = document.getElementById('cancelScanBtn');
    const startScanBtn = document.getElementById('startScanBtn');
    const addDevicesBtn = document.getElementById('addDevicesBtn');
    
    // Переменные для работы с данными
    let visualizer = null;
    let topologyData = null;
    let selectedDevice = null;
    let scanJobId = null;
    
    // Инициализируем топологию
    initializeTopology();
    
    /**
     * Инициализирует топологию
     */
    function initializeTopology() {
        // Показываем загрузку
        showLoader();
        
        // Загружаем данные топологии
        fetch('/api/topology/network')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка загрузки данных топологии');
                }
                return response.json();
            })
            .then(data => {
                console.log('Данные топологии загружены:', data);
                topologyData = data;
                
                // Скрываем загрузку
                hideLoader();
                
                // Инициализируем визуализатор
                initializeVisualizer(data);
                
                // Обновляем таблицу устройств
                updateDevicesTable(data.nodes);
            })
            .catch(error => {
                console.error('Ошибка при загрузке топологии:', error);
                
                // Показываем ошибку
                showError();
            });
    }
    
    /**
     * Инициализирует визуализатор топологии
     */
    function initializeVisualizer(data) {
        // Создаем экземпляр визуализатора
        visualizer = new TopologyVisualizer(container, {
            nodeRadius: 25,
            linkDistance: 150,
            theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        });
        
        // Устанавливаем данные
        visualizer.setData(data.nodes, data.links);
        
        // Настраиваем обработчики событий
        container.addEventListener('node:select', handleNodeSelect);
        container.addEventListener('node:deselect', handleNodeDeselect);
        
        // Обработчики кнопок масштабирования
        zoomInBtn.addEventListener('click', () => visualizer.zoom(1.2));
        zoomOutBtn.addEventListener('click', () => visualizer.zoom(0.8));
        resetZoomBtn.addEventListener('click', () => visualizer.resetZoom());
    }
    
    /**
     * Обработчик выбора узла
     */
    function handleNodeSelect(event) {
        const node = event.detail.node;
        selectedDevice = node;
        
        // Обновляем панель с деталями устройства
        updateDeviceDetails(node);
        
        // Показываем панель
        deviceDetails.style.display = 'block';
    }
    
    /**
     * Обработчик снятия выбора с узла
     */
    function handleNodeDeselect(event) {
        selectedDevice = null;
        
        // Скрываем панель
        deviceDetails.style.display = 'none';
    }
    
    /**
     * Обновляет информацию об устройстве
     */
    function updateDeviceDetails(device) {
        // Иконка устройства
        const deviceIcon = deviceDetails.querySelector('.device-icon');
        deviceIcon.setAttribute('data-type', device.type || 'device');
        const iconElement = deviceIcon.querySelector('[data-icon]');
        iconElement.setAttribute('data-icon', getDeviceIcon(device.type));
        
        // Если у нас есть система загрузки иконок, инициализируем иконку
        if (window.IconsLoader) {
            window.IconsLoader.init(deviceIcon);
        }
        
        // Название и статус
        deviceDetails.querySelector('#deviceName').textContent = device.name || 'Устройство';
        
        const statusElement = deviceDetails.querySelector('#deviceStatus');
        statusElement.textContent = device.status === 'online' ? 'Онлайн' : 'Офлайн';
        statusElement.className = `device-status status-${device.status || 'offline'}`;
        
        // Основная информация
        deviceDetails.querySelector('#deviceIp').textContent = device.ip || 'Нет данных';
        deviceDetails.querySelector('#deviceMac').textContent = device.mac || 'Нет данных';
        deviceDetails.querySelector('#deviceType').textContent = getDeviceTypeName(device.type);
        deviceDetails.querySelector('#deviceVendor').textContent = device.vendor || 'Нет данных';
        
        // Интерфейсы
        const interfacesSection = deviceDetails.querySelector('#interfacesSection');
        const interfacesTable = deviceDetails.querySelector('#interfacesTable tbody');
        
        if (device.interfaces && device.interfaces.length > 0) {
            let interfacesHtml = '';
            
            device.interfaces.forEach(iface => {
                interfacesHtml += `
                    <tr>
                        <td>${iface.name || 'Неизвестно'}</td>
                        <td>${iface.ip || 'Нет данных'}</td>
                        <td>${iface.mac || 'Нет данных'}</td>
                        <td><span class="status-${iface.is_up ? 'up' : 'down'}">${iface.is_up ? 'Активен' : 'Отключен'}</span></td>
                    </tr>
                `;
            });
            
            interfacesTable.innerHTML = interfacesHtml;
            interfacesSection.style.display = 'block';
        } else {
            interfacesTable.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных</td></tr>';
            interfacesSection.style.display = 'none';
        }
        
        // Сервисы
        const servicesSection = deviceDetails.querySelector('#servicesSection');
        const servicesTable = deviceDetails.querySelector('#servicesTable tbody');
        
        if (device.services && device.services.length > 0) {
            let servicesHtml = '';
            
            device.services.forEach(service => {
                servicesHtml += `
                    <tr>
                        <td>${service.port || 'Нет данных'}</td>
                        <td>${service.protocol || 'Нет данных'}</td>
                        <td>${service.name || 'Неизвестно'}</td>
                        <td><span class="status-${service.status === 'open' ? 'up' : 'down'}">${service.status === 'open' ? 'Открыт' : 'Закрыт'}</span></td>
                    </tr>
                `;
            });
            
            servicesTable.innerHTML = servicesHtml;
            servicesSection.style.display = 'block';
        } else {
            servicesTable.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных</td></tr>';
            servicesSection.style.display = 'none';
        }
    }
    
    /**
     * Обновляет таблицу устройств
     */
    function updateDevicesTable(devices) {
        const tableBody = document.querySelector('#devicesTable tbody');
        
        if (!tableBody) return;
        
        if (devices && devices.length > 0) {
            let html = '';
            
            devices.forEach(device => {
                html += `
                    <tr>
                        <td>${device.name || 'Устройство'}</td>
                        <td>${device.ip || 'Нет данных'}</td>
                        <td>${device.mac || 'Нет данных'}</td>
                        <td>${getDeviceTypeName(device.type)}</td>
                        <td><span class="status-${device.status === 'online' ? 'up' : 'down'}">${device.status === 'online' ? 'Онлайн' : 'Офлайн'}</span></td>
                        <td>
                            <button class="btn btn-icon btn-sm" data-action="view" data-id="${device.id}" title="Показать на карте">
                                <span data-icon="eye"></span>
                            </button>
                            <button class="btn btn-icon btn-sm" data-action="ping" data-id="${device.id}" title="Пинг">
                                <span data-icon="activity"></span>
                            </button>
                            <button class="btn btn-icon btn-sm btn-danger" data-action="remove" data-id="${device.id}" title="Удалить">
                                <span data-icon="trash-2"></span>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Нет устройств</td></tr>';
        }
        
        // Если у нас есть система загрузки иконок, инициализируем иконки в таблице
        if (window.IconsLoader) {
            window.IconsLoader.init(tableBody);
        }
        
        // Добавляем обработчики для кнопок
        const actionButtons = tableBody.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const action = button.getAttribute('data-action');
                const deviceId = button.getAttribute('data-id');
                const device = devices.find(d => d.id === deviceId);
                
                if (!device) return;
                
                if (action === 'view') {
                    if (visualizer) {
                        visualizer.selectNode(device);
                    }
                } else if (action === 'ping') {
                    pingDevice(device);
                } else if (action === 'remove') {
                    removeDevice(device);
                }
            });
        });
    }
    
    /**
     * Возвращает название типа устройства
     */
    function getDeviceTypeName(type) {
        const types = {
            'router': 'Маршрутизатор',
            'switch': 'Коммутатор',
            'access_point': 'Точка доступа',
            'server': 'Сервер',
            'device': 'Устройство',
            'internet': 'Интернет'
        };
        
        return types[type] || 'Устройство';
    }
    
    /**
     * Возвращает имя иконки для типа устройства
     */
    function getDeviceIcon(type) {
        const icons = {
            'router': 'router',
            'switch': 'switch',
            'access_point': 'wifi',
            'server': 'server',
            'device': 'device',
            'internet': 'globe'
        };
        
        return icons[type] || 'device';
    }
    
    /**
     * Отправляет ping на устройство
     */
    function pingDevice(device) {
        // Показываем уведомление о начале пинга
        showNotification(`Пингуем устройство ${device.name || device.ip}...`, 'info');
        
        // Отправляем запрос
        fetch(`/api/topology/device/${device.id}/ping`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при выполнении пинга');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showNotification(`Устройство ${device.name || device.ip} доступно (${data.time} мс)`, 'success');
                } else {
                    showNotification(`Устройство ${device.name || device.ip} недоступно`, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка при выполнении пинга:', error);
                showNotification(`Ошибка при выполнении пинга: ${error.message}`, 'error');
            });
    }
    
    /**
     * Удаляет устройство
     */
    function removeDevice(device) {
        if (!confirm(`Вы уверены, что хотите удалить устройство "${device.name || device.ip}" из топологии?`)) {
            return;
        }
        
        fetch(`/api/topology/device/${device.id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при удалении устройства');
                }
                return response.json();
            })
            .then(data => {
                showNotification(`Устройство ${device.name || device.ip} удалено`, 'success');
                
                // Перезагружаем топологию
                initializeTopology();
            })
            .catch(error => {
                console.error('Ошибка при удалении устройства:', error);
                showNotification(`Ошибка при удалении устройства: ${error.message}`, 'error');
            });
    }
    
    /**
     * Запускает сканирование сети
     */
    function startScan() {
        const range = document.getElementById('scanRange').value;
        
        if (!range) {
            alert('Введите диапазон IP-адресов');
            return;
        }
        
        // Скрываем кнопки, показываем прогресс
        startScanBtn.style.display = 'none';
        cancelScanBtn.textContent = 'Отмена';
        document.getElementById('scanProgress').style.display = 'block';
        document.querySelector('.scan-results').style.display = 'none';
        document.getElementById('scanDevicesList').innerHTML = '';
        document.getElementById('scanFoundCount').textContent = '0';
        addDevicesBtn.style.display = 'none';
        
        // Сбрасываем прогресс
        document.querySelector('.progress-bar-value').style.width = '0%';
        document.querySelector('.progress-text').textContent = 'Подготовка к сканированию...';
        
        // Собираем параметры сканирования
        const scanPorts = document.getElementById('scanPorts').checked;
        const scanVendors = document.getElementById('scanVendors').checked;
        const scanServices = document.getElementById('scanServices').checked;
        
        // Отправляем запрос на сканирование
        fetch('/api/topology/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: range,
                options: {
                    scan_ports: scanPorts,
                    detect_vendors: scanVendors,
                    detect_services: scanServices
                }
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при запуске сканирования');
                }
                return response.json();
            })
            .then(data => {
                console.log('Сканирование запущено:', data);
                scanJobId = data.job_id;
                
                // Начинаем проверять статус
                checkScanStatus();
            })
            .catch(error => {
                console.error('Ошибка при запуске сканирования:', error);
                showNotification(`Ошибка при запуске сканирования: ${error.message}`, 'error');
                resetScanForm();
            });
    }
    
    /**
     * Проверяет статус сканирования
     */
    function checkScanStatus() {
        if (!scanJobId) return;
        
        fetch(`/api/topology/scan/${scanJobId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при проверке статуса сканирования');
                }
                return response.json();
            })
            .then(data => {
                console.log('Статус сканирования:', data);
                
                // Обновляем прогресс
                const progressBar = document.querySelector('.progress-bar-value');
                const progressText = document.querySelector('.progress-text');
                
                progressBar.style.width = `${data.progress}%`;
                progressText.textContent = `Сканирование: ${data.progress}%`;
                
                if (data.status === 'completed') {
                    // Сканирование завершено
                    progressText.textContent = 'Сканирование завершено';
                    
                    // Показываем результаты
                    showScanResults(data.devices || []);
                } else if (data.status === 'failed') {
                    // Ошибка сканирования
                    progressText.textContent = `Ошибка: ${data.message || 'Неизвестная ошибка'}`;
                    showNotification(`Ошибка сканирования: ${data.message || 'Неизвестная ошибка'}`, 'error');
                    
                    setTimeout(resetScanForm, 2000);
                } else {
                    // Сканирование продолжается
                    setTimeout(checkScanStatus, 1000);
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке статуса сканирования:', error);
                showNotification(`Ошибка при проверке статуса сканирования: ${error.message}`, 'error');
                resetScanForm();
            });
    }
    
    /**
     * Показывает результаты сканирования
     */
    function showScanResults(devices) {
        const resultsContainer = document.querySelector('.scan-results');
        const devicesList = document.getElementById('scanDevicesList');
        const foundCount = document.getElementById('scanFoundCount');
        
        foundCount.textContent = devices.length;
        
        // Формируем список устройств
        let html = '';
        
        devices.forEach(device => {
            html += `
                <div class="scan-device-item">
                    <label class="checkbox">
                        <input type="checkbox" data-id="${device.id}" checked>
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-label">${device.name || device.ip} (${device.ip})</span>
                    </label>
                </div>
            `;
        });
        
        devicesList.innerHTML = html;
        
        // Показываем результаты и кнопку добавления
        resultsContainer.style.display = 'block';
        addDevicesBtn.style.display = 'inline-block';
        cancelScanBtn.textContent = 'Закрыть';
    }
    
    /**
     * Добавляет выбранные устройства в топологию
     */
    function addDevices() {
        // Получаем выбранные устройства
        const checkboxes = document.querySelectorAll('#scanDevicesList input[type="checkbox"]:checked');
        const deviceIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
        
        if (deviceIds.length === 0) {
            alert('Выберите устройства для добавления');
            return;
        }
        
        // Отправляем запрос на добавление устройств
        fetch('/api/topology/devices/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                devices: deviceIds,
                job_id: scanJobId
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при добавлении устройств');
                }
                return response.json();
            })
            .then(data => {
                showNotification(`Добавлено ${deviceIds.length} устройств`, 'success');
                
                // Закрываем модальное окно
                scanNetworkModal.classList.remove('show');
                
                // Сбрасываем форму
                resetScanForm();
                
                // Перезагружаем топологию
                initializeTopology();
            })
            .catch(error => {
                console.error('Ошибка при добавлении устройств:', error);
                showNotification(`Ошибка при добавлении устройств: ${error.message}`, 'error');
            });
    }
    
    /**
     * Сбрасывает форму сканирования
     */
    function resetScanForm() {
        startScanBtn.style.display = 'inline-block';
        cancelScanBtn.textContent = 'Отмена';
        document.getElementById('scanProgress').style.display = 'none';
        addDevicesBtn.style.display = 'none';
        scanJobId = null;
    }
    
    /**
     * Сохраняет топологию
     */
    function saveTopology() {
        if (!visualizer) {
            showNotification('Визуализатор не инициализирован', 'error');
            return;
        }
        
        // Получаем данные из визуализатора
        const data = visualizer.getData();
        
        // Отправляем запрос на сохранение
        fetch('/api/topology/network', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при сохранении топологии');
                }
                return response.json();
            })
            .then(data => {
                showNotification('Топология успешно сохранена', 'success');
            })
            .catch(error => {
                console.error('Ошибка при сохранении топологии:', error);
                showNotification(`Ошибка при сохранении топологии: ${error.message}`, 'error');
            });
    }
    
    /**
     * Показывает индикатор загрузки
     */
    function showLoader() {
        if (topologyLoader) {
            topologyLoader.style.display = 'flex';
        }
        
        if (topologyError) {
            topologyError.style.display = 'none';
        }
    }
    
    /**
     * Скрывает индикатор загрузки
     */
    function hideLoader() {
        if (topologyLoader) {
            topologyLoader.style.display = 'none';
        }
    }
    
    /**
     * Показывает сообщение об ошибке
     */
    function showError() {
        if (topologyLoader) {
            topologyLoader.style.display = 'none';
        }
        
        if (topologyError) {
            topologyError.style.display = 'flex';
        }
    }
    
    /**
     * Показывает уведомление
     * Использует глобальную функцию showNotification, если она доступна
     */
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // Обработчики событий
    
    // Кнопка закрытия информации об устройстве
    const closeDeviceDetailsBtn = document.getElementById('closeDeviceDetails');
    if (closeDeviceDetailsBtn) {
        closeDeviceDetailsBtn.addEventListener('click', () => {
            deviceDetails.style.display = 'none';
            
            if (visualizer && selectedDevice) {
                visualizer.deselectNode();
            }
        });
    }
    
    // Кнопка повторной попытки загрузки данных
    const retryLoadBtn = document.getElementById('retryLoadBtn');
    if (retryLoadBtn) {
        retryLoadBtn.addEventListener('click', initializeTopology);
    }
    
    // Кнопка сканирования сети
    if (scanNetworkBtn) {
        scanNetworkBtn.addEventListener('click', () => {
            scanNetworkModal.classList.add('show');
        });
    }
    
    // Закрытие модального окна сканирования
    if (closeScanModal) {
        closeScanModal.addEventListener('click', () => {
            scanNetworkModal.classList.remove('show');
        });
    }
    
    // Кнопка отмены сканирования
    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => {
            scanNetworkModal.classList.remove('show');
            resetScanForm();
        });
    }
    
    // Кнопка начала сканирования
    if (startScanBtn) {
        startScanBtn.addEventListener('click', startScan);
    }
    
    // Кнопка добавления устройств
    if (addDevicesBtn) {
        addDevicesBtn.addEventListener('click', addDevices);
    }
    
    // Кнопка сохранения топологии
    if (saveTopologyBtn) {
        saveTopologyBtn.addEventListener('click', saveTopology);
    }
    
    // Действия с устройствами
    const pingDeviceBtn = document.getElementById('pingDeviceBtn');
    const scanDeviceBtn = document.getElementById('scanDeviceBtn');
    const removeDeviceBtn = document.getElementById('removeDeviceBtn');
    
    if (pingDeviceBtn) {
        pingDeviceBtn.addEventListener('click', () => {
            if (selectedDevice) {
                pingDevice(selectedDevice);
            }
        });
    }
    
    if (scanDeviceBtn) {
        scanDeviceBtn.addEventListener('click', () => {
            if (selectedDevice && selectedDevice.ip) {
                document.getElementById('scanRange').value = selectedDevice.ip;
                scanNetworkModal.classList.add('show');
            }
        });
    }
    
    if (removeDeviceBtn) {
        removeDeviceBtn.addEventListener('click', () => {
            if (selectedDevice) {
                removeDevice(selectedDevice);
            }
        });
    }
    
    // Закрытие модального окна при клике на фон
    scanNetworkModal.addEventListener('click', (event) => {
        if (event.target === scanNetworkModal || event.target.classList.contains('modal-backdrop')) {
            scanNetworkModal.classList.remove('show');
            resetScanForm();
        }
    });
});