/**
 * ArmRouter - Основной скрипт для базового функционала интерфейса
 */

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация переменных
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Инициализация компонентов
    initSidebar();
    initThemeToggle();
    
    /**
     * Инициализирует функционал боковой панели
     */
    function initSidebar() {
        // Проверяем, есть ли сохраненное состояние боковой панели
        const sidebarState = localStorage.getItem('sidebarState');
        if (sidebarState === 'collapsed') {
            sidebar.classList.add('collapsed');
        }
        
        // Добавляем обработчик клика на кнопку сворачивания
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Сохраняем состояние
            localStorage.setItem('sidebarState', 
                sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
        });
    }
    
    /**
     * Инициализирует функционал переключения темы
     */
    function initThemeToggle() {
        // Проверяем, есть ли сохраненная тема
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            body.className = savedTheme;
            updateThemeIcon();
        }
        
        // Добавляем обработчик клика на кнопку переключения темы
        themeToggle.addEventListener('click', function() {
            // Переключаем тему
            if (body.classList.contains('light-theme')) {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
            } else {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
            }
            
            // Обновляем иконку
            updateThemeIcon();
            
            // Создаем событие смены темы
            const event = new CustomEvent('theme:change', {
                detail: {
                    theme: body.classList.contains('dark-theme') ? 'dark' : 'light'
                }
            });
            
            document.dispatchEvent(event);
        });
    }
    
    /**
     * Обновляет иконку переключения темы
     */
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('[data-icon]');
        if (body.classList.contains('dark-theme')) {
            icon.setAttribute('data-icon', 'sun');
        } else {
            icon.setAttribute('data-icon', 'moon');
        }
    }
});