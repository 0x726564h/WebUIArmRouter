/**
 * Theme Switcher
 * Handles theme switching functionality
 */

// Available themes
const THEMES = {
    LIGHT: 'theme-light',
    DARK: 'theme-dark',
    HIGH_CONTRAST: 'theme-high-contrast'
};

// Current theme (default: dark)
let currentTheme = THEMES.DARK;

/**
 * Initialize theme switcher
 */
function initThemeSwitcher() {
    // Get theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    
    // Load saved theme preference
    loadThemePreference();
    
    // Add click event listener
    themeToggle.addEventListener('click', () => {
        // Toggle between themes
        switch (currentTheme) {
            case THEMES.LIGHT:
                setTheme(THEMES.DARK);
                break;
            case THEMES.DARK:
                setTheme(THEMES.LIGHT);
                break;
            default:
                setTheme(THEMES.DARK);
        }
    });
    
    // Update toggle button icon based on current theme
    updateThemeToggleIcon();
}

/**
 * Set theme
 * @param {string} theme - Theme to set
 */
function setTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove(THEMES.LIGHT, THEMES.DARK, THEMES.HIGH_CONTRAST);
    
    // Add new theme class
    if (theme) {
        document.body.classList.add(theme);
    }
    
    // Update current theme
    currentTheme = theme;
    
    // Save theme preference
    saveThemePreference();
    
    // Update toggle button icon
    updateThemeToggleIcon();
}

/**
 * Load theme preference from localStorage
 */
function loadThemePreference() {
    const savedTheme = localStorage.getItem('armrouter-theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Check if user prefers dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme(THEMES.DARK);
        } else {
            setTheme(THEMES.LIGHT);
        }
    }
}

/**
 * Save theme preference to localStorage
 */
function saveThemePreference() {
    localStorage.setItem('armrouter-theme', currentTheme);
}

/**
 * Update theme toggle button icon based on current theme
 */
function updateThemeToggleIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Clear existing icon
    themeToggle.innerHTML = '';
    
    // Add new icon based on current theme
    if (currentTheme === THEMES.DARK) {
        themeToggle.innerHTML = '<span data-icon="sun" data-icon-size="18"></span>';
    } else {
        themeToggle.innerHTML = '<span data-icon="moon" data-icon-size="18"></span>';
    }
    
    // Замена иконок с помощью нашего компонента Icons
    if (window.Icons && typeof window.Icons.replaceAll === 'function') {
        window.Icons.replaceAll();
    } else {
        // Fallback для совместимости
        feather.replace();
    }
}
