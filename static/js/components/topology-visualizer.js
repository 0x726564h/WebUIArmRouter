/**
 * ArmRouter - Визуализатор сетевой топологии на основе D3.js
 * 
 * Этот компонент предоставляет интерактивную визуализацию сетевой топологии,
 * позволяя перемещать узлы, масштабировать и взаимодействовать с элементами сети.
 */

class TopologyVisualizer {
    /**
     * Создает экземпляр визуализатора топологии
     * @param {HTMLElement} container - Контейнер для визуализации
     * @param {Object} options - Настройки визуализатора
     */
    constructor(container, options = {}) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight || 500;
        
        // Настройки
        this.options = {
            // Размер узлов
            nodeRadius: options.nodeRadius || 20,
            // Расстояние между узлами
            linkDistance: options.linkDistance || 200,
            // Сила заряда (отталкивание узлов)
            chargeStrength: options.chargeStrength || -3000,
            // Тема (light/dark)
            theme: options.theme || 'light',
            // Максимальная ширина линии
            maxLinkWidth: options.maxLinkWidth || 8,
            // Цвета линий для различных скоростей
            linkColors: options.linkColors || {
                active: {
                    light: '#4285F4',
                    dark: '#5C9AFF'
                },
                inactive: {
                    light: '#CCC',
                    dark: '#555'
                }
            },
            // Цвета узлов для различных типов устройств
            nodeColors: options.nodeColors || {
                router: {
                    light: '#4285F4',
                    dark: '#5C9AFF'
                },
                switch: {
                    light: '#34A853',
                    dark: '#4DC975'
                },
                access_point: {
                    light: '#FBBC05',
                    dark: '#FFCE35'
                },
                server: {
                    light: '#EA4335',
                    dark: '#FF6B60'
                },
                device: {
                    light: '#9E9E9E',
                    dark: '#BDBDBD'
                },
                internet: {
                    light: '#673AB7',
                    dark: '#8959F6'
                }
            },
            // Параметры анимации
            animation: {
                duration: 400,
                easing: d3.easeCubicOut
            }
        };
        
        // Расширяем настройки пользователя
        Object.assign(this.options, options);
        
        // Данные
        this.nodes = [];
        this.links = [];
        this.simulation = null;
        this.transform = d3.zoomIdentity;
        this.selectedNode = null;
        
        // Создаем D3 элементы
        this.initializeSVG();
        
        // Инициализируем физическую симуляцию
        this.initializeSimulation();
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Инициализирует SVG контейнер и слои
     */
    initializeSVG() {
        // Основной SVG элемент
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'topology-svg')
            .on('click', this.handleBackgroundClick.bind(this));
        
        // Слой для зума и перетаскивания
        this.vizGroup = this.svg.append('g')
            .attr('class', 'topology-viz-group');
        
        // Слои для элементов
        this.linksGroup = this.vizGroup.append('g')
            .attr('class', 'topology-links');
            
        this.nodesGroup = this.vizGroup.append('g')
            .attr('class', 'topology-nodes');
            
