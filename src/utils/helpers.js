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
