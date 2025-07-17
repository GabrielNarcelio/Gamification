// Utilitários diversos

export function formatDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function validateRequired(value, fieldName) {
  if (!value.trim()) {
    return `${fieldName} é obrigatório.`;
  }
  return null;
}

export function validatePoints(value) {
  const points = parseInt(value);
  if (isNaN(points) || points < 0) {
    return 'Os pontos devem ser um número maior ou igual a zero.';
  }
  return null;
}

export function validateTaskPoints(value) {
  const points = parseInt(value);
  if (isNaN(points)) {
    return 'Os pontos devem ser um número válido.';
  }
  if (points < 1) {
    return 'Os pontos devem ser pelo menos 1.';
  }
  if (points > 1000) {
    return 'Os pontos não podem exceder 1000.';
  }
  return null;
}

export function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function createLoadingButton(button, loadingText) {
  const originalText = button.textContent || '';
  const originalDisabled = button.disabled;
  
  button.textContent = loadingText;
  button.disabled = true;
  
  return () => {
    button.textContent = originalText;
    button.disabled = originalDisabled;
  };
}

// ===== ADDITIONAL UTILITY FUNCTIONS =====

/**
 * Format number with thousands separator
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return num.toLocaleString('pt-BR');
}

/**
 * Show confirmation dialog with custom message
 */
export function showConfirmDialog(message, onConfirm, onCancel) {
  const result = confirm(message);
  if (result && onConfirm) {
    onConfirm();
  } else if (!result && onCancel) {
    onCancel();
  }
  return result;
}

/**
 * Generate unique ID for elements
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate time ago from timestamp
 */
export function timeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  
  try {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 30) return `${diffDays}d atrás`;
    
    return formatDate(timestamp);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Download data as JSON file
 */
