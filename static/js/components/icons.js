/**
 * Компонент с иконками для ArmRouter
 * Основан на SVG и Feather Icons (https://feathericons.com/)
 */

// Явно объявляем глобальную переменную
window.Icons = (function() {
    // Набор иконок (SVG пути)
    const iconSet = {
        // Основные иконки навигации
        dashboard: {
            path: 'M3 3h7v9h-7V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zm-11 5h7v4h-7v-4z',
            viewBox: '0 0 24 24'
        },
        ethernet: {
            path: 'M7 3h10v4h-2v10H9V7H7V3zm2 4h6v8h-6V7z',
            viewBox: '0 0 24 24'
        },
        wifi: {
            path: 'M12 6c-3.3 0-6.3 1.3-8.5 3.5l8.5 10.5 8.5-10.5c-2.2-2.2-5.2-3.5-8.5-3.5zm0 2c2.2 0 4.2.9 5.7 2.3L12 17.8l-5.7-7.5C7.8 8.9 9.8 8 12 8z',
            viewBox: '0 0 24 24'
        },
        firewall: {
            path: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6z',
            viewBox: '0 0 24 24'
        },
        vpn: {
            path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
            viewBox: '0 0 24 24'
        },
        routing: {
            path: 'M3 3h18v2H3V3zm0 16h18v2H3v-2zm8-8h10v2H11v-2zm0-4h10v2H11V7zm-8 4h5v4H3v-4z',
            viewBox: '0 0 24 24'
        },
        settings: {
            path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
            viewBox: '0 0 24 24'
        },
        server: {
            path: 'M20 2a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h16zm-4 2.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM18 7a1 1 0 100-2 1 1 0 000 2zM4 14a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2H4zm16 3a1 1 0 10-2 0 1 1 0 002 0zm-6-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
            viewBox: '0 0 24 24'
        },
        
        // Действия и кнопки
        refresh: {
            path: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
            viewBox: '0 0 24 24'
        },
        menu: {
            path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
            viewBox: '0 0 24 24'
        },
        sun: {
            path: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
            viewBox: '0 0 24 24'
        },
        moon: {
            path: 'M9.37 5.51c-.18.64-.27 1.31-.27 1.99 0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
            viewBox: '0 0 24 24'
        },
        search: {
            path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
            viewBox: '0 0 24 24'
        },
        plus: {
            path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
            viewBox: '0 0 24 24'
        },
        save: {
            path: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
            viewBox: '0 0 24 24'
        },
        edit: {
            path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
            viewBox: '0 0 24 24'
        },
        delete: {
            path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
            viewBox: '0 0 24 24'
        },
        'chevron-down': {
            path: 'M12 21l-12-18h24z',
            viewBox: '0 0 24 24'
        },
        'chevron-up': {
            path: 'M12 3l12 18h-24z',
            viewBox: '0 0 24 24'
        },
        'chevron-left': {
            path: 'M15 3l-12 12 12 12',
            viewBox: '0 0 24 24'
        },
        'chevron-right': {
            path: 'M9 3l12 12-12 12',
            viewBox: '0 0 24 24'
        },
        expand: {
            path: 'M21 21H3V3h18v18zM7 15l5-5 5 5H7z',
            viewBox: '0 0 24 24'
        },
        collapse: {
            path: 'M21 21H3V3h18v18zM7 9l5 5 5-5H7z',
            viewBox: '0 0 24 24'
        },
        loader: {
            path: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
            viewBox: '0 0 24 24'
        },
        'maximize-2': {
            path: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
            viewBox: '0 0 24 24'
        },
        'minimize-2': {
            path: 'M4 14h6v6M14 4h6v6M3 21l7-7M21 3l-7 7',
            viewBox: '0 0 24 24'
        },
        'check-circle': {
            path: 'M22 11.08V12a10 10 0 11-5.93-9.14 M9 11l3 3L22 4',
            viewBox: '0 0 24 24'
        },
        'x': {
            path: 'M18 6L6 18M6 6l12 12',
            viewBox: '0 0 24 24'
        },
        'info': {
            path: 'M12 16v-4M12 8h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z',
            viewBox: '0 0 24 24'
        },
        'info-circle': {
            path: 'M12 16v-4M12 8h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z',
            viewBox: '0 0 24 24'
        },
        'alert-circle': {
            path: 'M12 8v4m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z',
            viewBox: '0 0 24 24'
        }
    };

    /**
     * Создать иконку
     * @param {string} name - Имя иконки
     * @param {object} options - Дополнительные опции (size, color, classes)
     * @returns {Element} SVG элемент
     */
    function create(name, options = {}) {
        const defaultOptions = {
            size: 24,
            color: 'currentColor',
            classes: []
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        // Проверка наличия иконки
        let iconData = iconSet[name];
        if (!iconData) {
            console.warn(`Иконка "${name}" не найдена в наборе.`);
            // Использовать заглушку или исправить имя (возможная опечатка)
            const similarIcons = Object.keys(iconSet).filter(key => 
                key.includes(name) || name.includes(key)
            );
            
            if (similarIcons.length > 0) {
                // Используем похожую иконку
                iconData = iconSet[similarIcons[0]];
                console.info(`Используем похожую иконку: ${similarIcons[0]}`);
            } else {
                // Используем заглушку
                iconData = {
                    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
                    viewBox: '0 0 24 24'
                };
            }
        }

        // Создаем SVG элемент
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', mergedOptions.size);
        svg.setAttribute('height', mergedOptions.size);
        svg.setAttribute('viewBox', iconData.viewBox || '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', mergedOptions.color);
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        
        // Добавляем классы
        svg.classList.add('icon', `icon-${name}`);
        mergedOptions.classes.forEach(cls => svg.classList.add(cls));

        // Проверяем, содержит ли путь пробелы (несколько путей)
        const paths = iconData.path.split(/(?=[A-Z])/g).join(' ').split(/\s+(?=[A-Z])/);
        
        if (paths.length > 1) {
            // Несколько путей - создаем отдельные элементы path
            paths.forEach(path => {
                if (path.trim()) {
                    const pathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathElem.setAttribute('d', path.trim());
                    pathElem.setAttribute('stroke', mergedOptions.color);
                    pathElem.setAttribute('fill', 'none');
                    svg.appendChild(pathElem);
                }
            });
        } else {
            // Один путь
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', iconData.path);
            
            // Определяем, должен ли путь быть заполнен или обведен
            const outlineIcons = ['check-circle', 'x', 'info', 'info-circle', 'alert-circle', 'loader', 'refresh'];
            if (outlineIcons.includes(name) || name.includes('circle') || name.includes('chevron')) {
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', mergedOptions.color);
            } else {
                path.setAttribute('fill', mergedOptions.color);
                path.setAttribute('stroke', 'none');
            }
            
            svg.appendChild(path);
        }
        
        return svg;
    }

    /**
     * Получить HTML строку для иконки
     * @param {string} name - Имя иконки
     * @param {object} options - Дополнительные опции (size, color, classes)
     * @returns {string} HTML строка
     */
    function getHTML(name, options = {}) {
        const iconElem = create(name, options);
        return iconElem.outerHTML;
    }

    /**
     * Создать иконку загрузки для замены стандартных индикаторов загрузки
     * @returns {void}
     */
    function replaceLoaders() {
        const loaders = document.querySelectorAll('.loading-spinner i[data-feather="loader"]');
        
        loaders.forEach(loader => {
            const parent = loader.parentNode;
            const size = loader.getAttribute('width') || 24;
            
            // Создаем новую иконку
            const newLoader = document.createElement('span');
            newLoader.setAttribute('data-icon', 'refresh');
            newLoader.setAttribute('data-icon-size', size);
            newLoader.classList.add('rotating');
            
            // Заменяем старую иконку
            parent.replaceChild(newLoader, loader);
        });
    }
    
    /**
     * Заменить элементы с атрибутом data-icon на иконки
     * Например: <span data-icon="home" data-icon-size="20" data-icon-color="#f00"></span>
     */
    function replaceAll() {
        const elements = document.querySelectorAll('[data-icon]');
        
        elements.forEach(element => {
            const name = element.getAttribute('data-icon');
            const size = element.getAttribute('data-icon-size') || 24;
            const color = element.getAttribute('data-icon-color') || 'currentColor';
            
            const options = {
                size: parseInt(size, 10),
                color: color,
                classes: []
            };
            
            const icon = create(name, options);
            
            // Очищаем содержимое элемента и добавляем иконку
            element.innerHTML = '';
            element.appendChild(icon);
        });
    }

    // Инициализация, когда DOM загружен
    document.addEventListener('DOMContentLoaded', function() {
        // Добавляем небольшую задержку, чтобы дать Feather icons загрузиться
        setTimeout(() => {
            replaceAll();
            replaceLoaders();
        }, 100);
        
        // Добавляем обработчик для мутаций DOM, чтобы заменять иконки динамически
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    const icons = mutation.target.querySelectorAll('[data-icon]:not(.icon-replaced)');
                    if (icons.length > 0) {
                        replaceAll();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    // Публичный API
    return {
        create: create,
        getHTML: getHTML,
        replaceAll: replaceAll,
        replaceLoaders: replaceLoaders
    };
})();