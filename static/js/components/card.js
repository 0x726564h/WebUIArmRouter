/**
 * Card.js - Enhanced card component
 * Provides collapsing, expanding and fullscreen functionalities for cards
 */

class Card {
    /**
     * Initialize a card component
     * @param {HTMLElement} cardElement - The card DOM element
     */
    constructor(cardElement) {
        this.card = cardElement;
        this.header = this.card.querySelector('.card-header');
        this.content = this.card.querySelector('.card-content');
        this.isCollapsed = false;
        this.isFullscreen = false;
        
        // Store original styles for fullscreen toggle
        this.originalStyles = {
            position: this.card.style.position,
            top: this.card.style.top, 
            left: this.card.style.left,
            right: this.card.style.right,
            bottom: this.card.style.bottom,
            width: this.card.style.width,
            height: this.card.style.height,
            zIndex: this.card.style.zIndex,
            borderRadius: this.card.style.borderRadius,
            margin: this.card.style.margin
        };
        
        this.originalParent = this.card.parentNode;
        this.originalIndex = Array.from(this.originalParent.children).indexOf(this.card);
        
        this.init();
    }
    
    /**
     * Initialize the card functionality
     */
    init() {
        // Return if header doesn't exist
        if (!this.header) return;
        
        // Create action buttons container if it doesn't exist
        let actionsContainer = this.header.querySelector('.card-header-actions');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'card-header-actions';
            this.header.appendChild(actionsContainer);
        }
        
        // Create collapse toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.className = 'card-toggle';
        this.toggleBtn.innerHTML = '<span data-icon="chevron-up" data-icon-size="16"></span>';
        this.toggleBtn.title = 'Свернуть/Развернуть';
        
        // Create fullscreen toggle button
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.className = 'card-fullscreen';
        this.fullscreenBtn.innerHTML = '<span data-icon="maximize-2" data-icon-size="16"></span>';
        this.fullscreenBtn.title = 'Полноэкранный режим';
        
        // Add buttons to the header
        actionsContainer.appendChild(this.toggleBtn);
        actionsContainer.appendChild(this.fullscreenBtn);
        
        // Add event listeners с stopPropagation для предотвращения всплытия событий
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Останавливаем всплытие события
            e.preventDefault(); // Предотвращаем действия по умолчанию
            this.toggle();
        });
        
        this.fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Останавливаем всплытие события
            e.preventDefault(); // Предотвращаем действия по умолчанию
            this.toggleFullscreen();
        });
        
        // Make header clickable for toggling (except buttons)
        this.header.addEventListener('click', (e) => {
            // Не реагируем на клики внутри .card-header-actions
            if (e.target.closest('.card-header-actions')) return;
            this.toggle();
        });
    }
    
    /**
     * Toggle card collapsed state
     */
    toggle() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }
    
    /**
     * Collapse the card
     */
    collapse() {
        if (this.isCollapsed) return; // Предотвращаем повторное сворачивание
        
        // Сохраняем текущую высоту для анимации
        const currentHeight = this.content.scrollHeight;
        this.content.style.height = currentHeight + 'px';
        
        // Форсируем reflow для анимации
        this.content.offsetHeight;
        
        // Устанавливаем класс collapsed
        this.card.classList.add('collapsed');
        this.isCollapsed = true;
        
        // Меняем иконку
        this.toggleBtn.innerHTML = '<span data-icon="chevron-down" data-icon-size="16"></span>';
        
        // Анимируем высоту до 0
        this.content.style.height = '0';
        this.content.style.opacity = '0';
        
        // Обновляем иконки
        setTimeout(() => {
            // Проверяем наличие Icons API и обновляем иконки
            if (window.Icons && typeof window.Icons.replaceAll === 'function') {
                window.Icons.replaceAll();
            } else if (window.feather) {
                feather.replace();
            }
            
            // ВАЖНО: Не скрываем содержимое полностью, это вызывает проблемы с разворачиванием
            // Вместо этого полагаемся на CSS для скрытия через opacity и height
        }, 10);
        
        // Trigger custom event
        this.card.dispatchEvent(new CustomEvent('card:collapse'));
    }
    
    /**
     * Expand the card
     */
    expand() {
        // Отображаем содержимое, но с нулевой высотой
        this.content.style.display = '';
        this.content.style.height = '0';
        this.content.style.opacity = '0';
        
        // Форсируем reflow
        this.content.offsetHeight;
        
        // Удаляем класс collapsed
        this.card.classList.remove('collapsed');
        this.isCollapsed = false;
        
        // Меняем иконку
        this.toggleBtn.innerHTML = '<span data-icon="chevron-up" data-icon-size="16"></span>';
        
        // Обновляем иконки
        setTimeout(() => {
            // Проверяем наличие Icons API
            const updateIcons = function() {
                if (window.Icons && typeof window.Icons.replaceAll === 'function') {
                    window.Icons.replaceAll();
                } else if (window.feather) {
                    feather.replace();
                } else {
                    console.warn("Не найден модуль для иконок");
                }
            };
            
            // Обновляем иконки
            updateIcons();
            
            // Анимируем до полной высоты
            const scrollHeight = this.content.scrollHeight;
            this.content.style.height = scrollHeight + 'px';
            this.content.style.opacity = '1';
            
            // Убираем фиксированную высоту после анимации
            setTimeout(() => {
                this.content.style.height = '';
            }, 300);
        }, 10);
        
        // Trigger custom event
        this.card.dispatchEvent(new CustomEvent('card:expand'));
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    /**
     * Enter fullscreen mode
     */
    enterFullscreen() {
        // Store the original parent before moving the card
        this.originalParent = this.card.parentNode;
        this.originalIndex = Array.from(this.originalParent.children).indexOf(this.card);
        
        // Add fullscreen class
        this.card.classList.add('fullscreen');
        
        // Change icon
        this.fullscreenBtn.innerHTML = '<span data-icon="minimize-2" data-icon-size="16"></span>';
        
        // Expand if collapsed
        if (this.isCollapsed) {
            this.expand();
        }
        
        this.isFullscreen = true;
        
        // Обновляем иконки, используя нашу новую систему иконок
        const icons = document.querySelectorAll('[data-icon]');
        if (window.Icons && typeof window.Icons.replaceAll === 'function') {
            window.Icons.replaceAll();
        } 
        // Если есть Feather, используем его как запасной вариант
        else if (window.feather) {
            feather.replace();
        }
        
        // Trigger custom event
        this.card.dispatchEvent(new CustomEvent('card:fullscreen'));
    }
    
    /**
     * Exit fullscreen mode
     */
    exitFullscreen() {
        // Remove fullscreen class
        this.card.classList.remove('fullscreen');
        
        // Change icon back
        this.fullscreenBtn.innerHTML = '<span data-icon="maximize-2" data-icon-size="16"></span>';
        
        this.isFullscreen = false;
        
        // Обновляем иконки, используя нашу новую систему иконок
        const icons = document.querySelectorAll('[data-icon]');
        if (window.Icons && typeof window.Icons.replaceAll === 'function') {
            window.Icons.replaceAll();
        } 
        // Если есть Feather, используем его как запасной вариант
        else if (window.feather) {
            feather.replace();
        }
        
        // Trigger custom event
        this.card.dispatchEvent(new CustomEvent('card:exitFullscreen'));
    }
}

/**
 * Initialize all cards on the page
 */
function initCards() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        new Card(card);
    });
}

// Initialize cards when the DOM is loaded
document.addEventListener('DOMContentLoaded', initCards);

// Re-initialize cards when content is dynamically loaded
document.addEventListener('contentLoaded', initCards);