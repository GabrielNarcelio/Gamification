// Utilitários diversos

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName} é obrigatório.`;
  }
  return null;
}

export function validatePoints(value: string): string | null {
  const points = parseInt(value);
  if (isNaN(points) || points < 0) {
    return 'Os pontos devem ser um número maior ou igual a zero.';
  }
  return null;
}

export function validateTaskPoints(value: string): string | null {
  const points = parseInt(value);
  if (isNaN(points) || points < 1) {
    return 'Os pontos devem ser um número maior que zero.';
  }
  return null;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function createLoadingButton(button: HTMLButtonElement, loadingText: string): () => void {
  const originalText = button.textContent || '';
  const originalDisabled = button.disabled;
  
  button.textContent = loadingText;
  button.disabled = true;
  
  return () => {
    button.textContent = originalText;
    button.disabled = originalDisabled;
  };
}