        // Добавляем обработчик зума
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 3])
            .on('zoom', this.handleZoom.bind(this));
            
        this.svg.call(this.zoom);
    }
    
    /**
     * Инициализирует физическую симуляцию
     */
    initializeSimulation() {
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(this.options.linkDistance))
            .force('charge', d3.forceManyBody().strength(this.options.chargeStrength))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(this.options.nodeRadius * 1.5))
            .on('tick', this.handleTick.bind(this));
    }
    
    /**
     * Устанавливает данные для визуализации
     * @param {Array} nodes - Массив узлов
     * @param {Array} links - Массив связей
     */
    setData(nodes, links) {
        this.nodes = JSON.parse(JSON.stringify(nodes));
        this.links = JSON.parse(JSON.stringify(links));
        
        // Обрабатываем связи
        this.links.forEach(link => {
            // Если в ссылке указаны идентификаторы, но не указаны объекты source/target
            if (typeof link.source === 'string' || typeof link.source === 'number') {
                const sourceNode = this.nodes.find(node => node.id === link.source);
                const targetNode = this.nodes.find(node => node.id === link.target);
                
                if (sourceNode && targetNode) {
                    link.sourceNode = sourceNode;
                    link.targetNode = targetNode;
                }
            }
        });
        
        // Привязываем данные к D3 и обновляем визуализацию
        this.updateVisualization();
    }
    
    /**
     * Обновляет визуализацию
     */
    updateVisualization() {
        // Обновляем силы симуляции
        this.simulation.force('link').links(this.links);
        this.simulation.nodes(this.nodes);
        
        // Обновляем позиции, если они уже были заданы
        this.nodes.forEach(node => {
            if (node.x && node.y) {
                node.fx = node.x;
                node.fy = node.y;
            }
        });
        
        // Обновляем узлы
        this.updateNodes();
        
        // Обновляем связи
        this.updateLinks();
        
        // Перезапускаем симуляцию
        this.simulation.alpha(0.3).restart();
    }
    
    /**
     * Обновляет узлы визуализации
     */
    updateNodes() {
        // Связываем данные узлов с элементами группы
        const nodeGroups = this.nodesGroup
            .selectAll('.node-group')
            .data(this.nodes, d => d.id);
        
        // Удаляем отсутствующие узлы
        nodeGroups.exit().remove();
        
        // Создаем новые узлы
        const newNodeGroups = nodeGroups.enter()
            .append('g')
            .attr('class', 'node-group')
            .attr('data-id', d => d.id)
            .on('click', this.handleNodeClick.bind(this))
            .call(d3.drag()
                .on('start', this.handleDragStart.bind(this))
                .on('drag', this.handleDrag.bind(this))
                .on('end', this.handleDragEnd.bind(this))
            );
        
        // Добавляем круг для узла
        newNodeGroups.append('circle')
            .attr('r', this.options.nodeRadius)
            .attr('class', 'node-circle')
            .style('fill', d => this.getNodeColor(d))
            .style('stroke', d => d3.color(this.getNodeColor(d)).darker(0.5))
            .style('stroke-width', 2);
        
        // Добавляем иконку для узла
        newNodeGroups.append('text')
            .attr('class', 'node-icon')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-family', 'sans-serif')
            .style('font-size', `${this.options.nodeRadius}px`)
            .style('fill', '#FFF')
            .style('pointer-events', 'none')
            .text(d => this.getNodeIcon(d));
        
        // Добавляем метку с именем узла
        newNodeGroups.append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', this.options.nodeRadius * 1.8)
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .style('fill', this.options.theme === 'dark' ? '#EEE' : '#333')
            .style('pointer-events', 'none')
            .text(d => d.name || d.id);
        
        // Добавляем статус узла (если он онлайн/офлайн)
        newNodeGroups.append('circle')
            .attr('class', 'node-status')
            .attr('r', 4)
            .attr('cx', this.options.nodeRadius * 0.8)
            .attr('cy', -this.options.nodeRadius * 0.8)
            .style('fill', d => d.status === 'online' ? '#34A853' : '#EA4335')
            .style('stroke', this.options.theme === 'dark' ? '#333' : '#FFF')
            .style('stroke-width', 1);
        
        // Объединяем выборки для обновления существующих узлов
        this.nodeGroups = newNodeGroups.merge(nodeGroups);
        
        // Обновляем стили для всех узлов
        this.nodeGroups.select('.node-circle')
            .style('fill', d => this.getNodeColor(d))
            .style('stroke', d => d3.color(this.getNodeColor(d)).darker(0.5));
            
        this.nodeGroups.select('.node-icon')
            .text(d => this.getNodeIcon(d));
            
        this.nodeGroups.select('.node-label')
            .text(d => d.name || d.id)
            .style('fill', this.options.theme === 'dark' ? '#EEE' : '#333');
            
        this.nodeGroups.select('.node-status')
            .style('fill', d => d.status === 'online' ? '#34A853' : '#EA4335')
            .style('stroke', this.options.theme === 'dark' ? '#333' : '#FFF');
    }
    
    /**
     * Обновляет связи визуализации
     */
    updateLinks() {
        // Связываем данные связей с элементами группы
        const linkGroups = this.linksGroup
            .selectAll('.link-group')
            .data(this.links, (d, i) => `${d.source.id || d.source}-${d.target.id || d.target}-${i}`);
        
        // Удаляем отсутствующие связи
        linkGroups.exit().remove();
        
        // Создаем новые связи
        const newLinkGroups = linkGroups.enter()
            .append('g')
            .attr('class', 'link-group');
        
        // Добавляем основную линию связи
        newLinkGroups.append('line')
            .attr('class', 'link-line')
            .style('stroke', d => this.getLinkColor(d))
            .style('stroke-width', d => this.getLinkWidth(d))
            .style('stroke-opacity', 0.7);
        
        // Добавляем индикатор направления данных для некоторых типов связей
        newLinkGroups.filter(d => d.dataFlow && d.dataFlow !== 'none')
            .append('path')
            .attr('class', 'link-arrow')
            .attr('marker-end', d => `url(#arrow-${d.status || 'active'})`)
            .style('fill', 'none')
            .style('stroke', d => this.getLinkColor(d))
            .style('stroke-width', d => this.getLinkWidth(d) * 0.8)
            .style('stroke-opacity', 0.5);
        
        // Объединяем выборки для обновления существующих связей
        this.linkGroups = newLinkGroups.merge(linkGroups);
        
        // Обновляем стили для всех связей
        this.linkGroups.select('.link-line')
            .style('stroke', d => this.getLinkColor(d))
            .style('stroke-width', d => this.getLinkWidth(d));
            
        this.linkGroups.select('.link-arrow')
            .style('stroke', d => this.getLinkColor(d))
            .style('stroke-width', d => this.getLinkWidth(d) * 0.8);
        
        // Создаем маркеры для стрелок направления данных
        this.createArrowMarkers();
    }
    
    /**
     * Создает маркеры для стрелок направления данных
     */
    createArrowMarkers() {
        // Удаляем существующие маркеры
        this.svg.selectAll('defs').remove();
        
        // Создаем новые маркеры
        const defs = this.svg.append('defs');
        
        // Активный маркер
        defs.append('marker')
            .attr('id', 'arrow-active')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', this.options.linkColors.active[this.options.theme]);
        
        // Неактивный маркер
        defs.append('marker')
            .attr('id', 'arrow-inactive')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', this.options.linkColors.inactive[this.options.theme]);
    }
    
    /**
     * Обработчик тика симуляции
     */
    handleTick() {
        if (!this.linkGroups || !this.nodeGroups) return;
        
        // Обновляем позиции связей
        this.linkGroups.select('.link-line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        // Обновляем позиции стрелок направления данных
        this.linkGroups.select('.link-arrow')
            .attr('d', d => {
                // Вычисляем направление стрелки в зависимости от типа потока данных
                let sourceX = d.source.x;
                let sourceY = d.source.y;
                let targetX = d.target.x;
                let targetY = d.target.y;
                
                if (d.dataFlow === 'incoming') {
                    // Меняем направление стрелки
                    [sourceX, targetX] = [targetX, sourceX];
                    [sourceY, targetY] = [targetY, sourceY];
                }
                
                return `M${sourceX},${sourceY} Q${(sourceX + targetX) / 2 + 20},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
            });
        
        // Обновляем позиции узлов
        this.nodeGroups
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }
    
    /**
     * Обработчик начала перетаскивания узла
     */
    handleDragStart(event, d) {
        if (!event.active) {
            this.simulation.alphaTarget(0.3).restart();
        }
        
        d.fx = d.x;
        d.fy = d.y;
    }
    
    /**
     * Обработчик перетаскивания узла
     */
    handleDrag(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    /**
     * Обработчик окончания перетаскивания узла
     */
    handleDragEnd(event, d) {
        if (!event.active) {
            this.simulation.alphaTarget(0);
        }
        
        // Сохраняем позицию
        d.x = d.fx;
        d.y = d.fy;
    }
    
    /**
     * Обработчик клика по узлу
     */
    handleNodeClick(event, d) {
        event.stopPropagation();
        
        // Отменяем выбор, если узел уже выбран
        if (this.selectedNode === d) {
            this.deselectNode();
            return;
        }
        
        // Выбираем новый узел
        this.selectNode(d);
    }
    
    /**
     * Обработчик клика по фону
     */
    handleBackgroundClick() {
        this.deselectNode();
    }
    
    /**
     * Обработчик зума
     */
    handleZoom(event) {
        this.transform = event.transform;
        this.vizGroup.attr('transform', event.transform);
    }
    
    /**
     * Обработчик изменения размера окна
     */
    handleResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight || 500;
        
        // Обновляем размер SVG
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Обновляем центр симуляции
        this.simulation.force('center')
            .x(this.width / 2)
            .y(this.height / 2);
        
        // Перезапускаем симуляцию
        this.simulation.alpha(0.3).restart();
    }
    
    /**
     * Выбирает узел и подсвечивает его
     * @param {Object} node - Узел для выбора
     */
    selectNode(node) {
        const nodeId = typeof node === 'string' ? node : node.id;
        const targetNode = this.nodes.find(n => n.id === nodeId);
        
        if (!targetNode) return;
        
        // Отменяем предыдущий выбор
        this.deselectNode();
        
        // Устанавливаем текущий выбранный узел
        this.selectedNode = targetNode;
        
        // Подсвечиваем выбранный узел
        this.nodeGroups
            .filter(d => d.id === nodeId)
            .select('.node-circle')
            .style('stroke-width', 3)
            .style('stroke', '#FF5722');
        
        // Подсвечиваем связанные узлы
        const connectedNodeIds = this.links
            .filter(link => link.source.id === nodeId || link.target.id === nodeId)
            .map(link => link.source.id === nodeId ? link.target.id : link.source.id);
        
        this.nodeGroups
            .filter(d => connectedNodeIds.includes(d.id))
            .select('.node-circle')
            .style('stroke-width', 2)
            .style('stroke', '#FF9800');
        
        // Подсвечиваем связанные линии
        this.linkGroups
            .filter(link => link.source.id === nodeId || link.target.id === nodeId)
            .select('.link-line')
            .style('stroke-opacity', 1)
            .style('stroke-width', d => this.getLinkWidth(d) + 1);
        
        // Генерируем событие выбора узла
        this.container.dispatchEvent(new CustomEvent('node:select', {
            detail: {
                node: targetNode
            }
        }));
        
        // Центрируем выбранный узел
        this.centerNode(targetNode);
    }
    
    /**
     * Отменяет выбор узла
     */
    deselectNode() {
        if (!this.selectedNode) return;
        
        // Сбрасываем подсветку узлов
        this.nodeGroups
            .select('.node-circle')
            .style('stroke-width', 2)
            .style('stroke', d => d3.color(this.getNodeColor(d)).darker(0.5));
        
        // Сбрасываем подсветку линий
        this.linkGroups
            .select('.link-line')
            .style('stroke-opacity', 0.7)
            .style('stroke-width', d => this.getLinkWidth(d));
        
        // Генерируем событие снятия выбора
        this.container.dispatchEvent(new CustomEvent('node:deselect', {
            detail: {
                node: this.selectedNode
            }
        }));
        
        // Сбрасываем выбранный узел
        this.selectedNode = null;
    }
    
    /**
     * Центрирует выбранный узел
     * @param {Object} node - Узел для центрирования
     */
    centerNode(node) {
        const scale = this.transform.k;
        const x = -node.x * scale + this.width / 2;
        const y = -node.y * scale + this.height / 2;
        
        this.svg.transition()
            .duration(this.options.animation.duration)
            .ease(this.options.animation.easing)
            .call(this.zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }
    
    /**
     * Изменяет масштаб визуализации
     * @param {number} factor - Множитель масштаба
     */
    zoom(factor) {
        const currentScale = this.transform.k;
        const newScale = Math.max(0.2, Math.min(3, currentScale * factor));
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.svg.transition()
            .duration(this.options.animation.duration)
            .ease(this.options.animation.easing)
            .call(this.zoom.transform, d3.zoomIdentity
                .translate(this.transform.x, this.transform.y)
                .scale(newScale)
                .translate((1 - factor) * centerX, (1 - factor) * centerY)
            );
    }
    
    /**
     * Сбрасывает масштаб визуализации
     */
    resetZoom() {
        this.svg.transition()
            .duration(this.options.animation.duration)
            .ease(this.options.animation.easing)
            .call(this.zoom.transform, d3.zoomIdentity);
    }
    
    /**
     * Возвращает текущие данные визуализации
     * @returns {Object} Данные узлов и связей
     */
    getData() {
        // Очищаем циклические ссылки
        const nodes = this.nodes.map(node => {
            const { x, y, vx, vy, fx, fy, index, ...rest } = node;
            return {
                ...rest,
                x, y  // Сохраняем только позицию
            };
        });
        
        const links = this.links.map(link => {
            const { source, target, sourceNode, targetNode, index, ...rest } = link;
            return {
                ...rest,
                source: typeof source === 'object' ? source.id : source,
                target: typeof target === 'object' ? target.id : target
            };
        });
        
        return { nodes, links };
    }
    
    /**
     * Возвращает цвет для узла
     * @param {Object} node - Узел
     * @returns {string} Цвет
     */
    getNodeColor(node) {
        const type = node.type || 'device';
        const theme = this.options.theme;
        
        return this.options.nodeColors[type]?.[theme] || 
               this.options.nodeColors.device[theme];
    }
    
    /**
     * Возвращает иконку для узла
     * @param {Object} node - Узел
     * @returns {string} Иконка
     */
    getNodeIcon(node) {
        const type = node.type || 'device';
        
        const icons = {
            'router': '🖧',
            'switch': '🖧',
            'access_point': '📶',
            'server': '🖥️',
            'device': '📱',
            'internet': '🌐'
        };
        
        return icons[type] || icons.device;
    }
    
    /**
     * Возвращает цвет для связи
     * @param {Object} link - Связь
     * @returns {string} Цвет
     */
    getLinkColor(link) {
        const status = link.status || 'active';
        const theme = this.options.theme;
        
        return status === 'active' ? 
               this.options.linkColors.active[theme] : 
               this.options.linkColors.inactive[theme];
    }
    
    /**
     * Возвращает ширину для связи
     * @param {Object} link - Связь
     * @returns {number} Ширина
     */
    getLinkWidth(link) {
        const bandwidth = link.bandwidth || 100;
        const maxBandwidth = 1000; // 1 Гбит/с
        const minWidth = 1;
        
        // Масштабируем ширину линии в зависимости от пропускной способности
        return minWidth + (bandwidth / maxBandwidth) * this.options.maxLinkWidth;
    }
}