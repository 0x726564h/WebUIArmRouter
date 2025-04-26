/**
 * Компонент уведомлений для ArmRouter
 */

const Notification = (() => {
    // Создаем контейнер для уведомлений, если его еще нет
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Счетчик для уникальных идентификаторов
    let counter = 0;
    
    /**
     * Создать уведомление
     * @param {string} title - Заголовок уведомления
     * @param {string} message - Сообщение уведомления
     * @param {string} type - Тип уведомления: success, error, info, warning
     * @param {number} duration - Продолжительность показа в миллисекундах (0 для постоянного)
     * @returns {string} ID созданного уведомления
     */
    function create(title, message, type = 'info', duration = 5000) {
        const id = `notification-${Date.now()}-${counter++}`;
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type}`;
        
        // Определяем иконку в зависимости от типа
        let iconName = 'info';
        switch (type) {
            case 'success':
                iconName = 'check-circle';
                break;
            case 'error':
                iconName = 'alert-triangle';
                break;
            case 'warning':
                iconName = 'alert-circle';
                break;
            default:
                iconName = 'info';
        }
        
        // Создаем содержимое уведомления
        notification.innerHTML = `
            <span data-icon="${iconName}" data-icon-size="18" class="notification-icon"></span>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Закрыть">
                <span data-icon="x" data-icon-size="14"></span>
            </button>
        `;
        
        // Добавляем в контейнер
        container.appendChild(notification);
        
        // Инициализируем иконки
        if (window.Icons && typeof window.Icons.replaceAll === 'function') {
            window.Icons.replaceAll();
        } else if (window.feather) {
            feather.replace();
        }
        
        // Устанавливаем обработчик для кнопки закрытия
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            remove(id);
        });
        
        // Устанавливаем автоматическое скрытие
        if (duration > 0) {
            setTimeout(() => {
                remove(id);
            }, duration);
        }
        
        return id;
    }
    
    /**
     * Удалить уведомление
     * @param {string} id - ID уведомления для удаления
     */
    function remove(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('slide-out');
            
            // Удаляем элемент после завершения анимации
            notification.addEventListener('animationend', () => {
                notification.remove();
            });
        }
    }
    
    // Публичный API
    return {
        create,
        remove
    };
})();