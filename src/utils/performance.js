// Performance utilities and optimizations

/**
 * Lazy loading utility for components
 */
export class LazyLoader {
  constructor() {
    this.observers = new Map();
    this.loadedComponents = new Set();
  }

  /**
   * Lazy load a component when it enters viewport
   */
  observeComponent(element, loader, options = {}) {
    const {
      threshold = 0.1,
      rootMargin = '50px',
      once = true
    } = options;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadComponent(element, loader);
          if (once) {
            observer.unobserve(element);
          }
        }
      });
    }, {
      threshold,
      rootMargin
    });

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Load component and cache it
   */
  async loadComponent(element, loader) {
    const componentId = element.dataset.componentId || element.id;
    
    if (this.loadedComponents.has(componentId)) {
      return;
    }

    try {
      element.classList.add('component-loading');
      await loader(element);
      this.loadedComponents.add(componentId);
      element.classList.remove('component-loading');
      element.classList.add('component-loaded');
    } catch (error) {
      console.error('Error loading component:', error);
      element.classList.remove('component-loading');
      element.classList.add('component-error');
    }
  }

  /**
   * Cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Image lazy loading with progressive enhancement
 */
export class ImageLazyLoader {
  constructor() {
    this.imageObserver = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.imageObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
    }
  }

  /**
   * Add image to lazy loading queue
   */
  observe(img) {
    if (this.imageObserver) {
      this.imageObserver.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Load image with progressive enhancement
   */
  loadImage(img) {
    const src = img.dataset.src || img.src;
    const placeholder = img.dataset.placeholder;

    // Show placeholder while loading
    if (placeholder && !img.src) {
      img.src = placeholder;
    }

    // Create new image to preload
    const newImg = new Image();
    
    newImg.onload = () => {
      img.src = src;
      img.classList.add('image-loaded');
      img.classList.remove('image-loading');
    };

    newImg.onerror = () => {
      img.classList.add('image-error');
      img.classList.remove('image-loading');
      // Set fallback image if available
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };

    img.classList.add('image-loading');
    newImg.src = src;
  }

  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }

  /**
   * Start timing an operation
   */
  startTimer(name) {
    this.metrics[name] = {
      start: performance.now(),
      end: null,
      duration: null
    };
  }

  /**
   * End timing an operation
   */
  endTimer(name) {
    if (this.metrics[name]) {
      this.metrics[name].end = performance.now();
      this.metrics[name].duration = this.metrics[name].end - this.metrics[name].start;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals() {
    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  /**
   * Log performance report
   */
  logReport() {
    console.group('🔍 Performance Report');
    console.table(this.metrics);
    console.groupEnd();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Memory management utility
 */
export class MemoryManager {
  constructor() {
    this.cleanupTasks = [];
    this.intervalId = null;
    this.autoCleanup = false;
  }

  /**
   * Add cleanup task
   */
  addCleanupTask(task, description = '') {
    this.cleanupTasks.push({ task, description });
  }

  /**
   * Execute all cleanup tasks
   */
  cleanup() {
    console.log('🧹 Running memory cleanup...');
    let cleaned = 0;

    this.cleanupTasks.forEach(({ task, description }, index) => {
      try {
        task();
        cleaned++;
        if (description) {
          console.log(`✅ Cleaned: ${description}`);
        }
      } catch (error) {
        console.error(`❌ Cleanup failed for task ${index}:`, error);
      }
    });

    console.log(`🧹 Cleanup complete: ${cleaned}/${this.cleanupTasks.length} tasks executed`);
  }

  /**
   * Enable automatic cleanup
   */
  enableAutoCleanup(intervalMs = 300000) { // 5 minutes default
    this.autoCleanup = true;
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Disable automatic cleanup
   */
  disableAutoCleanup() {
    this.autoCleanup = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get memory usage info (if available)
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedPercentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  }

  destroy() {
    this.disableAutoCleanup();
    this.cleanup();
    this.cleanupTasks = [];
  }
}

/**
 * Cache management utility
 */
export class CacheManager {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  /**
   * Set cache entry
   */
  set(key, value, ttl = null) {
    // Remove if already exists to update access order
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }

    // Add new entry
    const entry = {
      value,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Get cache entry
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update access order
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usagePercentage: Math.round((this.cache.size / this.maxSize) * 100),
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Global performance utilities instance
 */
export const performanceUtils = {
  lazyLoader: new LazyLoader(),
  imageLoader: new ImageLazyLoader(),
  monitor: new PerformanceMonitor(),
  memory: new MemoryManager(),
  cache: new CacheManager()
};

// Auto-initialize performance monitoring
performanceUtils.monitor.monitorWebVitals();

// Auto-enable memory cleanup in development
if (window.location.hostname === 'localhost') {
  performanceUtils.memory.enableAutoCleanup();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceUtils.lazyLoader.destroy();
  performanceUtils.imageLoader.destroy();
  performanceUtils.monitor.destroy();
  performanceUtils.memory.destroy();
});
