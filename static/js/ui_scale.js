/**
 * UI Scale Manager
 * Управляет масштабом интерфейса
 */

document.addEventListener('DOMContentLoaded', () => {
    initUIScale();
});

/**
 * Инициализация управления масштабом
 */
function initUIScale() {
    // Устанавливаем масштаб из localStorage или значение по умолчанию
    const currentScale = localStorage.getItem('ui_scale') || '100';
    applyScale(currentScale);
    
    // Создаем панель управления масштабом
    createScaleControl();
}

/**
 * Создание элементов управления масштабом
 */
function createScaleControl() {
    // Проверяем, существует ли уже панель
    if (document.getElementById('scale-control')) {
        return;
    }
    
    // Создаем контейнер
    const container = document.createElement('div');
    container.id = 'scale-control';
    container.className = 'scale-control';
    
    // Добавляем кнопки масштабирования
    container.innerHTML = `
        <button class="scale-btn" data-scale="80" title="Очень компактный режим">
            <i data-feather="minus-circle"></i>
        </button>
        <button class="scale-btn" data-scale="90" title="Компактный режим">
            <i data-feather="minus"></i>
        </button>
        <button class="scale-btn" data-scale="100" title="Стандартный размер">
            <i data-feather="maximize"></i>
        </button>
        <button class="scale-btn" data-scale="110" title="Увеличенный режим">
            <i data-feather="plus"></i>
        </button>
        <button class="scale-btn" data-scale="120" title="Крупный режим">
            <i data-feather="plus-circle"></i>
        </button>
    `;
    
    // Добавляем панель на страницу
    document.body.appendChild(container);
    
    // Обновляем иконки Feather
    feather.replace();
    
    // Подсвечиваем текущий масштаб
    highlightCurrentScale();
    
    // Добавляем обработчики событий
    const scaleButtons = document.querySelectorAll('.scale-btn');
    scaleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const scale = btn.getAttribute('data-scale');
            applyScale(scale);
            localStorage.setItem('ui_scale', scale);
            highlightCurrentScale();
        });
    });
}

/**
 * Применение масштаба к документу
 * @param {string} scale - Значение масштаба в процентах
 */
function applyScale(scale) {
    // Удаляем все классы масштаба
    document.documentElement.classList.remove(
        'scale-80', 'scale-90', 'scale-100', 'scale-110', 'scale-120'
    );
    
    // Добавляем нужный класс
    document.documentElement.classList.add(`scale-${scale}`);
}

/**
 * Подсвечивает кнопку текущего масштаба
 */
function highlightCurrentScale() {
    const currentScale = localStorage.getItem('ui_scale') || '100';
    
    // Снимаем активный класс со всех кнопок
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Добавляем активный класс нужной кнопке
    const activeBtn = document.querySelector(`.scale-btn[data-scale="${currentScale}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}