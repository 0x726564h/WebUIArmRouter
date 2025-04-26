/**
 * Form Validator
 * Provides form validation functionality
 */

class FormValidator {
    /**
     * Create a new form validator
     * @param {HTMLFormElement} form - Form element to validate
     * @param {object} rules - Validation rules
     */
    constructor(form, rules) {
        this.form = form;
        this.rules = rules;
        this.errors = {};
        
        this.setupFormSubmit();
    }
    
    /**
     * Set up form submit handler
     */
    setupFormSubmit() {
        this.form.addEventListener('submit', (event) => {
            // Prevent default form submission
            event.preventDefault();
            
            // Validate form
            if (this.validate()) {
                // If validation succeeds, create form data object
                const formData = this.getFormData();
                
                // Call onSubmit callback if defined
                if (typeof this.onSubmit === 'function') {
                    this.onSubmit(formData);
                }
            }
        });
    }
    
    /**
     * Set submit callback
     * @param {function} callback - Function to call on successful validation
     */
    setSubmitCallback(callback) {
        this.onSubmit = callback;
    }
    
    /**
     * Get form data as object
     * @returns {object} - Form data
     */
    getFormData() {
        const formData = {};
        const elements = this.form.elements;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Skip elements without name or submit buttons
            if (!element.name || element.type === 'submit') continue;
            
            // Handle different input types
            if (element.type === 'checkbox') {
                formData[element.name] = element.checked;
            } else if (element.type === 'radio') {
                if (element.checked) {
                    formData[element.name] = element.value;
                }
            } else if (element.type === 'select-multiple') {
                const selectedOptions = Array.from(element.selectedOptions).map(option => option.value);
                formData[element.name] = selectedOptions;
            } else {
                formData[element.name] = element.value;
            }
        }
        
        return formData;
    }
    
    /**
     * Validate the form
     * @returns {boolean} - True if valid, false otherwise
     */
    validate() {
        this.clearErrors();
        this.errors = {};
        let isValid = true;
        
        // Loop through all rules
        for (const fieldName in this.rules) {
            const fieldRules = this.rules[fieldName];
            const field = this.form.elements[fieldName];
            
            if (!field) continue;
            
            const value = field.type === 'checkbox' ? field.checked : field.value;
            
            // Apply each rule to the field
            for (const rule of fieldRules) {
                const error = this.applyRule(rule, value, fieldName);
                
                if (error) {
                    this.addError(fieldName, error);
                    isValid = false;
                    break;
                }
            }
        }
        
        return isValid;
    }
    
    /**
     * Apply a validation rule
     * @param {object} rule - Rule to apply
     * @param {*} value - Field value
     * @param {string} fieldName - Field name
     * @returns {string|null} - Error message or null if valid
     */
    applyRule(rule, value, fieldName) {
        switch (rule.type) {
            case 'required':
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return rule.message || 'This field is required';
                }
                break;
                
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    return rule.message || 'Please enter a valid email address';
                }
                break;
                
            case 'minLength':
                if (value && value.length < rule.value) {
                    return rule.message || `Please enter at least ${rule.value} characters`;
                }
                break;
                
            case 'maxLength':
                if (value && value.length > rule.value) {
                    return rule.message || `Please enter no more than ${rule.value} characters`;
                }
                break;
                
            case 'pattern':
                if (value && !rule.value.test(value)) {
                    return rule.message || 'Please enter a valid value';
                }
                break;
                
            case 'min':
                if (value && parseFloat(value) < rule.value) {
                    return rule.message || `Please enter a value greater than or equal to ${rule.value}`;
                }
                break;
                
            case 'max':
                if (value && parseFloat(value) > rule.value) {
                    return rule.message || `Please enter a value less than or equal to ${rule.value}`;
                }
                break;
                
            case 'match':
                const matchField = this.form.elements[rule.field];
                if (matchField && value !== matchField.value) {
                    return rule.message || `This field must match ${rule.field}`;
                }
                break;
                
            case 'custom':
                if (typeof rule.validate === 'function') {
                    const formData = this.getFormData();
                    return rule.validate(value, formData);
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Check if a string is a valid email address
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Add an error for a field
     * @param {string} fieldName - Field name
     * @param {string} message - Error message
     */
    addError(fieldName, message) {
        this.errors[fieldName] = message;
        
        // Find field container
        const field = this.form.elements[fieldName];
        if (!field) return;
        
        // Add error class to field
        field.classList.add('is-invalid');
        
        // Find or create error element
        let errorElement = this.form.querySelector(`[data-error-for="${fieldName}"]`);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.setAttribute('data-error-for', fieldName);
            
            // Add error element after field
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        
        errorElement.textContent = message;
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        // Remove error classes from all fields
        const fields = this.form.elements;
        
        for (let i = 0; i < fields.length; i++) {
            fields[i].classList.remove('is-invalid');
        }
        
        // Remove all error messages
        const errorElements = this.form.querySelectorAll('.form-error');
        
        errorElements.forEach(element => {
            element.parentNode.removeChild(element);
        });
    }
    
    /**
     * Get all errors
     * @returns {object} - Object containing all errors
     */
    getErrors() {
        return this.errors;
    }
}
