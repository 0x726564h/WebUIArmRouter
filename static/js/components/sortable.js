/**
 * Sortable.js - Simple drag-and-drop sorting for card elements
 * This component allows cards to be reordered by drag-and-drop
 */

class Sortable {
    /**
     * Initialize the sortable component
     * @param {string} containerSelector - CSS selector for the container
     * @param {string} itemSelector - CSS selector for sortable items
     * @param {string} handleSelector - CSS selector for drag handle (optional)
     * @param {function} onSort - Callback function called after sorting (optional)
     */
    constructor(containerSelector, itemSelector, handleSelector = null, onSort = null) {
        this.container = document.querySelector(containerSelector);
        this.itemSelector = itemSelector;
        this.handleSelector = handleSelector;
        this.onSort = onSort;
        this.draggedItem = null;
        this.placeholder = null;
        this.items = [];
        this.initialIndex = -1;
        this.currentIndex = -1;
        
        if (this.container) {
            this.init();
        }
    }
    
    /**
     * Initialize the sortable functionality
     */
    init() {
        // Add sortable class to container
        this.container.classList.add('sortable-grid');
        
        // Get all items
        this.refreshItems();
        
        // Add event listeners for mouse and touch events
        this.addEventListeners();
    }
    
    /**
     * Refresh the items list
     */
    refreshItems() {
        this.items = Array.from(this.container.querySelectorAll(this.itemSelector));
        
        // Add draggable class to items
        this.items.forEach(item => {
            item.classList.add('draggable');
            
            // Store position for potential programmatic saving
            const rect = item.getBoundingClientRect();
            item.dataset.posX = rect.left;
            item.dataset.posY = rect.top;
        });
    }
    
    /**
     * Add event listeners to handle drag and drop
     */
    addEventListeners() {
        this.items.forEach(item => {
            const handle = this.handleSelector ? item.querySelector(this.handleSelector) : item;
            
            if (handle) {
                handle.addEventListener('mousedown', this.onDragStart.bind(this, item));
                handle.addEventListener('touchstart', this.onDragStart.bind(this, item), { passive: false });
            }
        });
        
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
        document.addEventListener('touchend', this.onDragEnd.bind(this));
    }
    
    /**
     * Handle the start of dragging
     * @param {HTMLElement} item - The item being dragged
     * @param {Event} e - The event object
     */
    onDragStart(item, e) {
        if (e.type === 'touchstart') {
            e.preventDefault(); // Prevent scrolling on touch devices
        }
        
        // Only start drag with left mouse button
        if (e.type === 'mousedown' && e.button !== 0) {
            return;
        }
        
        this.draggedItem = item;
        this.initialIndex = this.items.indexOf(item);
        this.currentIndex = this.initialIndex;
        
        // Create placeholder
        const rect = item.getBoundingClientRect();
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'placeholder';
        this.placeholder.style.width = rect.width + 'px';
        this.placeholder.style.height = rect.height + 'px';
        
        // Add dragging class to item
        item.classList.add('dragging');
        
        // Store initial mouse/touch position
        this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        this.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        // Store initial element position
        const itemRect = item.getBoundingClientRect();
        this.offsetX = this.startX - itemRect.left;
        this.offsetY = this.startY - itemRect.top;
        
        // Set initial position
        this.setDraggedPosition(this.startX, this.startY);
        
        // Insert placeholder
        item.parentNode.insertBefore(this.placeholder, item.nextSibling);
        
        // Make item fixed position
        item.style.position = 'fixed';
        item.style.zIndex = '1000';
        item.style.width = rect.width + 'px';
    }
    
    /**
     * Handle dragging movement
     * @param {Event} e - The event object
     */
    onDragMove(e) {
        if (!this.draggedItem) return;
        
        e.preventDefault(); // Prevent scrolling
        
        // Get current position
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        // Move the dragged item
        this.setDraggedPosition(clientX, clientY);
        
        // Check if we need to move placeholder
        this.updatePlaceholderPosition(clientX, clientY);
    }
    
    /**
     * Handle the end of dragging
     */
    onDragEnd() {
        if (!this.draggedItem) return;
        
        // Remove dragging class
        this.draggedItem.classList.remove('dragging');
        
        // Reset styles
        this.draggedItem.style.position = '';
        this.draggedItem.style.top = '';
        this.draggedItem.style.left = '';
        this.draggedItem.style.zIndex = '';
        this.draggedItem.style.width = '';
        
        // Move the actual element to the placeholder position
        if (this.placeholder.parentNode) {
            this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
        
        // Call onSort callback if positions changed
        if (this.onSort && this.initialIndex !== this.currentIndex) {
            this.onSort(this.initialIndex, this.currentIndex);
        }
        
        // Reset state
        this.draggedItem = null;
        this.placeholder = null;
        
        // Refresh items to update their order
        this.refreshItems();
    }
    
    /**
     * Set the position of the dragged item
     * @param {number} clientX - The x position
     * @param {number} clientY - The y position
     */
    setDraggedPosition(clientX, clientY) {
        if (!this.draggedItem) return;
        
        // Calculate position
        const left = clientX - this.offsetX;
        const top = clientY - this.offsetY;
        
        // Apply position
        this.draggedItem.style.left = left + 'px';
        this.draggedItem.style.top = top + 'px';
    }
    
    /**
     * Update the position of the placeholder based on dragged item
     * @param {number} clientX - The x position
     * @param {number} clientY - The y position 
     */
    updatePlaceholderPosition(clientX, clientY) {
        // Get all potential drop targets (all items except the dragged one)
        const targets = this.items.filter(item => item !== this.draggedItem);
        
        // Find the item we're hovering over
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const rect = target.getBoundingClientRect();
            
            // Check if cursor is over this item
            if (clientX >= rect.left && clientX <= rect.right && 
                clientY >= rect.top && clientY <= rect.bottom) {
                
                // Determine if we should place before or after
                const isBeforeTarget = clientY < rect.top + rect.height / 2;
                
                if (isBeforeTarget) {
                    target.parentNode.insertBefore(this.placeholder, target);
                } else {
                    target.parentNode.insertBefore(this.placeholder, target.nextSibling);
                }
                
                // Update current index
                this.currentIndex = this.getPlaceholderIndex();
                return;
            }
        }
    }
    
    /**
     * Get the current index of the placeholder
     * @returns {number} The current index
     */
    getPlaceholderIndex() {
        const children = Array.from(this.container.children);
        return children.indexOf(this.placeholder);
    }
    
    /**
     * Save the current order of items
     * @returns {Array} Array of item element ids in current order
     */
    saveOrder() {
        // Get all items in their current order
        const currentItems = Array.from(this.container.querySelectorAll(this.itemSelector));
        
        // Return array of IDs
        return currentItems.map(item => item.id || item.dataset.id);
    }
}