export function downloadAsJson(data, filename = 'data.json') {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading JSON:', error);
    return false;
  }
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvString, headers) {
  try {
    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headerLine = headers || lines[0].split(',').map(h => h.trim());
    const dataLines = headers ? lines : lines.slice(1);
    
    return dataLines.map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headerLine.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// ===== ENHANCED VALIDATION FUNCTIONS =====

/**
 * Comprehensive form validation
 */
export const ValidationRules = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} é obrigatório`;
    }
    return null;
  },

  minLength: (min) => (value, fieldName) => {
    if (value && value.length < min) {
      return `${fieldName} deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName) => {
    if (value && value.length > max) {
      return `${fieldName} deve ter no máximo ${max} caracteres`;
    }
    return null;
  },

  email: (value, fieldName) => {
    if (value && !isValidEmail(value)) {
      return `${fieldName} deve ser um email válido`;
    }
    return null;
  },

  numeric: (value, fieldName) => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} deve ser um número válido`;
    }
    return null;
  },

  positiveNumber: (value, fieldName) => {
    const num = Number(value);
    if (value && (isNaN(num) || num <= 0)) {
      return `${fieldName} deve ser um número positivo`;
    }
    return null;
  },

  range: (min, max) => (value, fieldName) => {
    const num = Number(value);
    if (value && (!isNaN(num) && (num < min || num > max))) {
      return `${fieldName} deve estar entre ${min} e ${max}`;
    }
    return null;
  },

  pattern: (regex, message) => (value, fieldName) => {
    if (value && !regex.test(value)) {
      return message || `${fieldName} tem formato inválido`;
    }
    return null;
  },

  custom: (validatorFn, message) => (value, fieldName) => {
    if (value && !validatorFn(value)) {
      return message || `${fieldName} é inválido`;
    }
    return null;
  }
};

/**
 * Validate field with multiple rules
 */
export function validateField(value, fieldName, rules = []) {
  for (const rule of rules) {
    const error = rule(value, fieldName);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validate entire form object
 */
export function validateForm(formData, validationSchema) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(validationSchema)) {
    const value = formData[fieldName];
    const error = validateField(value, fieldName, rules);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Real-time form validation helper
 */
export function createFormValidator(validationSchema) {
  const errors = {};
  const validators = {};

  // Create individual field validators
  for (const fieldName of Object.keys(validationSchema)) {
    validators[fieldName] = (value) => {
      const rules = validationSchema[fieldName];
      const error = validateField(value, fieldName, rules);
      
      if (error) {
        errors[fieldName] = error;
      } else {
        delete errors[fieldName];
      }
      
      return error;
    };
  }

  return {
    validateField: (fieldName, value) => validators[fieldName]?.(value),
    validateAll: (formData) => validateForm(formData, validationSchema),
    getErrors: () => ({ ...errors }),
    hasErrors: () => Object.keys(errors).length > 0,
    clearErrors: () => {
      for (const key of Object.keys(errors)) {
        delete errors[key];
      }
    }
  };
}

// ===== ENHANCED UI UTILITIES =====

/**
 * Smart form field error display
 */
export function showFieldError(fieldElement, message) {
  // Remove existing error
  clearFieldError(fieldElement);
  
  if (!message) return;
  
  // Add error class
  fieldElement.classList.add('error');
  
  // Create error message element
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.textContent = message;
  
  // Insert after field or parent
  const container = fieldElement.closest('.form-field') || fieldElement.parentNode;
  container.appendChild(errorElement);
}

/**
 * Clear field error display
 */
export function clearFieldError(fieldElement) {
  fieldElement.classList.remove('error');
  
  const container = fieldElement.closest('.form-field') || fieldElement.parentNode;
  const errorElement = container.querySelector('.field-error');
  if (errorElement) {
    errorElement.remove();
  }
}

/**
 * Enhanced loading state management
 */
export function createAdvancedLoader(element, options = {}) {
  const {
    text = 'Carregando...',
    spinner = true,
    overlay = true,
    className = ''
  } = options;

  const originalContent = element.innerHTML;
  const originalStyle = element.style.cssText;
  
  // Create loader HTML
  const loaderHTML = `
    <div class="advanced-loader ${className}">
      ${overlay ? '<div class="loader-overlay"></div>' : ''}
      <div class="loader-content">
        ${spinner ? '<div class="loader-spinner"></div>' : ''}
        <div class="loader-text">${text}</div>
      </div>
    </div>
  `;
  
  // Apply loading state
  element.innerHTML = loaderHTML;
  element.classList.add('loading-state');
  
  return {
    updateText: (newText) => {
      const textElement = element.querySelector('.loader-text');
      if (textElement) textElement.textContent = newText;
    },
    finish: () => {
      element.innerHTML = originalContent;
      element.style.cssText = originalStyle;
      element.classList.remove('loading-state');
    }
  };
}

/**
 * Enhanced tooltip system
 */
export function addTooltip(element, content, options = {}) {
  const {
    position = 'top',
    trigger = 'hover',
    delay = 200,
    className = ''
  } = options;

  let tooltip = null;
  let showTimeout = null;
  let hideTimeout = null;

  const showTooltip = (e) => {
    if (showTimeout) clearTimeout(showTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);

    showTimeout = setTimeout(() => {
      // Remove existing tooltip
      if (tooltip) tooltip.remove();

      // Create new tooltip
      tooltip = document.createElement('div');
      tooltip.className = `tooltip tooltip-${position} ${className}`;
      tooltip.innerHTML = content;
      document.body.appendChild(tooltip);

      // Position tooltip
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left, top;
      
      switch (position) {
        case 'top':
          left = rect.left + (rect.width - tooltipRect.width) / 2;
          top = rect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          left = rect.left + (rect.width - tooltipRect.width) / 2;
          top = rect.bottom + 8;
          break;
        case 'left':
          left = rect.left - tooltipRect.width - 8;
          top = rect.top + (rect.height - tooltipRect.height) / 2;
          break;
        case 'right':
          left = rect.right + 8;
          top = rect.top + (rect.height - tooltipRect.height) / 2;
          break;
      }

      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
      tooltip.classList.add('tooltip-visible');
    }, delay);
  };

  const hideTooltip = () => {
    if (showTimeout) clearTimeout(showTimeout);
    
    hideTimeout = setTimeout(() => {
      if (tooltip) {
        tooltip.classList.remove('tooltip-visible');
        setTimeout(() => {
          if (tooltip) tooltip.remove();
          tooltip = null;
        }, 200);
      }
    }, 100);
  };

  if (trigger === 'hover') {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  } else if (trigger === 'click') {
    element.addEventListener('click', showTooltip);
    document.addEventListener('click', (e) => {
      if (!element.contains(e.target)) hideTooltip();
    });
  }

  return {
    destroy: () => {
      element.removeEventListener('mouseenter', showTooltip);
      element.removeEventListener('mouseleave', hideTooltip);
      element.removeEventListener('click', showTooltip);
      if (tooltip) tooltip.remove();
    },      updateContent: (newContent) => {
        content = newContent;
        if (tooltip) tooltip.innerHTML = newContent;
      }
    };
  }

// ===== DOM SAFETY UTILITIES =====

/**
 * Safe DOM manipulation with protection against missing elements
 */
export function safeUpdateElement(selector, container, updateFn) {
  try {
    const element = container.querySelector(selector);
    if (element && typeof updateFn === 'function') {
      updateFn(element);
      return true;
    } else if (!element) {
      console.warn(`🔍 Element not found: ${selector}`);
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating element ${selector}:`, error);
    return false;
  }
}

/**
 * Safe text content update
 */
export function safeSetTextContent(selector, container, text) {
  return safeUpdateElement(selector, container, (element) => {
    element.textContent = text;
  });
}

/**
 * Safe innerHTML update
 */
export function safeSetInnerHTML(selector, container, html) {
  return safeUpdateElement(selector, container, (element) => {
    element.innerHTML = html;
  });
}

/**
 * Safe style update
 */
export function safeSetStyle(selector, container, property, value) {
  return safeUpdateElement(selector, container, (element) => {
    element.style[property] = value;
  });
}

/**
 * Protected state change handler wrapper
 */
export function createSafeStateHandler(handlerFunction, componentName = 'Component') {
  return function(state) {
    try {
      handlerFunction.call(this, state);
    } catch (error) {
      console.error(`❌ Error in ${componentName} handleStateChange:`, error);
      // Don't rethrow to prevent breaking other listeners
    }
  };
}
