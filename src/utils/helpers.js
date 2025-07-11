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
  if (isNaN(points) || points < 1) {
    return 'Os pontos devem ser um número maior que zero.';
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
