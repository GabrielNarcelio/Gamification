// Seletor de Emojis para Conquistas

export class EmojiPicker {
  constructor() {
    this.emojis = {
      trofeus: ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎', '⭐', '🌟', '✨', '🎯'],
      esportes: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🥋', '🏋️', '🤾'],
      atividades: ['🎨', '🎵', '🎭', '🎪', '🎲', '🎯', '🎳', '🎮', '🎰', '🎊', '🎉', '🎈'],
      trabalho: ['💼', '📊', '📈', '📋', '📝', '🖥️', '💻', '📱', '⌚', '🔧', '🛠️', '⚙️'],
      natureza: ['🌱', '🌲', '🌳', '🌿', '🍀', '🌺', '🌸', '🌼', '🌻', '🌷', '🌹', '🌵'],
      comida: ['🍎', '🍌', '🍓', '🍇', '🍊', '🍋', '🥝', '🍑', '🍒', '🥭', '🍍', '🥥'],
      animais: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
      objetos: ['🔥', '⚡', '💧', '❄️', '☀️', '🌙', '⭐', '💫', '☁️', '🌈', '🎆', '🎇'],
      simbolos: ['💯', '✅', '❌', '❗', '❓', '❤️', '💚', '💙', '💜', '🧡', '💛', '🖤'],
      bandeiras: ['🎌', '🏁', '🏴', '🏳️', '🚩', '🏴‍☠️', '🎪', '🎭', '🎨', '🎯', '🎲', '🎮']
    };
    
    this.currentCategory = 'trofeus';
    this.onEmojiSelect = null;
  }

  render() {
    return `
      <div class="emoji-picker" id="emoji-picker" style="display: none;">
        <div class="emoji-picker-header">
          <h4>Escolher Emoji</h4>
          <button class="emoji-picker-close" id="emoji-picker-close">&times;</button>
        </div>
        
        <div class="emoji-categories">
          ${Object.keys(this.emojis).map(category => `
            <button class="emoji-category-btn ${category === this.currentCategory ? 'active' : ''}" 
                    data-category="${category}">
              ${this.getCategoryIcon(category)}
            </button>
          `).join('')}
        </div>
        
        <div class="emoji-grid" id="emoji-grid">
          ${this.renderEmojiGrid()}
        </div>
      </div>
    `;
  }

  getCategoryIcon(category) {
    const icons = {
      trofeus: '🏆',
      esportes: '⚽',
      atividades: '🎨',
      trabalho: '💼',
      natureza: '🌱',
      comida: '🍎',
      animais: '🐶',
      objetos: '🔥',
      simbolos: '💯',
      bandeiras: '🎌'
    };
    return icons[category] || '😀';
  }

  getCategoryName(category) {
    const names = {
      trofeus: 'Troféus',
      esportes: 'Esportes',
      atividades: 'Atividades',
      trabalho: 'Trabalho',
      natureza: 'Natureza',
      comida: 'Comida',
      animais: 'Animais',
      objetos: 'Objetos',
      simbolos: 'Símbolos',
      bandeiras: 'Bandeiras'
    };
    return names[category] || category;
  }

  renderEmojiGrid() {
    const emojis = this.emojis[this.currentCategory] || [];
    return `
      <div class="emoji-grid-header">
        <span class="category-name">${this.getCategoryName(this.currentCategory)}</span>
      </div>
      <div class="emoji-grid-content">
        ${emojis.map(emoji => `
          <button class="emoji-btn" data-emoji="${emoji}" title="${emoji}">
            ${emoji}
          </button>
        `).join('')}
      </div>
    `;
  }

  setupEventListeners(container) {
    const picker = container.querySelector('#emoji-picker');
    const closeBtn = container.querySelector('#emoji-picker-close');
    const categoryBtns = container.querySelectorAll('.emoji-category-btn');
    const emojiGrid = container.querySelector('#emoji-grid');

    // Fechar picker
    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Fechar clicando fora
    picker?.addEventListener('click', (e) => {
      if (e.target === picker) {
        this.hide();
      }
    });

    // Mudança de categoria
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.dataset.category;
        this.changeCategory(category, container);
      });
    });

    // Seleção de emoji
    emojiGrid?.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const emoji = e.target.dataset.emoji;
        this.selectEmoji(emoji);
      }
    });

    // ESC para fechar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && picker.style.display !== 'none') {
        this.hide();
      }
    });
  }

  changeCategory(category, container) {
    this.currentCategory = category;
    
    // Atualizar botões de categoria
    container.querySelectorAll('.emoji-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    // Atualizar grid
    const emojiGrid = container.querySelector('#emoji-grid');
    emojiGrid.innerHTML = this.renderEmojiGrid();
  }

  selectEmoji(emoji) {
    if (this.onEmojiSelect) {
      this.onEmojiSelect(emoji);
    }
    this.hide();
  }

  show(onSelect) {
    this.onEmojiSelect = onSelect;
    const picker = document.querySelector('#emoji-picker');
    if (picker) {
      picker.style.display = 'flex';
      
      // Foco no primeiro emoji
      setTimeout(() => {
        const firstEmoji = picker.querySelector('.emoji-btn');
        firstEmoji?.focus();
      }, 100);
    }
  }

  hide() {
    const picker = document.querySelector('#emoji-picker');
    if (picker) {
      picker.style.display = 'none';
    }
  }

  // Método estático para buscar emojis
  static searchEmojis(query) {
    const picker = new EmojiPicker();
    const allEmojis = [];
    
    Object.values(picker.emojis).forEach(categoryEmojis => {
      allEmojis.push(...categoryEmojis);
    });
    
    // Para busca simples, retornar todos os emojis se não houver query
    return query ? allEmojis.filter(emoji => 
      emoji.includes(query) || 
      emoji.codePointAt(0).toString().includes(query)
    ) : allEmojis;
  }
}
